import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Clock, ArrowRight } from 'lucide-react';

export default function SearchChatsView({ chatHistory, loadChat }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    const lowerQuery = searchQuery.toLowerCase();
    return chatHistory.filter(chat => 
      (chat.title || "Untitled Chat").toLowerCase().includes(lowerQuery)
    );
  }, [chatHistory, searchQuery]);

  // Group by relative time or just display the date.
  // We'll just display a simple "9 Apr" or similar format on the right side if the chat has a timestamp.
  const formatChatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    // Check if it's a Firestore Timestamp (has toMillis or seconds)
    const date = timestamp?.toMillis ? new Date(timestamp.toMillis()) 
               : timestamp?.seconds ? new Date(timestamp.seconds * 1000)
               : new Date(timestamp);
               
    if (isNaN(date.getTime())) return "Unknown date";
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-y-auto w-full">
      <div className="px-6 py-10 md:py-16 max-w-4xl mx-auto w-full min-h-full">
        
        {/* Search header / input */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-xl shadow-blue-500/20 mb-6">
            <Search className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
            Search your chats
          </h1>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by chat name..."
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-3xl text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 shadow-sm focus:shadow-xl transition-all"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {searchQuery ? `Search Results (${filteredChats.length})` : "Recent Chats"}
            </h2>
          </div>

          {filteredChats.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-3xl border-dashed">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No chats found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try a different search term or start a new chat.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat, idx) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900/80 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-2xl transition-all duration-200 group text-left hover:shadow-md"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                      <MessageSquare size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px]">
                        {chat.title || "Untitled Chat"}
                      </h3>
                      {/* Optional preview text could go here if we stored lastMessage */}
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatChatDate(chat.updatedAt || chat.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 p-2 rounded-full text-gray-300 dark:text-gray-600 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                    <ArrowRight size={18} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
