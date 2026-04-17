import React, { useState, useEffect } from 'react';
import {
  Copy, Check, X, Sparkles, BookOpen, Zap,
  GitBranch, Trash2, Star,
  TrendingUp, Users, BarChart2,
  FilePlus, Globe,
  FileText,
} from 'lucide-react';

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

// Each advanced card has a unique `icon` component
const ADVANCED_AUTOMATIONS = [
  // --- GitHub ---
  {
    id: "github-create",
    label: "Create a GitHub Repository",
    desc: "GitHub Repository Manager",
    icon: GitBranch,
    prompt: "Please create a new GitHub repository named [your-repo-name]. Make it [public/private] and initialize it with a README. Add the description: [Short description of the project].",
    color: "slate"
  },
  {
    id: "github-delete",
    label: "Delete a GitHub Repository",
    desc: "GitHub Repository Manager",
    icon: Trash2,
    prompt: "Delete the GitHub repository [owner-username/repo-name]. I confirm this is intentional.",
    color: "slate"
  },
  {
    id: "github-star",
    label: "Star a GitHub Repository",
    desc: "GitHub Repository Manager",
    icon: Star,
    prompt: "Star the GitHub repository [owner-username/repo-name] on my behalf.",
    color: "slate"
  },
  // --- Data Results Analyzer ---
  {
    id: "dra-sales",
    label: "Analyze Sales Data",
    desc: "Data Results Analyzer",
    icon: TrendingUp,
    prompt: "Trigger the Data Results Analyzer for the file \"[Your File Name in Google Drive]\". Please analyze: Show me the top 5 products by revenue, which region has the lowest sales, and the monthly revenue trend. Include data visualizations.",
    color: "amber"
  },
  {
    id: "dra-employees",
    label: "Employee Performance Report",
    desc: "Data Results Analyzer",
    icon: Users,
    prompt: "Trigger the Data Results Analyzer for the file \"[Employee Data File Name]\". Please analyze: Identify the top 10 high-impact performers based on achievements and contribution to the company. Also highlight any employees with high salaries but no notable achievements. Include data visualizations.",
    color: "amber"
  },
  {
    id: "dra-general",
    label: "General Dataset Insights",
    desc: "Data Results Analyzer",
    icon: BarChart2,
    prompt: "Trigger the Data Results Analyzer for the file \"[Your Google Drive File Name]\". I want you to analyze: [Describe what you want to find — e.g., trends, top performers, comparisons]. Please make sure to include data visualizations.",
    color: "amber"
  },
  // --- Google Forms ---
  {
    id: "gf-create",
    label: "Create a Google Form",
    desc: "Google Forms Manager",
    icon: FilePlus,
    prompt: "Create a Google Form titled \"[Form Title]\" with the description \"[Form Description]\". Please add the following questions: 1) [Question 1], 2) [Question 2], 3) [Question 3]. Make question 1 required.",
    color: "teal"
  },
  {
    id: "gf-publish",
    label: "Publish a Google Form",
    desc: "Google Forms Manager",
    icon: Globe,
    prompt: "Publish my Google Form titled \"[Form Title or Form ID]\". Make it publicly accessible so anyone with the link can respond.",
    color: "teal"
  },
  {
    id: "gf-delete",
    label: "Delete a Google Form",
    desc: "Google Forms Manager",
    icon: FileText,
    prompt: "Delete the Google Form with the title or ID \"[Form Title or Form ID]\". I confirm this action is intentional.",
    color: "teal"
  },
];

export default function PromptBook() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [copied, setCopied] = useState(false);

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
      {/* pb-20 gives breathing room below the last card row */}
      <div className="relative px-6 py-10 md:py-16 pb-20 max-w-5xl mx-auto w-full min-h-full">

        {/* Header */}
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

        {/* Standard Automations */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-in fade-in slide-in-from-left-4">
            Standard Automations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STANDARD_AUTOMATIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedPrompt(item)}
                className="group relative p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "both" }}
              >
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
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                    View Prompt
                    <span className="material-symbols-rounded text-[18px]">arrow_right_alt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Automations */}
        <div className="mb-4">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-left-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Zap size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Automations
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              AI-Powered
            </span>
          </div>

          {/* Info tip */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 mb-6">
            <Zap size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
              These prompts trigger advanced AI-powered automations — GitHub, Data Analyzer &amp; Google Forms.
              Copy a prompt, fill in the <strong>[bracketed placeholders]</strong> with your real values, then paste it into a new chat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADVANCED_AUTOMATIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPrompt(item)}
                  className="group relative p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
                >
                  <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${item.color}-500/10 dark:bg-${item.color}-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{item.label}</h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all mt-4">
                      View Prompt
                      <span className="material-symbols-rounded text-[18px]">arrow_right_alt</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6 pr-8">
              <div className={`shrink-0 w-12 h-12 rounded-2xl bg-${selectedPrompt.color}-100 dark:bg-${selectedPrompt.color}-500/20 flex items-center justify-center text-${selectedPrompt.color}-600 dark:text-${selectedPrompt.color}-400 shadow-sm`}>
                {selectedPrompt.icon ? (
                  <selectedPrompt.icon size={22} />
                ) : (
                  <Sparkles size={20} />
                )}
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

            <div className="relative p-5 rounded-2xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 group">
              <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed font-mono text-[13px] md:text-[15px] whitespace-pre-wrap max-h-56 overflow-y-auto pr-2">
                {selectedPrompt.prompt}
              </p>
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
                    <><Check size={18} /> Copied!</>
                  ) : (
                    <><Copy size={18} /> Copy Prompt</>
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
