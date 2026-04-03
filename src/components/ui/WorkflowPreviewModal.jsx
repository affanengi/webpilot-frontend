import React, { useState } from 'react';
import { X } from 'lucide-react';
import CanvasAutomation from '../../pages/dashboard/CanvasAutomation';
import AutomationDetails from '../../pages/dashboard/AutomationDetails';

export default function WorkflowPreviewModal({ isOpen, onClose, proposalData }) {
    if (!isOpen || !proposalData) return null;

    const [view, setView] = useState('canvas'); // 'canvas' or 'details'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
            <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800 relative">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-indigo-500 text-xl">preview</span>
                            Proposed Workflow Changes
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            Review AI modifications in Read-Only mode. Close this modal to approve or reject.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
                            <button
                                onClick={() => setView('canvas')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                                    view === 'canvas'
                                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Canvas
                            </button>
                            <button
                                onClick={() => setView('details')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                                    view === 'details'
                                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Automation Details
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative bg-gray-50 dark:bg-zinc-950 overflow-hidden">
                    {/* Absolute positioning trick to render these full size inside the modal */}
                    <div className="absolute inset-0 overflow-y-auto">
                        {view === 'canvas' ? (
                            <div className="h-full w-full relative">
                                {/* Wrap Canvas with relative pointer-events handled natively inside CanvasAutomation */}
                                <CanvasAutomation isReadOnly={true} previewData={proposalData} />
                            </div>
                        ) : (
                            <div className="h-full w-full p-4 relative bg-white dark:bg-[#0a0a0a]">
                                <AutomationDetails isReadOnly={true} previewData={proposalData} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Warning Footer */}
                <div className="h-10 shrink-0 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-200 dark:border-amber-500/20 px-6 flex items-center justify-center text-sm font-semibold text-amber-800 dark:text-amber-400">
                    <span className="material-symbols-rounded text-[18px] mr-2">visibility</span>
                    This is a read-only preview. Make sure to review the changes before approving.
                </div>
            </div>
        </div>
    );
}
