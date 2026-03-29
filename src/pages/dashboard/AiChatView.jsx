import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    Send, Bot, User, Loader2, Sparkles, CheckCircle, XCircle, 
    Plus, MessageSquare, PanelLeft, ArrowLeft 
} from "lucide-react";
import { 
    collection, doc, onSnapshot, addDoc, updateDoc, 
    query, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "../../firebase";

export default function AiChatView() {
    const navigate = useNavigate();
    
    // Core State
    const [chatHistory, setChatHistory] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [activeExecution, setActiveExecution] = useState(null);

    // Dynamic Messages State
    const defaultWelcome = {
        id: 'welcome',
        role: 'system',
        content: "Hi! I am the WebPilot AI. Tell me what you want to automate, and I will build and run it for you. Try asking me to **Post to LinkedIn** or **Upload to YouTube**.",
        timestamp: new Date().toISOString()
    };
    
    const [messages, setMessages] = useState([defaultWelcome]);
    const messagesEndRef = useRef(null);

    // Authentication State
    const [userPhoto, setUserPhoto] = useState(null);

    useEffect(() => {
        if (auth.currentUser?.photoURL) {
            setUserPhoto(auth.currentUser.photoURL);
        }
    }, [auth.currentUser]);

    // Auto-Scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeExecution, isTyping]);

    // Listen to ALL user chats to populate the sidebar
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, "users", auth.currentUser.uid, "ai_chats"),
            orderBy("updatedAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChatHistory(chats);
        });

        return () => unsubscribe();
    }, []);

    // Load a specific chat when clicked
    const loadChat = (chatId) => {
        const chat = chatHistory.find(c => c.id === chatId);
        if (chat) {
            setActiveChatId(chatId);
            setMessages(chat.messages || [defaultWelcome]);
            setActiveExecution(null); // Reset execution view banner
            setIsSidebarOpen(window.innerWidth > 768); // Auto-hide sidebar on mobile
        }
    };

    const startNewChat = () => {
        setActiveChatId(null);
        setMessages([defaultWelcome]);
        setActiveExecution(null);
        setIsSidebarOpen(window.innerWidth > 768);
    };

    // Helper to persist message Array specifically to Firebase
    const saveMessagesToChat = async (newMessagesArray, chatIdOverride = null) => {
        const targetChatId = chatIdOverride || activeChatId;
        if (!auth.currentUser || !targetChatId) return;

        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", targetChatId), {
                messages: newMessagesArray,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving chat:", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isTyping || activeExecution?.status === "Running") return;
        if (!auth.currentUser) return;

        // 1. Generate new message metadata
        const userContent = prompt.trim();
        const userMsg = { 
            id: Date.now().toString(), 
            role: "user", 
            content: userContent, 
            timestamp: new Date().toISOString() 
        };
        
        // 2. Clear input & Set Typing
        setPrompt("");
        setIsTyping(true);

        let currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        
        // 3. Document Creation (If this is a new chat, create it now!)
        let currentChatId = activeChatId;
        if (!currentChatId) {
            // Generate a small title based on the first prompt
            const chatTitle = userContent.length > 30 ? userContent.substring(0, 30) + "..." : userContent;
            
            const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "ai_chats"), {
                title: chatTitle,
                messages: currentMessages,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            currentChatId = docRef.id;
            setActiveChatId(currentChatId);
        } else {
            // Persist User Message to existing chat
            await saveMessagesToChat(currentMessages, currentChatId);
        }

        // 4. API Call
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt: userContent }),
            });

            const data = await res.json();
            setIsTyping(false);

            if (!data.success) {
                const errorMsg = {
                    id: Date.now().toString(),
                    role: "system",
                    content: data.error || "I ran into an issue finding or processing that feature.",
                    isError: true,
                    timestamp: new Date().toISOString()
                };
                currentMessages = [...currentMessages, errorMsg];
                setMessages(currentMessages);
                saveMessagesToChat(currentMessages, currentChatId);
                return;
            }

            // Immediately add AI's response acknowledging the command
            const aiMsg = {
                id: Date.now().toString(),
                role: "system",
                content: data.message || `Starting ${data.templateTitle} automation...`,
                templateTitle: data.templateTitle,
                timestamp: new Date().toISOString()
            };
            currentMessages = [...currentMessages, aiMsg];
            setMessages(currentMessages);
            saveMessagesToChat(currentMessages, currentChatId);

            // Track execution status (pass down the Chat ID to save the final result later)
            if (data.executionId) {
                trackExecution(data.executionId, currentChatId, currentMessages);
            }

        } catch (error) {
            setIsTyping(false);
            const hardErrorMsg = {
                id: Date.now().toString(),
                role: "system",
                content: "Network error communicating with AI endpoint.",
                isError: true,
                timestamp: new Date().toISOString()
            };
            currentMessages = [...currentMessages, hardErrorMsg];
            setMessages(currentMessages);
            saveMessagesToChat(currentMessages, currentChatId);
        }
    };

    // Tracks N8N workflow execution dynamically
    const trackExecution = (executionId, chatId, startingMessagesArray) => {
        if (!auth.currentUser) return;

        setActiveExecution({ id: executionId, status: "Running" });

        const docRef = doc(db, "users", auth.currentUser.uid, "execution_logs", executionId);
        
        const unsubscribe = onSnapshot(docRef, async (snap) => {
            if (snap.exists()) {
                const logData = snap.data();
                setActiveExecution(prev => ({ ...prev, ...logData, id: executionId }));

                if (logData.status === "Success" || logData.status === "Failed") {
                    unsubscribe();
                    
                    // Add final result message to chat
                    const resultMsg = {
                        id: Date.now().toString(),
                        role: "system",
                        content: logData.status === "Success" 
                            ? `Execution complete! [View Log details](/execution-logs)`
                            : `Execution failed: ${logData.message}`,
                        isResult: true,
                        success: logData.status === "Success",
                        executionId,
                        timestamp: new Date().toISOString()
                    };

                    setMessages(prev => {
                        // In case the user typed more while waiting, append to whatever the latest state is!
                        const latestMessages = [...prev, resultMsg];
                        saveMessagesToChat(latestMessages, chatId);
                        return latestMessages;
                    });
                    
                    setActiveExecution(null); // Clear active status banner
                }
            } else {
                unsubscribe();
                setActiveExecution(null);
            }
        });
    };

    return (
        <div className="flex h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden font-sans">
            
            {/* ── SIDEBAR (Chat History) ────────────────────────────────────────── */}
            <div className={`
                absolute md:relative z-40 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
                flex flex-col transition-all duration-300 ease-in-out h-full
                ${isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-0"}
            `}>
                <div className="p-4 flex-shrink-0">
                    <button 
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={18} />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4">
                    <div className="text-xs font-semibold text-gray-400 px-2 mb-2 mt-2 uppercase tracking-wider">Recent</div>
                    {chatHistory.length === 0 ? (
                        <p className="text-xs text-gray-500 px-2 py-4">No recent chats.</p>
                    ) : (
                        chatHistory.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => loadChat(chat.id)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors overflow-hidden group mb-1 ${
                                    activeChatId === chat.id 
                                    ? "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white" 
                                    : "hover:bg-gray-200/50 dark:hover:bg-zinc-800/50 text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                <MessageSquare size={16} className="shrink-0 opacity-70" />
                                <span className="text-sm truncate pr-2">{chat.title || "Untitled Chat"}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── MAIN CHAT AREA ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative bg-white dark:bg-[#0a0a0a]">
                
                {/* Header Navbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <PanelLeft size={20} />
                        </button>
                        
                        {/* Go Back to Dashboard Logo Link */}
                        <div 
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <Sparkles className="text-white w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">WebPilot AI</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/dashboard"
                            className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        {userPhoto ? (
                            <img src={userPhoto} alt="User" className="w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-700" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages Viewport */}
                <div className="flex-1 overflow-y-auto w-full">
                    {/* Centered Constrained Container */}
                    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-24">
                        
                        {messages.length === 1 && !activeChatId && (
                           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                               <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
                                   <Sparkles className="text-white w-8 h-8" />
                               </div>
                               <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Hi, {auth.currentUser?.displayName?.split(" ")[0] || "User"}</h2>
                               <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md">What task do you want to automate today?</p>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                   <button onClick={() => setPrompt("Post a tech update on LinkedIn")} className="text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all bg-white dark:bg-zinc-900 shadow-sm hover:shadow">
                                       <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Post to LinkedIn</span>
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Schedule an automated post update</span>
                                   </button>
                                   <button onClick={() => setPrompt("Upload WebPilot Overview video to YouTube")} className="text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all bg-white dark:bg-zinc-900 shadow-sm hover:shadow">
                                       <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Upload to YouTube</span>
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Automate media uploads securely</span>
                                   </button>
                               </div>
                           </div> 
                        )}

                        {messages.map((msg) => {
                            if (msg.role === 'system' && msg.id === 'welcome' && !activeChatId) return null; // Hide welcome card once they start chatting natively
                            return (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[90%] md:max-w-[85%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    
                                    {/* Avatar */}
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                                        msg.role === 'user' 
                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300' 
                                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                                    }`}>
                                        {msg.role === 'user' && userPhoto ? (
                                            <img src={userPhoto} alt="User" className="w-full h-full rounded-full" />
                                        ) : msg.role === 'user' ? (
                                            <User size={16} />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                        <div className={`px-5 py-4 w-full rounded-2xl ${
                                            msg.role === 'user'
                                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-tr-sm'
                                            : msg.isError 
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-tl-sm'
                                                : msg.isResult
                                                    ? msg.success
                                                        ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-tl-sm text-green-800 dark:text-green-300 shadow-sm'
                                                        : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-tl-sm text-red-800 dark:text-red-300 shadow-sm'
                                                    : 'bg-transparent text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                        }`}>
                                            
                                            {msg.isResult && (
                                                <div className="flex items-center gap-2 mb-2 font-semibold">
                                                    {msg.success ? <CheckCircle size={18} className="text-green-600 dark:text-green-400"/> : <XCircle size={18} className="text-red-600 dark:text-red-400"/>}
                                                    {msg.success ? 'Execution Successful' : 'Execution Failed'}
                                                </div>
                                            )}

                                            {/* Content handling - support markdown links & bolding */}
                                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                                                {msg.content.split(/(\[.*?\]\(.*?\))/g).map((chunk, i) => {
                                                    const match = chunk.match(/\[(.*?)\]\((.*?)\)/);
                                                    if (match) {
                                                        if (match[2].startsWith('/')) {
                                                            return <Link key={i} to={match[2]} className="underline font-semibold hover:text-blue-500 transition-colors text-blue-600 dark:text-blue-400">{match[1]}</Link>;
                                                        }
                                                        return <a key={i} href={match[2]} target="_blank" rel="noreferrer" className="underline font-semibold hover:text-blue-500 transition-colors text-blue-600 dark:text-blue-400">{match[1]}</a>;
                                                    }
                                                    // Bold formatting
                                                    return chunk.split(/(\*\*.*?\*\*)/g).map((sub, j) => {
                                                        const boldMatch = sub.match(/\*\*(.*?)\*\*/);
                                                        if (boldMatch) return <strong key={j} className="font-bold text-gray-900 dark:text-white">{boldMatch[1]}</strong>;
                                                        return sub;
                                                    });
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )})}
                        
                        {/* Active Execution Live Banner */}
                        {activeExecution && activeExecution.status === "Running" && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[90%] md:max-w-[70%] gap-4 flex-row">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mt-0.5 border border-indigo-100 dark:border-zinc-700 shadow-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                    </div>
                                    <div className="px-5 py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-tl-sm shadow-sm flex items-center gap-3 w-64 md:w-96">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 truncate">
                                                {activeExecution.automationName || "Executing Automation"}
                                            </p>
                                            <p className="text-[13px] font-medium text-indigo-700/80 dark:text-indigo-400/80 truncate mt-1">
                                                {activeExecution.message || "Running workflow nodes natively in background..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Thinking Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                                        <Sparkles size={16} className="text-white" />
                                    </div>
                                    <div className="px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 rounded-tl-sm flex gap-1.5 items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* Main Input Form Area (Sticky at Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] pt-10 pb-6 md:pb-8 px-4 w-full">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
                        <div className="relative shadow-sm hover:shadow-md transition-shadow dark:shadow-none bg-white dark:bg-zinc-800 rounded-3xl border border-gray-200 dark:border-zinc-700 focus-within:border-gray-300 dark:focus-within:border-zinc-500">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={(activeExecution && activeExecution.status === "Running") 
                                    ? "Waiting for execution to finish..." 
                                    : "Ask WebPilot something..."}
                                disabled={isTyping || (activeExecution && activeExecution.status === "Running")}
                                className="w-full pl-6 pr-14 py-4 md:py-5 bg-transparent text-[15px] focus:outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                                <button
                                    type="submit"
                                    disabled={!prompt.trim() || isTyping || (activeExecution && activeExecution.status === "Running")}
                                    className="p-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-900 transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Send size={18} className={isTyping ? "opacity-0" : "opacity-100 transform translate-x-[-1px] translate-y-[1px]"} />
                                    {isTyping && <Loader2 size={18} className="absolute inset-0 m-auto animate-spin text-white dark:text-black" />}
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-3 mb-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">WebPilot AI can make mistakes. Check important automations.</p>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
