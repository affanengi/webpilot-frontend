import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Send, Loader2, Sparkles, CheckCircle, XCircle,
    Plus, MessageSquare, PanelLeft, Settings, LogOut,
    MoreHorizontal, Pencil, Trash2, ChevronRight, Search, BookOpen,
    Mic, Volume2, X, Check, AudioWaveform, Headphones,
    ThumbsUp, ThumbsDown, RotateCcw, Mail, FileText, Ellipsis, Copy
} from "lucide-react";

import PromptBook from './PromptBook';
import SearchChatsView from './SearchChatsView';

import {
    collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc,
    query, orderBy, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import WorkflowPreviewModal from "../../components/ui/WorkflowPreviewModal";

export default function AiChatView() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // ── Core State ──────────────────────────────────────────────────────────
    const [chatHistory, setChatHistory] = useState([]);
    const [activeChatId, setActiveChatIdRaw] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [typingChatIds, setTypingChatIds] = useState([]);
    const isTyping = typingChatIds.includes(activeChatId || "new");
    const [prompt, setPrompt] = useState("");
    const [currentView, setCurrentView] = useState("chat"); // 'chat' | 'search' | 'prompt-book'
    const [activeExecution, setActiveExecution] = useState(null);
    const isSendingRef = useRef(false);
    const textareaRef = useRef(null);

    // ── Voice & Mic Features ────────────────────────────────────────────────
    const [isRecording, setIsRecording] = useState(false);
    const [voiceChatMode, setVoiceChatMode] = useState(false);
    const [voiceChatListening, setVoiceChatListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [vcLiveTranscript, setVcLiveTranscript] = useState('');
    const [micError, setMicError] = useState('');
    const [recordingTranscript, setRecordingTranscript] = useState('');
    const isRecordingRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const voiceChatRef = useRef(false);
    const voiceChatRecRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // ── Message Action State ─────────────────────────────────────────────
    const [openMenuId, setOpenMenuId] = useState(null); // tracks open '...' dropdown
    const [editingPromptId, setEditingPromptId] = useState(null);
    const [editPromptValue, setEditPromptValue] = useState("");
    const [actionToast, setActionToast] = useState({ show: false, message: "", loading: false, link: null });
    const [copiedId, setCopiedId] = useState(null); // tracks which msg was recently copied

    // Keep refs in sync with state
    useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
    useEffect(() => { voiceChatRef.current = voiceChatMode; }, [voiceChatMode]);
    // isSpeakingRef is set directly in speakText for zero-lag barge-in

    // ─ Setup SpeechRecognition once on mount ─
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;     // Stay alive through natural pauses
        recognition.interimResults = true; // Show transcript as user speaks
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            // Store in recordingTranscript (not in prompt) until user confirms with ✓
            setRecordingTranscript(transcript);
            setMicError("");
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return; // Normal pause — user just stopped speaking

            isRecordingRef.current = false;
            setIsRecording(false);

            if (event.error === 'network') {
                setMicError(
                    "📶 Mic stopped: Chrome's speech-to-text needs Google's servers. " +
                    "Your Google APIs are blocked (ERR_NAME_NOT_RESOLVED). " +
                    "Try: (1) Change DNS to 8.8.8.8 in WiFi settings, (2) Disable VPN/proxy, " +
                    "(3) Flush DNS: open terminal → sudo systemd-resolve --flush-caches"
                );
            } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setMicError("🔴 Mic permission denied. Click the lock icon in the address bar → allow Microphone → refresh.");
            } else {
                setMicError(`⚠️ Mic error (${event.error}). Please try again.`);
            }
        };

        recognition.onend = () => {
            // If we're still supposed to be recording (continuous mode), restart
            if (isRecordingRef.current) {
                try { recognition.start(); } catch (_) { /* guard against already-started */ }
            } else {
                setIsRecording(false);
            }
        };

        return () => {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try { recognition.abort(); } catch (_) {}
        };
    }, []);

    // Confirm: stop recording + put transcript into prompt box
    const confirmRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        try { recognitionRef.current?.stop(); } catch (_) {}
        setPrompt(recordingTranscript);
        setRecordingTranscript("");
    };

    // Cancel: stop recording + discard transcript
    const cancelRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        try { recognitionRef.current?.stop(); } catch (_) {}
        setRecordingTranscript("");
        setMicError("");
    };


    const toggleRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicError("❌ Speech recognition isn't supported in this browser. Use Chrome or Edge.");
            return;
        }
        if (!recognitionRef.current) return;

        setMicError(""); // Clear error on every new attempt

        if (isRecordingRef.current) {
            cancelRecording();
        } else {
            setRecordingTranscript("");
            isRecordingRef.current = true;
            setIsRecording(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                isRecordingRef.current = false;
                setIsRecording(false);
                setMicError("⚠️ Could not start mic. Try again.");
            }
        }
    };


    // ─ Text-to-Speech ─
    // TTS only fires during active two-way voice chat (voiceChatRef.current).
    // Manual mic recordings NEVER trigger TTS — that was the bug.
    // "Read Aloud" from the message '...' menu passes force=true to bypass this gate.

    const speakText = useCallback((text, force = false) => {
        if (!force && !voiceChatRef.current) return;
        if (!synthesisRef.current) return;

        const cleanText = text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/[*_#`>]/g, "")
            .replace(/\n+/g, " ")
            .trim();
        if (!cleanText) return;

        synthesisRef.current.cancel();
        synthesisRef.current.resume();

        const buildAndSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            const voices = synthesisRef.current.getVoices();
            const preferred =
                voices.find(v => v.lang === 'en-US' && v.localService) ||
                voices.find(v => v.lang.startsWith('en-US')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0];
            if (preferred) utterance.voice = preferred;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.onstart = () => {
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                // Start barge-in listener concurrently while AI speaks
                if (voiceChatRef.current) {
                    startVoiceChatSession();
                }
            };
            utterance.onend = () => {
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                // Only restart if barge-in didn't already grab a session
                if (voiceChatRef.current && !voiceChatRecRef.current) {
                    setTimeout(() => startVoiceChatSession(), 600);
                }
            };
            utterance.onerror = (e) => {
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                if (e.error !== 'interrupted') console.warn("TTS error:", e.error);
                if (voiceChatRef.current && !voiceChatRecRef.current) {
                    setTimeout(() => startVoiceChatSession(), 600);
                }
            };
            synthesisRef.current.resume();
            synthesisRef.current.speak(utterance);
        };

        if (synthesisRef.current.getVoices().length > 0) {
            buildAndSpeak();
        } else {
            synthesisRef.current.addEventListener('voiceschanged', buildAndSpeak, { once: true });
        }
    }, []);


    // ─ Voice Chat: full duplex conversation with barge-in support ─
    const startVoiceChatSession = useCallback(() => {
        if (!voiceChatRef.current) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicError("❌ Speech recognition not supported.");
            return;
        }

        // Abort any previous session cleanly
        if (voiceChatRecRef.current) {
            try { voiceChatRecRef.current.abort(); } catch (_) {}
            voiceChatRecRef.current = null;
        }

        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = true;  // enabled for live transcript + instant barge-in
        voiceChatRecRef.current = rec;

        let finalTranscript = '';

        rec.onstart = () => setVoiceChatListening(true);

        rec.onresult = (event) => {
            let interim = '';
            finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            // Show live transcript preview
            setVcLiveTranscript(finalTranscript || interim);

            // BARGE-IN: as soon as any speech detected, stop AI talking
            if ((finalTranscript || interim) && isSpeakingRef.current) {
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                synthesisRef.current?.cancel();
            }
        };

        rec.onend = () => {
            setVoiceChatListening(false);
            setVcLiveTranscript('');
            voiceChatRecRef.current = null; // clear ref so utterance.onend can restart if needed
            if (!voiceChatRef.current) return;

            if (finalTranscript.trim()) {
                submitVoiceChatText(finalTranscript.trim());
            } else {
                // Nothing final heard (silence or barge-in interim) — restart
                setTimeout(() => startVoiceChatSession(), 400);
            }
        };

        rec.onerror = (event) => {
            setVoiceChatListening(false);
            setVcLiveTranscript('');
            voiceChatRecRef.current = null;
            if (event.error === 'no-speech' || event.error === 'aborted') {
                if (voiceChatRef.current && !isSpeakingRef.current) {
                    setTimeout(() => startVoiceChatSession(), 400);
                }
                return;
            }
            if (event.error === 'network') {
                setMicError("📶 Voice chat needs Google's speech servers (ERR_NAME_NOT_RESOLVED). Change DNS to 8.8.8.8.");
            } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setMicError("🔴 Mic denied. Click the lock icon in the address bar → allow Microphone.");
            } else {
                setMicError(`⚠️ Voice chat error (${event.error}).`);
            }
            stopVoiceChat();
        };

        try { rec.start(); }
        catch (e) {
            voiceChatRecRef.current = null;
            if (voiceChatRef.current) setTimeout(() => startVoiceChatSession(), 500);
        }
    }, []);

    const stopVoiceChat = useCallback(() => {
        voiceChatRef.current = false;
        isSpeakingRef.current = false;
        setVoiceChatMode(false);
        setVoiceChatListening(false);
        setVcLiveTranscript('');
        setIsSpeaking(false);
        try { voiceChatRecRef.current?.abort(); } catch (_) {}
        voiceChatRecRef.current = null;
        synthesisRef.current?.cancel();
    }, []);


    // submitVoiceChatText: programmatically send a message from voice chat
    // (lives outside handleSend to avoid stale closure)
    const submitVoiceChatText = useCallback((text) => {
        // handleSend reads `prompt` from state — we'll directly call the API flow
        // by dispatching a custom synthetic event via a ref we store on the form.
        // Simpler: update prompt state and trigger form submit via a helper ref flag.
        vcAutoSubmitRef.current = text;
        vcTriggerRef.current?.();  // call the trigger (set below)
    }, []);
    const vcAutoSubmitRef = useRef(null);
    const vcTriggerRef = useRef(null);

    // Toggle voice chat on/off
    const toggleVoiceChat = () => {
        if (voiceChatRef.current) {
            stopVoiceChat();
            return;
        }
        voiceChatRef.current = true;
        setVoiceChatMode(true);

        // Prime TTS from this user click (satisfies Chrome autoplay policy)
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            const primer = new SpeechSynthesisUtterance(' ');
            primer.volume = 0;
            synthesisRef.current.speak(primer);
        }

        startVoiceChatSession();
    };

    // ── Workflow Preview ─────────────────────────────────────────────────────
    const [previewProposalMessage, setPreviewProposalMessage] = useState(null);

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

    // ── Theme (global – shared with all pages) ───────────────────────────────
    const { theme, setTheme } = useTheme();
    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    // Stores the Firestore onSnapshot unsubscribe for the active execution tracker.
    // Called when switching chats so Chat A's result never bleeds into Chat B.
    const executionUnsubRef = useRef(null);

    // Ref that always mirrors activeChatId synchronously.
    // handleSend reads this after every await to detect if the user switched chats
    // mid-flight and bail out before touching any React state.
    const activeChatIdRef = useRef(null);

    const avatarSrc = user?.photoURL
        ? user.photoURL
        : `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || "user")}`;

    const ADMIN_EMAILS = ["mohammedaffanrazvi604@gmail.com"];
    const isAdmin = ADMIN_EMAILS.includes(user?.email);

    // Active chat title (shows in navbar)
    const activeChatTitle = chatHistory.find(c => c.id === activeChatId)?.title || null;

    // activeChatId setter — keeps the ref in sync so handleSend can detect chat switches
    const setActiveChatId = useCallback((id) => {
        activeChatIdRef.current = id;
        setActiveChatIdRaw(id);
    }, []);

    // ── Effects ──────────────────────────────────────────────────────────────

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

        // Cancel any running execution tracker from the previous chat
        // so its Firestore snapshot can't mutate the newly-loaded chat's messages.
        executionUnsubRef.current?.();
        executionUnsubRef.current = null;

        const chatDoc = await getDoc(doc(db, "users", auth.currentUser.uid, "ai_chats", chatId));
        if (chatDoc.exists()) {
            setActiveChatId(chatId);
            setMessages(chatDoc.data().messages || []);
        }
        setActiveExecution(null);
        setCurrentView("chat");
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    const startNewChat = () => {
        // Cancel any running execution tracker so it can't corrupt the new blank chat.
        executionUnsubRef.current?.();
        executionUnsubRef.current = null;

        setActiveChatId(null);
        setMessages([]);
        setPrompt("");
        setActiveExecution(null);
        setCurrentView("chat");
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    // ── Connected Accounts Actions ───────────────────────────────────────────

    const handleConnect = async (providerId) => {
        if (!auth.currentUser) return;
        try {
            const idToken = await auth.currentUser.getIdToken();
            const returnUrl = encodeURIComponent(window.location.href);
            const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/${providerId}/login?token=${idToken}&returnUrl=${returnUrl}`;
            window.location.href = url;
        } catch (error) {
            console.error("Error initiating connection:", error);
        }
    };

    const handleDisconnect = async (providerId, msgId) => {
        if (!auth.currentUser) return;
        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/${providerId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${idToken}` }
            });

            if (!response.ok) throw new Error("Failed to disconnect");
            
            setMessages(prev => {
                const updated = prev.map(m => m.id === msgId ? { ...m, isDisconnected: true, content: `Successfully disconnected **${providerId}**.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
        } catch (error) {
            console.error("Error disconnecting:", error);
            setMessages(prev => {
                const updated = prev.map(m => m.id === msgId ? { ...m, content: `Failed to disconnect **${providerId}**. Please try again.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
        }
    };

    const handleDeleteAutomation = async (automationId, automationName, msgId) => {
        if (!auth.currentUser) return;
        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/automations/${automationId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${idToken}` }
            });

            if (!response.ok) throw new Error("Failed to delete automation");
            
            setMessages(prev => {
                const updated = prev.map(m => m.id === msgId ? { ...m, isDeleted: true, content: `Successfully deleted your automation: **${automationName}**.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
        } catch (error) {
            console.error("Error deleting automation:", error);
            setMessages(prev => {
                const updated = prev.map(m => m.id === msgId ? { ...m, content: `Failed to delete automation **${automationName}**. Please try again.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
        }
    };

    const handleApproveProposal = async (msg) => {
        if (!auth.currentUser) return;
        try {
            const automationRef = doc(db, "users", auth.currentUser.uid, "automations", msg.automationId);
            // Replace automation with proposed state
            const stateToSave = { ...msg.proposedState };
            delete stateToSave.id; // avoid overwriting doc id field incidentally
            
            await updateDoc(automationRef, {
                ...sanitizeForFirestore(stateToSave),
                updatedAt: serverTimestamp()
            });
            
            setMessages(prev => {
                const updated = prev.map(m => m.id === msg.id ? { ...m, isApproved: true, isRejected: false, content: `✅ Successfully applied proposed changes to **${msg.automationName}**.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
            setPreviewProposalMessage(null);
        } catch (error) {
            console.error("Error approving proposal:", error);
            setMessages(prev => {
                const updated = prev.map(m => m.id === msg.id ? { ...m, content: `Failed to apply changes to **${msg.automationName}**. Please try again.` } : m);
                if (activeChatId) saveMessagesToChat(updated, activeChatId);
                return updated;
            });
        }
    };

    const handleRejectProposal = (msg) => {
        setMessages(prev => {
            const updated = prev.map(m => m.id === msg.id ? { ...m, isRejected: true, isApproved: false, content: `❌ Cancelled proposed changes for **${msg.automationName}**.` } : m);
            if (activeChatId) saveMessagesToChat(updated, activeChatId);
            return updated;
        });
        setPreviewProposalMessage(null);
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

    const handleEditPromptSubmit = async (msgId) => {
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1 || !editPromptValue.trim()) return;

        // Slice out the old prompt and everything after it
        const newHistory = messages.slice(0, msgIndex);
        setEditingPromptId(null);
        handleSend(null, editPromptValue.trim(), newHistory);
    };

    const handleSend = async (e, forceText = null, overrideMessages = null) => {
        e?.preventDefault();
        const userContent = (forceText || prompt).trim();
        if (isSendingRef.current || !userContent || activeExecution?.status === "Running") return;
        if (!auth.currentUser) return;

        isSendingRef.current = true;
        const initialTrackingId = activeChatId || "new";
        setTypingChatIds(prev => [...prev, initialTrackingId]);

        const userMsg = { id: `user_${Date.now()}`, role: "user", content: userContent, timestamp: new Date().toISOString() };

        setPrompt("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "56px";
            textareaRef.current.style.overflowY = "hidden";
        }

        let currentMessages = [...(overrideMessages || messages), userMsg];
        setMessages(currentMessages);

        // Capture the chat this send belongs to. We check this ref after every
        // await below — if it no longer matches activeChatIdRef, the user has
        // switched chats and we must not touch any UI state.
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
            
            // Upgrade the tracking ID from "new" to the real document ID
            setTypingChatIds(prev => [...prev.filter(id => id !== "new"), currentChatId]);
        } else {
            await saveMessagesToChat(currentMessages, currentChatId);
        }

        // Helper: returns true when the user has switched away from this chat.
        const userSwitchedAway = () => activeChatIdRef.current !== currentChatId;

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prompt: userContent })
            });
            const data = await res.json();

            // If the user has already switched to a different chat, only persist
            // the result to Firestore — never touch React state for the new chat.
            if (userSwitchedAway()) {
                const aiMsg = {
                    id: `ai_${Date.now()}`,
                    role: "system",
                    content: data.message || (data.success ? "Done!" : data.error || "Something went wrong."),
                    isError: !data.success && !data.needsInput,
                    templateTitle: data.templateTitle,
                    needsInput: data.needsInput || false,
                    isPendingResult: false, // mark resolved so it doesn't show a pending spinner when re-opened
                    isBuildResult: data.intent === "BUILD_AUTOMATION",
                    automationId: data.automationId || null,
                    automationName: data.automationName || null,
                    nodeCount: data.nodeCount || 0,
                    intent: data.intent || null,
                    provider: data.provider || null,
                    proposedState: data.proposedState || null,
                    timestamp: new Date().toISOString()
                };
                await saveMessagesToChat([...currentMessages, aiMsg], currentChatId);
                return; // do NOT call setMessages / setActiveExecution
            }

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
                // Account management fields
                intent: data.intent || null,
                provider: data.provider || null,
                proposedState: data.proposedState || null,
                timestamp: new Date().toISOString()
            };

            currentMessages = [...currentMessages, aiMsg];
            setMessages(currentMessages);
            await saveMessagesToChat(currentMessages, currentChatId);

            speakText(data.message || (data.success ? "Done!" : data.error || "Something went wrong."));

            if (data.executionId) {
                trackExecution(data.executionId, currentChatId, currentMessages, aiMsgId, data.templateTitle);
            }
        } catch (err) {
            if (!userSwitchedAway()) {
                const errMsg = { id: `err_${Date.now()}`, role: "system", content: "Network error. Please check your connection and try again.", isError: true, timestamp: new Date().toISOString() };
                currentMessages = [...currentMessages, errMsg];
                setMessages(currentMessages);
                await saveMessagesToChat(currentMessages, currentChatId);
            }
        } finally {
            isSendingRef.current = false;
            setTypingChatIds(prev => prev.filter(id => id !== currentChatId && id !== "new"));
        }
    };

    // Wire up the voice chat trigger (always points to latest handleSend closure)
    vcTriggerRef.current = () => handleSend(null, vcAutoSubmitRef.current);

    // ── Execution Tracker ────────────────────────────────────────────────────


    const trackExecution = (executionId, chatId, startingMessages, aiMsgId, templateTitle) => {
        if (!auth.currentUser) return;
        setActiveExecution({ id: executionId, status: "Running" });

        const docRef = doc(db, "users", auth.currentUser.uid, "execution_logs", executionId);
        let unsubFn;

        const timeoutTimer = setTimeout(() => {
            unsubFn?.();
            executionUnsubRef.current = null;
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
                executionUnsubRef.current = null;
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

        // Store the unsubscribe so loadChat/startNewChat can cancel it if user switches chats.
        executionUnsubRef.current = unsubFn;
    };

    // ── Message Action Handlers ───────────────────────────────────────────────

    // Copy message text to clipboard (strips markdown)
    const handleCopy = useCallback((msg) => {
        const plain = msg.content
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_#`>]/g, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
        navigator.clipboard.writeText(plain).catch(() => {});
        setCopiedId(msg.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Persist feedback (like/dislike) as a field on the message in Firestore
    const handleFeedback = useCallback((msgId, liked) => {
        setMessages(prev => {
            const updated = prev.map(m => {
                if (m.id !== msgId) return m;
                // Toggle off if clicking same button again
                const newFeedback = m.feedback === liked ? null : liked;
                return { ...m, feedback: newFeedback };
            });
            if (activeChatId) saveMessagesToChat(updated, activeChatId);
            return updated;
        });
    }, [activeChatId]);

    // Re-submit the user message that preceded this AI response
    const handleRetry = useCallback((aiMsg) => {
        const idx = messages.findIndex(m => m.id === aiMsg.id);
        const lastUser = [...messages].slice(0, idx).reverse().find(m => m.role === 'user');
        if (lastUser) handleSend(null, lastUser.content);
    }, [messages]);

    const handleActionRequest = async (msg, actionType, loadingMsg, successMsg) => {
        setActionToast({ show: true, message: loadingMsg, loading: true, link: null });
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/ai/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: actionType, content: msg.content })
            });
            const data = await res.json();
            
            if (data.success && data.url) {
                setActionToast({ show: true, message: successMsg, loading: false, link: data.url });
            } else if (data.intent === 'CONNECT_ACCOUNT') {
                setActionToast({ show: false, message: "", loading: false, link: null });
                const aiMsgId = `ai_${Date.now()}`;
                const newMsg = {
                    id: aiMsgId, role: "system", content: data.message, intent: data.intent, provider: data.provider, timestamp: new Date().toISOString()
                };
                const updated = [...messages, newMsg];
                setMessages(updated);
                saveMessagesToChat(updated, activeChatId);
            } else {
                setActionToast({ show: true, message: data.error || "Failed. Token maybe expired.", loading: false, link: null });
            }
        } catch (e) {
            setActionToast({ show: true, message: "Network error. Try again.", loading: false, link: null });
        }
    };

    const handleDraftEmail = useCallback((msg) => {
        handleActionRequest(msg, "gmail", "Drafting email...", "New email created");
    }, [messages, activeChatId]);

    const handleExportDocs = useCallback((msg) => {
        handleActionRequest(msg, "docs", "Creating document...", "New document created");
    }, [messages, activeChatId]);

    // Read aloud: one-shot TTS for a specific message, force=true bypasses voice-chat gate
    const handleReadAloud = useCallback((msg) => {
        synthesisRef.current?.cancel();
        speakText(msg.content, true);
    }, [speakText]);

    // ── MessageActions Component ──────────────────────────────────────────────
    const MessageActions = ({ msg }) => {
        const isMenuOpen = openMenuId === msg.id;
        const liked    = msg.feedback === true;
        const disliked = msg.feedback === false;

        return (
            <div className="relative flex items-center gap-0.5 mt-1.5 ml-0.5">
                {/* Copy */}
                <button
                    onClick={() => handleCopy(msg)}
                    title="Copy response"
                    className={`p-1.5 rounded-lg transition-all duration-150 ${
                        copiedId === msg.id
                            ? 'text-green-500 bg-green-50 dark:bg-green-500/15'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {/* Thumbs Up */}
                <button
                    onClick={() => handleFeedback(msg.id, true)}
                    title="Good response"
                    className={`p-1.5 rounded-lg transition-all duration-150 ${
                        liked
                            ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/15'
                            : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <ThumbsUp size={14} />
                </button>

                {/* Thumbs Down */}
                <button
                    onClick={() => handleFeedback(msg.id, false)}
                    title="Bad response"
                    className={`p-1.5 rounded-lg transition-all duration-150 ${
                        disliked
                            ? 'text-red-500 bg-red-50 dark:bg-red-500/15'
                            : 'text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <ThumbsDown size={14} />
                </button>

                {/* Retry */}
                <button
                    onClick={() => handleRetry(msg)}
                    title="Retry"
                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-150"
                >
                    <RotateCcw size={14} />
                </button>

                {/* More options ··· */}
                <div className="relative">
                    <button
                        onClick={() => setOpenMenuId(prev => prev === msg.id ? null : msg.id)}
                        title="More options"
                        className={`p-1.5 rounded-lg transition-all duration-150 ${
                            isMenuOpen
                                ? 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <Ellipsis size={14} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-1.5 z-50 min-w-[170px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                            <button
                                onClick={() => { handleReadAloud(msg); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Volume2 size={14} className="text-gray-400" />
                                Read aloud
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-zinc-800" />
                            <button
                                onClick={() => { handleDraftEmail(msg); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Mail size={14} className="text-gray-400" />
                                Draft as email
                            </button>
                            <button
                                onClick={() => { handleExportDocs(msg); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <FileText size={14} className="text-gray-400" />
                                Export to Docs
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
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
        <div className="flex h-screen bg-white dark:bg-background-dark overflow-hidden font-sans">

            {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
            <div className={`absolute md:relative z-40 bg-gray-50 dark:bg-card-dark border-r border-gray-200 dark:border-border-dark
                transition-all duration-300 ease-in-out h-full overflow-hidden
                ${isSidebarOpen ? "w-72" : "w-0 md:w-[68px]"}`}>
                
                {/* Collapsed view (Desktop only) */}
                <div className={`absolute inset-0 flex flex-col items-center pt-3 ${isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-0 md:opacity-100"} transition-opacity duration-200 delay-100 w-[68px]`}>
                   <button onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-colors mb-4"
                        title="Expand sidebar">
                        <PanelLeft size={20} />
                    </button>
                    <button onClick={startNewChat}
                        className="p-2.5 rounded-full bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors"
                        title="New Chat">
                        <Plus size={18} />
                    </button>
                </div>

                <div className={`flex flex-col h-full w-72 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200`}>

                    {/* Sidebar header — logo, search + close */}
                    <div className="px-3 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-colors"
                                title="Close sidebar">
                                <PanelLeft size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => { setCurrentView('search'); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}
                                className={`p-[6px] rounded-lg transition-colors ${currentView === 'search' ? 'bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400'}`}
                                title="Search chats">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Items (New Chat, Prompt Book) */}
                    <div className="px-3 pt-2 pb-2 flex-shrink-0 flex flex-col gap-1 border-b border-gray-200 dark:border-zinc-800">
                        <button onClick={startNewChat}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                                currentView === 'chat' && !activeChatId
                                ? "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white"
                                : "hover:bg-gray-100 dark:hover:bg-zinc-800/50 text-gray-600 dark:text-gray-300"
                            }`}>
                            <Plus size={16} />
                            New Chat
                        </button>
                        <button onClick={() => { setCurrentView('prompt-book'); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                                currentView === 'prompt-book'
                                ? "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white"
                                : "hover:bg-gray-100 dark:hover:bg-zinc-800/50 text-gray-600 dark:text-gray-300"
                            }`}>
                            <BookOpen size={16} />
                            Prompt Book
                        </button>
                    </div>

                    {/* Chat history */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
                        <div className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">Chats</div>
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
                                                activeChatId === chat.id && currentView === 'chat'
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
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative bg-white dark:bg-background-dark">

                {/* Header */}
                <div className="relative flex items-center px-4 py-3 border-b border-gray-100 dark:border-border-dark bg-white/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-20 shrink-0">

                    {/* LEFT — sidebar toggle + logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Mobile sidebar toggle button (hidden on desktop since sidebar shows collapsed icon) */}
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors md:hidden"
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
                    {(activeChatTitle || currentView === 'search' || currentView === 'prompt-book') && (
                        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none max-w-[45%] md:max-w-[55%]">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate block text-center">
                                {currentView === 'search' ? 'Search Chats' : currentView === 'prompt-book' ? 'Prompt Book' : activeChatTitle}
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

                {/* ── MAIN VIEW CONTENT ─────────────────────────────────── */}
                {currentView === 'search' ? (
                    <SearchChatsView chatHistory={chatHistory} loadChat={loadChat} />
                ) : currentView === 'prompt-book' ? (
                    <PromptBook />
                ) : (
                    <>
                        {/* ── MESSAGES VIEWPORT ─────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6" style={{ paddingBottom: "11rem" }}>

                        {/* Empty state */}
                        {messages.length === 0 && !activeChatId && (
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
                            return (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} ${
                                        // When editing this message, go full width. Otherwise keep the normal max-w.
                                        editingPromptId === msg.id ? "w-full" : "max-w-[90%] md:max-w-[85%]"
                                    }`}>

                                        {/* Avatar — hide when editing so the card gets full width */}
                                        {editingPromptId !== msg.id && (
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
                                        )}

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
                                                                onClick={async () => {
                                                                    try {
                                                                        const snap = await getDoc(doc(db, "users", auth.currentUser.uid, "automations", msg.automationId));
                                                                        const automationData = snap.exists() ? { id: snap.id, ...snap.data() } : { id: msg.automationId, name: msg.automationName };
                                                                        navigate("/canvas-automation", { state: { editAutomationId: msg.automationId, automationData } });
                                                                    } catch {
                                                                        navigate("/canvas-automation", { state: { editAutomationId: msg.automationId, automationData: { id: msg.automationId, name: msg.automationName } } });
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                                                            >
                                                                Open in Canvas ↗
                                                            </button>
                                                            <button
                                                                onClick={() => navigate("/automations?tab=custom")}
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
                                                        {msg.success && msg.content && (
                                                            <div className="text-[13px] text-gray-800 dark:text-gray-200 mb-4 bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm max-w-full overflow-x-auto prose dark:prose-invert prose-sm">
                                                                {renderContent(msg.content)}
                                                            </div>
                                                        )}
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
                                            ) : msg.intent === "CONNECT_ACCOUNT" ? (
                                                /* ── CONNECT ACCOUNT CARD ─────────────────────── */
                                                <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-tl-sm shadow-sm p-5">
                                                    <div className="text-[15px] leading-relaxed font-medium text-gray-800 dark:text-gray-200 mb-4">
                                                        {renderContent(msg.content)}
                                                    </div>
                                                    <button
                                                        onClick={() => handleConnect(msg.provider)}
                                                        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="material-symbols-rounded text-[18px]">vpn_key</span>
                                                        Connect {msg.provider} Account
                                                    </button>
                                                </div>
                                            ) : msg.intent === "DISCONNECT_ACCOUNT" ? (
                                                /* ── DISCONNECT ACCOUNT CARD ──────────────────── */
                                                <div className="w-full rounded-2xl overflow-hidden border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/5 rounded-tl-sm shadow-sm p-5">
                                                    <div className="text-[15px] leading-relaxed font-medium text-red-900 dark:text-red-200 mb-4">
                                                        {renderContent(msg.content)}
                                                    </div>
                                                    {!msg.isDisconnected && (
                                                        <button
                                                            onClick={() => handleDisconnect(msg.provider, msg.id)}
                                                            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-[18px]">link_off</span>
                                                            Yes, Disconnect {msg.provider}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : msg.intent === "DELETE_AUTOMATION" ? (
                                                /* ── DELETE AUTOMATION CARD ──────────────────── */
                                                <div className="w-full rounded-2xl overflow-hidden border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/5 rounded-tl-sm shadow-sm p-5">
                                                    <div className="text-[15px] leading-relaxed font-medium text-red-900 dark:text-red-200 mb-4">
                                                        {renderContent(msg.content)}
                                                    </div>
                                                    {!msg.isDeleted && (
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleDeleteAutomation(msg.automationId, msg.automationName || "this automation", msg.id)}
                                                                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-colors"
                                                            >
                                                                <span className="material-symbols-rounded text-[18px]">delete</span>
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setMessages(prev => {
                                                                        const updated = prev.map(m => m.id === msg.id ? { ...m, isDeleted: true, content: `Cancelled deletion of **${msg.automationName || "this automation"}**.` } : m);
                                                                        if (activeChatId) saveMessagesToChat(updated, activeChatId);
                                                                        return updated;
                                                                    });
                                                                }}
                                                                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : msg.intent === "workflow-proposal" ? (
                                                /* ── WORKFLOW PROPOSAL CARD ──────────────────── */
                                                <div className="w-full rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-tl-sm shadow-sm p-5">
                                                    <div className="text-[15px] leading-relaxed font-medium text-indigo-900 dark:text-indigo-200 mb-4 flex items-start justify-between">
                                                        <span>{renderContent(msg.content)}</span>
                                                        <button 
                                                            onClick={() => setPreviewProposalMessage(msg)}
                                                            className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-indigo-100 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-zinc-700 transition"
                                                        >
                                                            <span className="material-symbols-rounded text-[16px]">visibility</span>
                                                            Preview
                                                        </button>
                                                    </div>
                                                    
                                                    {!msg.isApproved && !msg.isRejected && (
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleApproveProposal(msg)}
                                                                className="flex-1 inline-flex justify-center items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors"
                                                            >
                                                                <span className="material-symbols-rounded text-[18px]">check_circle</span>
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectProposal(msg)}
                                                                className="flex-1 inline-flex justify-center items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/20 transition-colors"
                                                            >
                                                                <span className="material-symbols-rounded text-[18px]">cancel</span>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : msg.role === "user" ? (
                                                /* ── USER BUBBLE WITH EDIT/COPY ───── */
                                                <div className="relative group w-full">
                                                    {editingPromptId === msg.id ? (
                                                        /* ChatGPT-style edit card — large, scrollable */
                                                        <div className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-2xl shadow-lg overflow-hidden transition-all">
                                                            <textarea
                                                                autoFocus
                                                                className="w-full min-h-[120px] max-h-[400px] bg-transparent text-gray-900 dark:text-gray-100 resize-none outline-none text-[15px] leading-relaxed px-5 pt-4 pb-2 overflow-y-auto"
                                                                value={editPromptValue}
                                                                onChange={(e) => setEditPromptValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditPromptSubmit(msg.id);
                                                                    if (e.key === 'Escape') setEditingPromptId(null);
                                                                }}
                                                            />
                                                            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
                                                                <button
                                                                    onClick={() => setEditingPromptId(null)}
                                                                    className="px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600 transition-colors"
                                                                >Cancel</button>
                                                                <button
                                                                    onClick={() => handleEditPromptSubmit(msg.id)}
                                                                    className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm transition-colors"
                                                                >Send</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="px-5 py-4 w-full rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-tr-sm">
                                                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                                                                {renderContent(msg.content)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Edit / Copy Actions (Only when not editing) */}
                                                    {editingPromptId !== msg.id && (
                                                        <div className="absolute -bottom-4 right-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 mr-1 pb-1">
                                                            <button
                                                                onClick={() => handleCopy(msg)}
                                                                title="Copy message"
                                                                className={`p-1.5 rounded-full shadow-md border transition-all ${
                                                                    copiedId === msg.id
                                                                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                                                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:scale-105'
                                                                }`}
                                                            >
                                                                {copiedId === msg.id ? <Check size={13} /> : <Copy size={13} />}
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditPromptValue(msg.content); setEditingPromptId(msg.id); }}
                                                                title="Edit message"
                                                                className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-md border border-gray-200 dark:border-zinc-700 hover:scale-105 transition-all"
                                                            >
                                                                <Pencil size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* ── REGULAR SYSTEM / NEEDS INPUT / ERROR BUBBLE ───── */
                                                <div className={`px-5 py-4 w-full rounded-2xl ${
                                                    msg.isError
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

                                            {/* Message action buttons — only for completed AI messages */}
                                            {msg.role !== 'user' && !msg.isPendingResult && !isTyping && (
                                                <MessageActions msg={msg} />
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-background-dark dark:via-background-dark/95 pt-16 pb-6 md:pb-8 px-4 w-full">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">

                        {/* ── VOICE CHAT STATUS BAR (ChatGPT-style) ── */}
                        {voiceChatMode && (
                            <div className="mb-3 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-700 shadow-lg">
                                {/* Status dot */}
                                <div className="shrink-0 relative flex items-center justify-center">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                        voiceChatListening ? 'bg-red-400' :
                                        isSpeaking ? 'bg-indigo-400' :
                                        isTyping ? 'bg-amber-400' : 'bg-zinc-500'
                                    }`} />
                                    {voiceChatListening && (
                                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
                                    )}
                                </div>

                                {/* Status text + live transcript */}
                                <div className="flex-1 min-w-0">
                                    {vcLiveTranscript ? (
                                        <p className="text-sm text-white font-medium truncate">
                                            "{vcLiveTranscript}"
                                        </p>
                                    ) : (
                                        <p className={`text-xs font-medium ${
                                            voiceChatListening ? 'text-red-400' :
                                            isSpeaking ? 'text-indigo-400' :
                                            isTyping ? 'text-amber-400' :
                                            'text-zinc-500'
                                        }`}>
                                            {voiceChatListening ? 'Listening...' :
                                             isSpeaking ? 'AI speaking — interrupt anytime' :
                                             isTyping ? 'Thinking...' :
                                             'Voice chat active'}
                                        </p>
                                    )}
                                </div>

                                {/* End button */}
                                <button
                                    type="button"
                                    onClick={stopVoiceChat}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold transition-all duration-150"
                                >
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    End
                                </button>
                            </div>
                        )}

                        {isRecording ? (
                            /* ── MANUAL MIC RECORDING: waveform panel ── */
                            <div className="relative flex items-center gap-3 bg-zinc-900 dark:bg-zinc-900 rounded-3xl px-5 py-4 border border-zinc-700" style={{minHeight: '64px'}}>
                                <span className="absolute -top-7 left-4 text-xs text-gray-400 italic max-w-[70%] truncate">
                                    {recordingTranscript ? `"${recordingTranscript}"` : '🎤 Listening — speak now'}
                                </span>

                                {/* Animated waveform bars */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(40, 1fr)',
                                    gap: '3px',
                                    height: '36px',
                                    alignItems: 'center',
                                    flex: 1,
                                    minWidth: 0,
                                }}>
                                    {Array.from({length: 40}).map((_, i) => {
                                        const heights = [8,14,24,10,30,18,6,22,12,28,10,20,16,30,8,26,14,10,22,18,30,12,6,28,16,10,24,20,14,30,8,18,12,26,10,22,16,28,12,24];
                                        return (
                                            <span
                                                key={i}
                                                className="voice-bar"
                                                style={{ animationDelay: `${i * 35}ms`, height: `${heights[i % heights.length]}px`, width: '100%' }}
                                            />
                                        );
                                    })}
                                </div>

                                <button type="button" onClick={cancelRecording}
                                    className="p-2.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white transition-all duration-150 flex items-center justify-center shrink-0"
                                    title="Cancel">
                                    <X size={17} />
                                </button>
                                <button type="button" onClick={confirmRecording}
                                    className="p-2.5 rounded-full bg-white hover:bg-gray-100 text-black transition-all duration-150 flex items-center justify-center shrink-0 shadow-md"
                                    title="Use this">
                                    <Check size={17} />
                                </button>
                            </div>
                        ) : (
                            /* ── NORMAL INPUT (also shown during voice chat, just disabled) ── */
                            <div className={`relative shadow-sm hover:shadow-md transition-shadow dark:shadow-none bg-white dark:bg-zinc-800 rounded-3xl border ${voiceChatMode ? 'border-red-300/40 dark:border-red-800/30' : 'border-gray-200 dark:border-zinc-700 focus-within:border-gray-300 dark:focus-within:border-zinc-500'}`}>
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={prompt}
                                    onChange={e => {
                                        setPrompt(e.target.value);
                                        const el = e.target;
                                        el.style.height = 'auto';
                                        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                                        el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder={
                                        voiceChatMode ? "Voice chat active — speak to interact..." :
                                        activeExecution?.status === "Running" ? "Waiting for execution to finish..." :
                                        "Ask WebPilot something..."
                                    }
                                    disabled={isTyping || activeExecution?.status === "Running" || voiceChatMode}
                                    style={{ resize: "none", overflow: "hidden", minHeight: "56px", maxHeight: "160px" }}
                                    className="w-full pl-6 pr-28 py-4 md:py-5 bg-transparent text-[15px] focus:outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500 font-medium leading-relaxed"
                                />

                                {/* ── RIGHT BUTTON GROUP ── */}
                                <div className="absolute right-2 bottom-2 p-1 flex items-center gap-1">
                                    {prompt.trim() || isTyping ? (
                                        <button
                                            type="submit"
                                            disabled={!prompt.trim() || isTyping || activeExecution?.status === "Running" || voiceChatMode}
                                            className="p-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {isTyping
                                                ? <Loader2 size={18} className="animate-spin" />
                                                : <Send size={18} className="transform translate-x-[-1px] translate-y-[1px]" />
                                            }
                                        </button>
                                    ) : (
                                        <>  
                                            {/* Voice Chat button (left) — ChatGPT-style filled circle */}
                                            <button
                                                type="button"
                                                onClick={toggleVoiceChat}
                                                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                                                    voiceChatMode
                                                        ? 'bg-white text-black shadow-lg scale-105'
                                                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 hover:shadow-md'
                                                }`}
                                                title={voiceChatMode ? 'Voice chat ON — click to stop' : 'Start voice chat'}
                                            >
                                                <Headphones size={17} className={voiceChatMode ? 'animate-pulse' : ''} />
                                                {/* Ping ring when active */}
                                                {voiceChatMode && (
                                                    <span className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-black/20 animate-ping pointer-events-none" />
                                                )}
                                            </button>

                                            {/* Manual Mic button (right) */}
                                            <button
                                                type="button"
                                                onClick={toggleRecording}
                                                disabled={voiceChatMode}
                                                className="p-2.5 rounded-full transition-all duration-200 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={voiceChatMode ? 'Stop voice chat first' : 'Speak your prompt'}
                                            >
                                                {isRecording ? <AudioWaveform size={19} className="text-red-500 animate-pulse" /> : <Mic size={19} />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-3 mb-1 space-y-1.5">
                            {/* Error message */}
                            {micError && (
                                <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2 max-w-xl mx-auto">
                                    <span>{micError}</span>
                                    <button onClick={() => setMicError("")} className="ml-2 text-amber-400 hover:text-amber-600 shrink-0">✕</button>
                                </div>
                            )}


                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">WebPilot AI can make mistakes. Check important automations.</p>
                        </div>
                    </form>
                </div>
                </>
            )}
            </div>

    {/* Workflow Preview Modal */}
            <WorkflowPreviewModal 
                isOpen={!!previewProposalMessage}
                onClose={() => setPreviewProposalMessage(null)}
                proposalData={previewProposalMessage?.proposedState}
            />

            {/* ── ACTION TOAST ───────────────────────────────────────── */}
            {actionToast.show && (
                <div className="fixed bottom-6 left-6 z-[100] min-w-[200px] flex items-center justify-between gap-4 px-4 py-3 bg-gray-900 dark:bg-zinc-800 border border-gray-800 dark:border-zinc-700 text-white shadow-2xl animate-in slide-in-from-bottom-5 rounded-xl">
                    <div className="flex items-center gap-3">
                        {actionToast.loading ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <CheckCircle size={16} className="text-green-500" />}
                        <span className="text-sm font-semibold">{actionToast.message}</span>
                    </div>
                    {actionToast.link && (
                        <div className="flex items-center gap-3 ml-2 border-l border-gray-700 pl-4 py-0.5">
                            <a href={actionToast.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:text-blue-300 hover:underline">
                                {actionToast.link.includes('mail.google.com') ? "Open Gmail" : "Open Docs"}
                            </a>
                        </div>
                    )}
                    <button onClick={() => setActionToast({ ...actionToast, show: false })} className="p-1.5 hover:bg-gray-800 dark:hover:bg-zinc-700 rounded-full transition-colors ml-1 text-gray-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
