import React, { useState, useEffect } from 'react';
import { Copy, Check, X, Sparkles, BookOpen } from 'lucide-react';

const STANDARD_AUTOMATIONS = [
  {
    id: "linkedin",
    label: "Post to LinkedIn",
    desc: "Schedule an automated post update",
    prompt: "Execute the LinkedIn Post Automation.\n\nPlease define the following details:\n- Target Audience/Topic: [e.g., 'A post about modern AI trends for software engineers']\n- Desired Tone: [e.g., 'Professional, engaging, and slightly casual']\n- Key Hashtags: [e.g., '#AI, #WebDev, #Technology']\n\nGenerate the post and publish it to my connected LinkedIn account.",
    color: "blue"
  },
  {
    id: "notion",
    label: "Generate AI Notes in Notion",
    desc: "Create notes on any topic automatically",
    prompt: "Execute the Notion AI Notes Automation.\n\nPlease define the following details:\n- Research Topic: [e.g., 'Key differences between React and Vue in 2025']\n- Formatting Rules: [e.g., 'Include an Executive Summary, Bullet Points, and a Conclusion']\n- Target Notion Page ID: [Insert your Page ID, e.g., '684aee6453da4465b0c79ca']\n\nResearch the topic, generate the structured notes, and append them directly to my Notion page.",
    color: "purple"
  },
  {
    id: "gmail",
    label: "Send Bulk Emails",
    desc: "Personalized email campaigns via Gmail",
    prompt: "Execute the Gmail Send Automation.\n\nPlease define the following details:\n- Recipient Addresses: [Insert correctly formatted emails, comma-separated]\n- Email Subject: [e.g., 'Welcome to our platform - Important Updates']\n- Core Email Context/Message: [e.g., 'Summarize our recent Q3 features and provide a link to the docs']\n- Desired Tone: [e.g., 'Warm and professional']\n\nGenerate the personalized email content and send it to the listed recipients.",
    color: "green"
  },
  {
    id: "docs",
    label: "Create Google Docs",
    desc: "Generate and format Google documents",
    prompt: "Execute the Google Docs Automation.\n\nPlease define the following details:\n- Desired Document Title: [e.g., 'Project Alpha Brainstorming Ideas']\n- Generation Topic/Instructions: [e.g., 'Write a detailed system architecture proposal including constraints and advantages.']\n- Document Format: [e.g., 'Use strong headers, formal language, and a clear introductory section.']\n\nGenerate the content according to these rules and save the result as a new Google Doc.",
    color: "indigo"
  },
  {
    id: "drive",
    label: "Manage Google Drive",
    desc: "Create, rename, or delete files/folders",
    prompt: "Execute the Google Drive Management Automation.\n\nPlease define the following details:\n- Desired Action: [e.g., 'Create a new folder' or 'Rename a specific file']\n- Target Resource Name: [e.g., 'Q4 Financial Reports 2024']\n- Target Location/Details: [e.g., 'Place it in the root folder']\n\nPerform the specified management action on my connected Google Drive.",
    color: "orange"
  },
  {
    id: "youtube",
    label: "YouTube Upload Automation",
    desc: "Automate video uploads to YouTube",
    prompt: "Execute the YouTube Upload Automation.\n\nPlease define the following details:\n- Source Video URL/Path: [Insert your valid video file URL or resource path]\n- Video Title: [e.g., 'Build AI Apps deeply integrated with Node.js']\n- Description Context: [e.g., 'Include timestamps, links to our GitHub, and a friendly sign-off.']\n- Tags/Keywords: [e.g., 'Node.js, AI, Automation, Web Dev']\n- Visibility Status: [e.g., 'Public, Private, or Unlisted']\n\nGenerate the optimized description and upload the provided video to my YouTube channel.",
    color: "red"
  }
];

// Advanced Automations have been moved to native templates under src/data/automations.js

export default function PromptBook() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPrompt(null);
        setCopied(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = (promptText) => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setSelectedPrompt(null);
    setCopied(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0a] overflow-y-auto w-full">
      <div className="relative px-6 py-10 md:py-16 max-w-5xl mx-auto w-full min-h-full">
        {/* Header Section */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-xl shadow-blue-500/20 mb-6">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            Prompt Book
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Discover and copy pre-built automation prompts to instantly supercharge your workflow. 
            Choose a prompt, copy it, and paste it into a new chat.
          </p>
        </div>

        {/* Standard Automations Section */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-in fade-in slide-in-from-left-4">Standard Automations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STANDARD_AUTOMATIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedPrompt(item)}
                className="group relative p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "both" }}
              >
                {/* Dynamic decorative backdrop shape */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${item.color}-500/10 dark:bg-${item.color}-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                      <Sparkles size={18} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{item.label}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 min-h-[40px]">
                    {item.desc}
                  </p>
                  
                  {/* Visual indicator that it's clickable */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                    View Prompt 
                    <span className="material-symbols-rounded text-[18px]">arrow_right_alt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-8 pt-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6 pr-8">
              <div className={`shrink-0 w-12 h-12 rounded-2xl bg-${selectedPrompt.color}-100 dark:bg-${selectedPrompt.color}-500/20 flex items-center justify-center text-${selectedPrompt.color}-600 dark:text-${selectedPrompt.color}-400 shadow-sm`}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {selectedPrompt.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ready to automate? Copy this prompt.
                </p>
              </div>
            </div>

            {/* Prompt Container */}
            <div className="relative p-5 rounded-2xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 group">
              <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed font-mono text-[13px] md:text-[15px] whitespace-pre-wrap max-h-56 overflow-y-auto pr-2">
                {selectedPrompt.prompt}
              </p>
              
              {/* Copy Overlay Button (visible on hover or always, to be clear) */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleCopy(selectedPrompt.prompt)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200 ${
                    copied 
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 group-hover:scale-[1.02]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
