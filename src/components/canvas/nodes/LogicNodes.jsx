import React from 'react';
import { Handle, Position } from 'reactflow';

// Shared base UI shell for consistency with the main AutomationNode
function NodeShell({ data, children, extraHandles, isTrigger }) {
  return (
    <div
      style={{ width: 170 }}
      className="rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-all select-none relative"
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "#6366f1", border: "2px solid #fff", width: 10, height: 10, left: -5 }}
        />
      )}

      {extraHandles}

      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100 dark:border-zinc-700">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-rounded text-indigo-500 text-base">{data.icon}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">{data.title}</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded text-[8px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <span className="material-symbols-rounded text-[12px]">bolt</span>
          Step {data.stepIndex !== undefined ? data.stepIndex + 1 : "?"}
        </span>
        {data.viewMode !== "executions" && !data.isReadOnly && (
          <div className="flex gap-0.5 relative z-[100]">
            <button
              onClick={data.onConfigure}
              title="Configure inputs"
              className="p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors pointer-events-auto"
            >
              <span className="material-symbols-rounded text-sm">tune</span>
            </button>
            <button
              onClick={data.onRemove}
              title="Remove step"
              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors pointer-events-auto"
            >
              <span className="material-symbols-rounded text-sm">close</span>
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}


export function ManualTriggerNode({ data }) {
  const handles = (
    <Handle type="source" position={Position.Right} style={{ background: "#6366f1", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
  );
  return <NodeShell data={data} extraHandles={handles} isTrigger={true} />;
}

export function ScheduleNode({ data }) {
  const handles = (
    <Handle type="source" position={Position.Right} style={{ background: "#6366f1", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
  );
  return <NodeShell data={data} extraHandles={handles} isTrigger={true} />;
}

export function WaitNode({ data }) {
  const handles = (
    <Handle type="source" position={Position.Right} style={{ background: "#6366f1", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
  );
  return <NodeShell data={data} extraHandles={handles} />;
}

export function IfNode({ data }) {
  const handles = (
    <>
      <Handle type="source" position={Position.Right} id="true" style={{ top: "35%", background: "#10b981", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
      <span className="absolute right-3 top-[35%] -translate-y-1/2 text-[9px] font-bold text-emerald-500">TRUE</span>
      
      <Handle type="source" position={Position.Right} id="false" style={{ top: "65%", background: "#ef4444", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
      <span className="absolute right-3 top-[65%] -translate-y-1/2 text-[9px] font-bold text-red-500">FALSE</span>
    </>
  );
  return <NodeShell data={data} extraHandles={handles} />;
}

export function LoopNode({ data }) {
  const handles = (
    <>
      <Handle type="source" position={Position.Right} id="item" style={{ top: "35%", background: "#3b82f6", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
      <span className="absolute right-3 top-[35%] -translate-y-1/2 text-[9px] font-bold text-blue-500">ITEM</span>
      
      <Handle type="source" position={Position.Right} id="done" style={{ top: "65%", background: "#8b5cf6", border: "2px solid #fff", width: 12, height: 12, right: -6 }} />
      <span className="absolute right-3 top-[65%] -translate-y-1/2 text-[9px] font-bold text-purple-500">DONE</span>
    </>
  );
  return <NodeShell data={data} extraHandles={handles} />;
}

export function SwitchNode({ data }) {
  const handles = (
    <>
      <Handle type="source" position={Position.Right} id="case1" style={{ top: "25%", background: "#f59e0b", border: "2px solid #fff", width: 10, height: 10, right: -5 }} />
      <Handle type="source" position={Position.Right} id="case2" style={{ top: "45%", background: "#f59e0b", border: "2px solid #fff", width: 10, height: 10, right: -5 }} />
      <Handle type="source" position={Position.Right} id="case3" style={{ top: "65%", background: "#f59e0b", border: "2px solid #fff", width: 10, height: 10, right: -5 }} />
      <Handle type="source" position={Position.Right} id="case4" style={{ top: "85%", background: "#f59e0b", border: "2px solid #fff", width: 10, height: 10, right: -5 }} />
      <span className="absolute right-3 top-[50%] -translate-y-1/2 text-[9px] font-bold text-orange-500 rotate-90 origin-right">CASES</span>
    </>
  );
  return <NodeShell data={data} extraHandles={handles} />;
}
