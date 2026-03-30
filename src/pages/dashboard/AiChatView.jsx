import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Send, Loader2, Sparkles, CheckCircle, XCircle,
    Plus, MessageSquare, PanelLeft, Settings, LogOut,
    MoreHorizontal, Pencil, Trash2, ChevronRight
} from "lucide-react";
import {
    collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc,
    query, orderBy, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";



export default function AiChatView() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // ── Core State ──────────────────────────────────────────────────────────
    const [chatHistory, setChatHistory] = useState([]);
    const [activeChatId, setActiveChatIdRaw] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [activeExecution, setActiveExecution] = useState(null);
    const isSendingRef = useRef(false);
    const textareaRef = useRef(null);

    // ── Rename / Delete / Context Menu ───────────────────────────────────────
    const [contextMenu, setContextMenu] = useState(null); // { chatId, x, y }
    const [renamingChatId, setRenamingChatId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const renameInputRef = useRef(null);
    const contextMenuRef = useRef(null);
    const [deleteConfirmChatId, setDeleteConfirmChatId] = useState(null); // chat awaiting delete confirm

    // ── Profile Dropdown ─────────────────────────────────────────────────────
    const [profileOpen, setProfileOpen] = useState(false);
    const profileBtnRef = useRef(null);
    const profileMenuRef = useRef(null);

    // ── Theme ────────────────────────────────────────────────────────────────
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    const defaultWelcome = {
        id: "welcome",
        role: "system",
        content: "Hi! I am the WebPilot AI. Tell me what you want to automate, and I will build and run it for you. Try asking me to **Post to LinkedIn** or **Upload to YouTube**.",
        timestamp: new Date().toISOString()
    };

    const [messages, setMessages] = useState([defaultWelcome]);
    const messagesEndRef = useRef(null);

    const avatarSrc = user?.photoURL
        ? user.photoURL
        : `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || "user")}`;

    const ADMIN_EMAILS = ["mohammedaffanrazvi604@gmail.com"];
    const isAdmin = ADMIN_EMAILS.includes(user?.email);

    // Active chat title (shows in navbar)
    const activeChatTitle = chatHistory.find(c => c.id === activeChatId)?.title || null;

    // activeChatId setter — no localStorage, always opens fresh on page load
    const setActiveChatId = useCallback((id) => {
        setActiveChatIdRaw(id);
    }, []);

    // ── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        const html = document.documentElement;
        if (theme === "dark") html.classList.add("dark");
        else html.classList.remove("dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

    // Auto-scroll to bottom
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages, activeExecution, isTyping]);

    // Sidebar chat history listener — waits for auth to be ready
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) return;
            const q = query(
                collection(db, "users", firebaseUser.uid, "ai_chats"),
                orderBy("updatedAt", "desc")
            );
            const historyUnsub = onSnapshot(q, (snapshot) => {
                setChatHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });
            // Return inner unsub; the outer unsub fires on component unmount
            return historyUnsub;
        });
        return () => unsub();
    }, []);

    // Auto-resize textarea as user types
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [prompt]);

    // Close profile menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileOpen && !profileMenuRef.current?.contains(e.target) && !profileBtnRef.current?.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [profileOpen]);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        document.addEventListener("mousedown", handler);
        document.addEventListener("scroll", handler, true);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("scroll", handler, true);
        };
    }, [contextMenu]);

    // Focus rename input when it appears
    useEffect(() => {
        if (renamingChatId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingChatId]);

    // ── Chat Actions ─────────────────────────────────────────────────────────

    const loadChat = async (chatId) => {
        if (!auth.currentUser) return;
        const chatDoc = await getDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", chatId));
        if (chatDoc.exists()) {
            setActiveChatId(chatId);
            setMessages(chatDoc.data().messages || [defaultWelcome]);
        }
        setActiveExecution(null);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    const startNewChat = () => {
        setActiveChatId(null);
        setMessages([defaultWelcome]);
        setActiveExecution(null);
    };

    // Strip undefined values from objects before writing to Firestore.
    // Firestore throws "Unsupported field value: undefined" which silently kills the save.
    const sanitizeForFirestore = (value) => {
        if (Array.isArray(value)) return value.map(sanitizeForFirestore);
        if (value !== null && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, sanitizeForFirestore(v)])
            );
        }
        return value;
    };

    const saveMessagesToChat = async (newMessages, chatIdOverride = null) => {
        const targetId = chatIdOverride || activeChatId;
        if (!auth.currentUser || !targetId) return;
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", targetId), {
                messages: sanitizeForFirestore(newMessages),
                updatedAt: serverTimestamp()
            });
        } catch (e) { console.error("Save error:", e); }
    };

    const handleRenameSubmit = async (chatId) => {
        if (!renameValue.trim() || !auth.currentUser) { setRenamingChatId(null); return; }
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", chatId), {
                title: renameValue.trim(),
                updatedAt: serverTimestamp()
            });
        } catch (e) { console.error("Rename error:", e); }
        setRenamingChatId(null);
        setRenameValue("");
    };

    const handleDeleteChat = async (chatId) => {
        if (!auth.currentUser) return;
        try {
            await deleteDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", chatId));
            if (activeChatId === chatId) startNewChat();
        } catch (e) { console.error("Delete error:", e); }
        setDeleteConfirmChatId(null);
        setContextMenu(null);
    };

    // ── Send Message ─────────────────────────────────────────────────────────

    const handleSend = async (e) => {
        e.preventDefault();
        if (isSendingRef.current || !prompt.trim() || activeExecution?.status === "Running") return;
        if (!auth.currentUser) return;

        isSendingRef.current = true;
        const userContent = prompt.trim();
        const userMsg = { id: `user_${Date.now()}`, role: "user", content: userContent, timestamp: new Date().toISOString() };

        setPrompt("");
        setIsTyping(true);

        let currentMessages = [...messages, userMsg];
        setMessages(currentMessages);

        let currentChatId = activeChatId;
        if (!currentChatId) {
            const chatTitle = userContent.length > 42 ? userContent.substring(0, 42) + "…" : userContent;
            const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "ai_chats"), {
                title: chatTitle,
                messages: sanitizeForFirestore(currentMessages),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            currentChatId = docRef.id;
            setActiveChatId(currentChatId);
        } else {
            await saveMessagesToChat(currentMessages, currentChatId);
        }

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prompt: userContent })
            });
            const data = await res.json();
            setIsTyping(false);

            const aiMsgId = `ai_${Date.now()}`;
            const aiMsg = {
                id: aiMsgId,
                role: "system",
                content: data.message || (data.success ? "Done!" : data.error || "Something went wrong."),
                isError: !data.success && !data.needsInput,
                templateTitle: data.templateTitle,
                needsInput: data.needsInput || false,
                isPendingResult: !!data.executionId,
                // BUILD_AUTOMATION fields
                isBuildResult: data.intent === "BUILD_AUTOMATION",
                automationId: data.automationId || null,
                automationName: data.automationName || null,
                nodeCount: data.nodeCount || 0,
                timestamp: new Date().toISOString()
            };

            currentMessages = [...currentMessages, aiMsg];
            setMessages(currentMessages);
            await saveMessagesToChat(currentMessages, currentChatId);

            if (data.executionId) {
                trackExecution(data.executionId, currentChatId, currentMessages, aiMsgId, data.templateTitle);
            }
        } catch (err) {
            setIsTyping(false);
            const errMsg = { id: `err_${Date.now()}`, role: "system", content: "Network error. Please check your connection and try again.", isError: true, timestamp: new Date().toISOString() };
            currentMessages = [...currentMessages, errMsg];
            setMessages(currentMessages);
            await saveMessagesToChat(currentMessages, currentChatId);
        } finally {
            isSendingRef.current = false;
        }
    };

    // ── Execution Tracker ────────────────────────────────────────────────────

    const trackExecution = (executionId, chatId, startingMessages, aiMsgId, templateTitle) => {
        if (!auth.currentUser) return;
        setActiveExecution({ id: executionId, status: "Running" });

        const docRef = doc(db, "users", auth.currentUser.uid, "execution_logs", executionId);
        let unsubFn;

        const timeoutTimer = setTimeout(() => {
            unsubFn?.();
            setActiveExecution(null);
            setMessages(prev => {
                const updated = prev.map(m => m.id === aiMsgId
                    ? { ...m, isPendingResult: false, isResult: true, success: false, isError: false,
                        content: "The automation is taking longer than expected. Check your [Execution Logs](/execution-logs) for status." }
                    : m);
                saveMessagesToChat(updated, chatId);
                return updated;
            });
        }, 90000);

        unsubFn = onSnapshot(docRef, (snap) => {
            if (!snap.exists()) return;
            const logData = snap.data();
            setActiveExecution(prev => ({ ...prev, ...logData, id: executionId }));

            if (logData.status === "Success" || logData.status === "Failed") {
                clearTimeout(timeoutTimer);
                unsubFn();
                const isSuccess = logData.status === "Success";
                setMessages(prev => {
                    const updated = prev.map(m => m.id === aiMsgId
                        ? { ...m, isPendingResult: false, isResult: true, success: isSuccess, isError: false,
                            resultUrl: logData.resultUrl || null, templateTitle: templateTitle || m.templateTitle }
                        : m);
                    saveMessagesToChat(updated, chatId);
                    return updated;
                });
                setActiveExecution(null);
            }
        });
    };

    // ── Render Helpers ───────────────────────────────────────────────────────

    // Render markdown-lite: **bold** and [text](url)
    const renderContent = (content) => {
        if (!content) return null;
        return content.split(/(\[.*?\]\(.*?\))/g).map((chunk, i) => {
            const linkMatch = chunk.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                if (linkMatch[2].startsWith("/")) {
                    return (
                        <span key={i} onClick={() => navigate(linkMatch[2])}
                            className="underline font-semibold cursor-pointer hover:opacity-80 transition-opacity text-current">
                            {linkMatch[1]}
                        </span>
                    );
                }
                return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer"
                    className="underline font-semibold hover:opacity-80 transition-opacity">{linkMatch[1]}</a>;
            }
            return chunk.split(/(\*\*.*?\*\*)/g).map((sub, j) => {
                const boldMatch = sub.match(/\*\*(.*?)\*\*/);
                if (boldMatch) return <strong key={j} className="font-bold">{boldMatch[1]}</strong>;
                return sub;
            });
        });
    };

    // ── JSX ──────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden font-sans">

            {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
            <div className={`absolute md:relative z-40 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800
                flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden
                ${isSidebarOpen ? "w-72" : "w-0"}`}>
                <div className={`flex flex-col h-full ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200`}>

                    {/* Sidebar header — logo + close */}
                    <div className="px-3 pt-3 pb-2 flex items-center justify-between flex-shrink-0 border-b border-gray-200 dark:border-zinc-800">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 pl-1 tracking-tight">WebPilot AI</span>
                        <button onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-colors"
                            title="Close sidebar">
                            <PanelLeft size={18} />
                        </button>
                    </div>

                    {/* New Chat button */}
                    <div className="px-3 pt-3 pb-2 flex-shrink-0">
                        <button onClick={startNewChat}
                            className="w-full flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors font-medium text-sm">
                            <Plus size={16} />
                            New Chat
                        </button>
                    </div>

                    {/* Chat history */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                        <div className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">Recent</div>
                        {chatHistory.length === 0 ? (
                            <p className="text-xs text-gray-500 px-2 py-4">No recent chats. Start a new one!</p>
                        ) : (
                            chatHistory.map(chat => (
                                <div key={chat.id} className="relative group mb-1">
                                    {renamingChatId === chat.id ? (
                                        /* Inline rename input */
                                        <div className="flex items-center gap-1 px-2 py-1">
                                            <input
                                                ref={renameInputRef}
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") handleRenameSubmit(chat.id);
                                                    if (e.key === "Escape") { setRenamingChatId(null); setRenameValue(""); }
                                                }}
                                                onBlur={() => handleRenameSubmit(chat.id)}
                                                className="flex-1 text-sm bg-white dark:bg-zinc-800 border border-indigo-400 rounded-lg px-2 py-1.5 outline-none text-gray-900 dark:text-white min-w-0"
                                                placeholder="Chat name..."
                                            />
                                        </div>
                                    ) : (
                                        /* Chat item — outer div, inner button for 3-dot menu.
                                           NOTE: Must NOT be <button> containing <button> — invalid HTML. */
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => loadChat(chat.id)}
                                            onKeyDown={e => e.key === "Enter" && loadChat(chat.id)}
                                            className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors overflow-hidden cursor-pointer select-none ${
                                                activeChatId === chat.id
                                                ? "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white"
                                                : "hover:bg-gray-100 dark:hover:bg-zinc-800/50 text-gray-600 dark:text-gray-300"
                                            }`}
                                        >
                                            <MessageSquare size={14} className="shrink-0 opacity-50" />
                                            <span className="text-sm truncate flex-1">{chat.title || "Untitled Chat"}</span>

                                            {/* 3-dot menu button */}
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setContextMenu({ chatId: chat.id, x: rect.right, y: rect.bottom });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-gray-300 dark:hover:bg-zinc-600"
                                                tabIndex={-1}
                                                aria-label="Chat options"
                                            >
                                                <MoreHorizontal size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* ── CONTEXT MENU (Rename / Delete) ───────────────────────── */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-[100] w-44 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 overflow-hidden"
                    style={{ top: contextMenu.y + 4, left: Math.min(contextMenu.x - 176, window.innerWidth - 192) }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            const chat = chatHistory.find(c => c.id === contextMenu.chatId);
                            setRenameValue(chat?.title || "");
                            setRenamingChatId(contextMenu.chatId);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Pencil size={14} className="text-gray-400" />
                        Rename
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-zinc-800 mx-3 my-1" />
                    <button
                        onClick={() => {
                            setDeleteConfirmChatId(contextMenu.chatId);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            )}

            {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────── */}
            {deleteConfirmChatId && (() => {
                const chatToDelete = chatHistory.find(c => c.id === deleteConfirmChatId);
                return (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setDeleteConfirmChatId(null)}>
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
                        {/* Modal */}
                        <div
                            className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-6 animate-in fade-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={22} className="text-red-600 dark:text-red-400" />
                            </div>
                            {/* Text */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Chat?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
                                Are you sure you want to delete <strong className="text-gray-700 dark:text-gray-300">&ldquo;{chatToDelete?.title || "this chat"}&rdquo;</strong>? This action cannot be undone.
                            </p>
                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmChatId(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteChat(deleteConfirmChatId)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── MAIN CHAT AREA ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative bg-white dark:bg-[#0a0a0a]">

                {/* Header */}
                <div className="relative flex items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-20 shrink-0">

                    {/* LEFT — sidebar toggle + logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
                                title="Open sidebar">
                                <PanelLeft size={20} />
                            </button>
                        )}
                        <div onClick={() => navigate("/dashboard")} className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <Sparkles className="text-white w-4 h-4" />
                            </div>
                            {/* Only show "WebPilot AI" text when no chat is open */}
                            {!activeChatTitle && (
                                <span className="font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">WebPilot AI</span>
                            )}
                        </div>
                    </div>

                    {/* CENTER — chat title (absolutely centered, like Gemini) */}
                    {activeChatTitle && (
                        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none max-w-[45%] md:max-w-[55%]">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate block text-center">
                                {activeChatTitle}
                            </span>
                        </div>
                    )}

                    {/* RIGHT — theme toggle + avatar */}
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                        <button onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Toggle Theme">
                            {theme === "dark"
                                ? <span className="material-symbols-rounded text-[20px]">light_mode</span>
                                : <span className="material-symbols-rounded text-[20px]">dark_mode</span>
                            }
                        </button>
                        <button ref={profileBtnRef} onClick={() => setProfileOpen(prev => !prev)}
                            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden border-2 border-transparent hover:border-indigo-400 transition-all ring-2 ring-transparent hover:ring-indigo-400/20">
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>

                {/* ── PROFILE DROPDOWN ──────────────────────────────────── */}
                {profileOpen && (
                    <div ref={profileMenuRef}
                        className="fixed z-50 w-80 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-4 ring-1 ring-black/5"
                        style={{ top: (profileBtnRef.current?.getBoundingClientRect().bottom || 60) + 10, right: 16 }}>
                        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-700">
                                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0 pt-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white truncate text-base">{user?.name || user?.displayName || "WebPilot User"}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">{user?.email || "user@example.com"}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm w-fit">
                                    {isAdmin ? "Admin" : "Pro Plan"}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <button onClick={() => { navigate("/settings"); setProfileOpen(false); }}
                                className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all">
                                <Settings size={22} className="text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400 transition-colors" />
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">Settings</span>
                            </button>
                            <button onClick={async () => { await logout(); setProfileOpen(false); }}
                                className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all">
                                <LogOut size={22} className="text-gray-500 group-hover:text-red-500 dark:text-gray-400 dark:group-hover:text-red-400 transition-colors" />
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-red-600 dark:text-gray-300 dark:group-hover:text-red-400">Logout</span>
                            </button>
                        </div>
                        <div className="space-y-1">
                            {[
                                { label: "Billing & Plans", icon: "credit_card", path: "/pricing" },
                                { label: "Help Center", icon: "help", path: "/support" }
                            ].map(item => (
                                <button key={item.label} onClick={() => { navigate(item.path); setProfileOpen(false); }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-rounded text-[20px] text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">{item.icon}</span>
                                        <span className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white">{item.label}</span>
                                    </div>
                                    <span className="material-symbols-rounded text-gray-300 text-lg group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── MESSAGES VIEWPORT ─────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6" style={{ paddingBottom: "11rem" }}>

                        {/* Empty state */}
                        {messages.length === 1 && !activeChatId && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
                                    <Sparkles className="text-white w-8 h-8" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                    Hi, {user?.name?.split(" ")[0] || auth.currentUser?.displayName?.split(" ")[0] || "there"} 👋
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md">What task do you want to automate today?</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {[
                                        { label: "Post to LinkedIn", desc: "Schedule an automated post update", prompt: "Post a tech update about AI Trends on LinkedIn with professional tone", color: "blue" },
                                        { label: "Generate AI Notes in Notion", desc: "Create notes on any topic automatically", prompt: "Generate AI notes on Climate Change in Notion page 684aee6453da4465b0c79ca", color: "purple" },
                                        { label: "Send Bulk Emails", desc: "Personalized email campaigns via Gmail", prompt: "Send bulk emails to my recipients from Google Sheet URL", color: "green" },
                                        { label: "Manage Google Drive", desc: "Create, rename, or delete files/folders", prompt: "Create a new Google Drive folder called Q4 Reports 2024", color: "orange" }
                                    ].map(s => (
                                        <button key={s.label} onClick={() => setPrompt(s.prompt)}
                                            className={`text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-${s.color}-500 dark:hover:border-${s.color}-500 hover:bg-${s.color}-50/50 dark:hover:bg-${s.color}-500/10 transition-all bg-white dark:bg-zinc-900 shadow-sm hover:shadow`}>
                                            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{s.label}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map(msg => {
                            if (msg.id === "welcome" && !activeChatId) return null;
                            return (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                                        {/* Avatar */}
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 overflow-hidden ${
                                            msg.role === "user"
                                            ? "bg-gray-100 dark:bg-zinc-800"
                                            : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md"
                                        }`}>
                                            {msg.role === "user"
                                                ? <img src={avatarSrc} alt="User" className="w-full h-full object-cover" />
                                                : <Sparkles size={15} />
                                            }
                                        </div>

                                        {/* Bubble */}
                                        <div className="flex flex-col gap-1 w-full min-w-0">
                                            {msg.isBuildResult ? (
                                                /* ── AUTOMATION BUILT CARD ────────────────────── */
                                                <div className="w-full rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 rounded-tl-sm shadow-sm">
                                                    <div className="px-5 pt-4 pb-3 text-[15px] leading-relaxed font-medium text-blue-900 dark:text-blue-200">
                                                        {renderContent(msg.content)}
                                                    </div>
                                                    <div className="mx-5 h-px bg-blue-200 dark:bg-blue-500/20" />
                                                    <div className="px-5 py-4">
                                                        <div className="flex items-center gap-2 font-bold text-sm mb-3 text-blue-700 dark:text-blue-400">
                                                            <CheckCircle size={16} />
                                                            Automation Created — {msg.nodeCount || 0} node{msg.nodeCount !== 1 ? "s" : ""}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => navigate(`/automations/${msg.automationId}?tab=canvas`)}
                                                                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                                                            >
                                                                Open in Canvas ↗
                                                            </button>
                                                            <button
                                                                onClick={() => navigate("/automations")}
                                                                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                                                            >
                                                                View in Automations
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : msg.isResult ? (
                                                /* ── RICH RESULT CARD ─────────────────────────── */
                                                <div className={`w-full rounded-2xl overflow-hidden ${
                                                    msg.success
                                                    ? "border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10"
                                                    : "border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
                                                } rounded-tl-sm shadow-sm`}>
                                                    {/* Text preamble */}
                                                    <div className={`px-5 pt-4 pb-3 text-[15px] leading-relaxed font-medium ${msg.success ? "text-green-900 dark:text-green-200" : "text-red-900 dark:text-red-200"}`}>
                                                        {msg.success
                                                            ? <>Great news! 🎉 Your <strong>{msg.templateTitle || "automation"}</strong> ran successfully. Here are your results:</>
                                                            : <>Something went wrong with your <strong>{msg.templateTitle || "automation"}</strong>. Here's what happened:</>
                                                        }
                                                    </div>

                                                    {/* Divider */}
                                                    <div className={`mx-5 h-px ${msg.success ? "bg-green-200 dark:bg-green-500/20" : "bg-red-200 dark:bg-red-500/20"}`} />

                                                    {/* Card body */}
                                                    <div className="px-5 py-4">
                                                        <div className={`flex items-center gap-2 font-bold text-sm mb-3 ${msg.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                                            {msg.success
                                                                ? <CheckCircle size={16} />
                                                                : <XCircle size={16} />
                                                            }
                                                            {msg.success ? "Execution Successful" : "Execution Failed"}
                                                        </div>
                                                        {!msg.success && (
                                                            <p className="text-[13px] text-red-700/80 dark:text-red-300/80 mb-3 leading-relaxed">
                                                                {renderContent(msg.content)}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.resultUrl && (
                                                                <a href={msg.resultUrl} target="_blank" rel="noreferrer"
                                                                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                                        msg.success
                                                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                                                        : "bg-red-600 hover:bg-red-700 text-white"
                                                                    }`}>
                                                                    View result ↗
                                                                </a>
                                                            )}
                                                            <button onClick={() => navigate("/execution-logs")}
                                                                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                                                    msg.success
                                                                    ? "border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
                                                                    : "border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                                                                }`}>
                                                                View in Execution Logs
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* ── REGULAR / NEEDS INPUT / ERROR BUBBLE ───── */
                                                <div className={`px-5 py-4 w-full rounded-2xl ${
                                                    msg.role === "user"
                                                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-tr-sm"
                                                    : msg.isError
                                                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-tl-sm"
                                                        : msg.needsInput
                                                            ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-tl-sm text-amber-800 dark:text-amber-200"
                                                            : "bg-transparent text-gray-800 dark:text-gray-200 rounded-tl-sm"
                                                }`}>
                                                    {msg.isError && (
                                                        <div className="flex items-center gap-2 mb-1.5 font-semibold text-sm">
                                                            <XCircle size={15} /> Execution Failed
                                                        </div>
                                                    )}
                                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                                                        {renderContent(msg.content)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Running execution banner */}
                        {activeExecution?.status === "Running" && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[90%] md:max-w-[70%] gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-500 flex items-center justify-center mt-0.5 border border-indigo-100 dark:border-zinc-700 shadow-sm">
                                        <Loader2 size={15} className="animate-spin" />
                                    </div>
                                    <div className="px-5 py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-tl-sm shadow-sm flex items-center gap-3 min-w-48 md:w-96">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 truncate">{activeExecution.automationName || "Executing Automation"}</p>
                                            <p className="text-[13px] font-medium text-indigo-700/80 dark:text-indigo-400/80 mt-1">{activeExecution.message || "Running workflow in background..."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI thinking indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                                        <Sparkles size={15} className="text-white" />
                                    </div>
                                    <div className="px-5 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 rounded-tl-sm flex gap-1.5 items-center">
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* ── INPUT AREA ────────────────────────────────────────── */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/95 pt-16 pb-6 md:pb-8 px-4 w-full">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
                        <div className="relative shadow-sm hover:shadow-md transition-shadow dark:shadow-none bg-white dark:bg-zinc-800 rounded-3xl border border-gray-200 dark:border-zinc-700 focus-within:border-gray-300 dark:focus-within:border-zinc-500">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder={activeExecution?.status === "Running" ? "Waiting for execution to finish..." : "Ask WebPilot something..."}
                                disabled={isTyping || activeExecution?.status === "Running"}
                                style={{ resize: "none", overflow: "hidden", minHeight: "56px" }}
                                className="w-full pl-6 pr-14 py-4 md:py-5 bg-transparent text-[15px] focus:outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500 font-medium leading-relaxed"
                            />
                            <div className="absolute right-2 bottom-2 p-1">
                                <button type="submit"
                                    disabled={!prompt.trim() || isTyping || activeExecution?.status === "Running"}
                                    className="p-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed">
                                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="transform translate-x-[-1px] translate-y-[1px]" />}
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
