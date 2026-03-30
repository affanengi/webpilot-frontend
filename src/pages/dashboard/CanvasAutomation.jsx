import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";
import { collection, getDocs, onSnapshot, doc, setDoc, serverTimestamp, query, where, orderBy, updateDoc } from "firebase/firestore";
import { automations as templateAutomations } from "../../data/automations";
import CustomDateTimePicker from "../../components/ui/CustomDateTimePicker";
import { WaitNode, IfNode, LoopNode, SwitchNode, ScheduleNode, ManualTriggerNode } from "../../components/canvas/nodes/LogicNodes";

const API_BASE = import.meta.env.VITE_API_BASE || "https://backend.affanmohd.online";
const ADMIN_EMAILS = ["mohammedaffanrazvi604@gmail.com"];
const ENABLED_AUTOMATIONS = templateAutomations.filter((a) => a.status !== "disabled");
const STANDARD_AUTOMATIONS = ENABLED_AUTOMATIONS.filter((a) => !a.nodeType || a.nodeType === "automationNode");
const LOGIC_NODES = ENABLED_AUTOMATIONS.filter((a) => a.nodeType && a.nodeType !== "automationNode");
const CARDS_PER_PAGE = 2;
const SAVE_COST = 15;

// ─── Custom Edge with Delete Button ─────────────────────────────────────────
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  
  if (data?.viewMode === "executions") {
     return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />;
  }
  
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
        >
          <div className="flex bg-white dark:bg-zinc-800 rounded-full shadow-lg border-2 border-indigo-100 dark:border-zinc-700 overflow-hidden divide-x divide-gray-100 dark:divide-zinc-700">
             <button
                onClick={(e) => { e.stopPropagation(); data?.onAddNode?.(id); }}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                title="Add connection"
             >
                <span className="material-symbols-rounded text-[14px]">add</span>
             </button>
             <button
                onClick={(e) => { e.stopPropagation(); data?.onDelete?.(id); }}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                title="Delete connection"
             >
                <span className="material-symbols-rounded text-[14px]">delete</span>
             </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
const edgeTypes = { customEdge: CustomEdge };

// ─── Custom Automation Node (dark-mode-safe) ───────────────────────────────────
function AutomationNode({ data }) {
  const isRunning = data.executionState === "running";
  const isSuccess = data.executionState === "success";
  const isError = data.executionState === "error";

  let ringClass = "border-gray-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400";
  if (isRunning) ringClass = "border-amber-400 animate-pulse ring-4 ring-amber-400/20";
  if (isSuccess) ringClass = "border-emerald-500 ring-4 ring-emerald-500/20";
  if (isError) ringClass = "border-red-500 ring-4 ring-red-500/20";

  return (
    <div
      style={{ width: 250 }}
      className={`rounded-2xl border-2 bg-white dark:bg-zinc-800 shadow-xl transition-all select-none ${ringClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#6366f1", border: "2px solid #fff", width: 12, height: 12, left: -6 }}
      />

      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-700">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 relative">
          <span className="material-symbols-rounded text-indigo-500 text-xl">{data.icon}</span>
          {isRunning && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
          {isSuccess && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">
              <span className="material-symbols-rounded text-[10px] text-white font-bold">check</span>
            </div>
          )}
          {isError && (
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-800">
               <span className="material-symbols-rounded text-[10px] text-white font-bold">close</span>
             </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{data.title}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{data.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <span className="material-symbols-rounded text-[12px]">bolt</span>
          Step {data.stepIndex + 1}
        </span>
        {data.viewMode !== "executions" && (
          <div className="flex gap-1">
            <button
              onClick={data.onConfigure}
              title="Configure inputs"
              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors"
            >
              <span className="material-symbols-rounded text-base">tune</span>
            </button>
            <button
              onClick={data.onRemove}
              title="Remove step"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-rounded text-base">close</span>
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#6366f1", border: "2px solid #fff", width: 12, height: 12, right: -6 }}
      />
    </div>
  );
}

const nodeTypes = { 
  automationNode: AutomationNode,
  waitNode: WaitNode,
  ifNode: IfNode,
  loopNode: LoopNode,
  switchNode: SwitchNode,
  scheduleNode: ScheduleNode,
  manualTriggerNode: ManualTriggerNode
};

const getSortedNodes = (nds, eds) => {
  const inDegree = {};
  const adj = {};
  nds.forEach(n => { inDegree[n.id] = 0; adj[n.id] = []; });
  
  eds.forEach(e => {
    if (inDegree[e.target] !== undefined && inDegree[e.source] !== undefined) {
      inDegree[e.target]++;
      adj[e.source].push(e.target);
    }
  });

  const queue = nds.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const sortedIds = [];

  while(queue.length > 0) {
    const u = queue.shift();
    sortedIds.push(u);
    adj[u]?.forEach(v => {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    });
  }

  nds.forEach(n => {
    if (!sortedIds.includes(n.id)) sortedIds.push(n.id);
  });

  return sortedIds.map(id => nds.find(n => n.id === id));
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CanvasAutomation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ── Theme ────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") html.classList.add("dark");
    else if (theme === "light") html.classList.remove("dark");
    else html.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ── Credits ──────────────────────────────────────────────────────────────
  const [dailyCredits, setDailyCredits] = useState(20);
  const isAdmin = ADMIN_EMAILS.includes(user?.email);
  useEffect(() => {
    if (!user?.uid) return;
    // Listen to Firestore for live credit updates
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDailyCredits(d.dailyCredits !== undefined ? d.dailyCredits : (d.monthlyCredits || 0));
      }
    });
    // Ping /credits on mount (and every 60 min) to trigger the server-side daily reset
    const pingCredits = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) fetch(`${API_BASE}/automations/credits`, { headers: { Authorization: `Bearer ${idToken}` } });
      } catch (_) {}
    };
    pingCredits();
    const interval = setInterval(pingCredits, 60 * 60 * 1000);
    return () => { unsub(); clearInterval(interval); };
  }, [user]);

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const avatarSrc = user?.photoURL
    ? user.photoURL
    : `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || "u")}`;

  // ── Global click-outside closes all dropdowns ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Canvas state ──────────────────────────────────────────────────────────
  const [automationName, setAutomationName] = useState("My Automation");
  const [editingName, setEditingName] = useState(false);
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [configs, setConfigs] = useState({});
  // Always keep a ref in sync so node closures never read stale configs
  const configsRef = useRef({});
  useEffect(() => { configsRef.current = configs; }, [configs]);

  // Stable ref so node data's onConfigure always calls the latest version
  const openConfigRef = useRef(null);
  const [configNode, setConfigNode] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showLogicPanel, setShowLogicPanel] = useState(false);
  const [showMyFlowsPanel, setShowMyFlowsPanel] = useState(false);
  const [userAutomations, setUserAutomations] = useState([]);
  const [insertEdgeId, setInsertEdgeId] = useState(null);
  const [connectingNodeId, setConnectingNodeId] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  // Tab state for config modal: "params" | "settings" | "docs"
  const [activeConfigTab, setActiveConfigTab] = useState("params");
  // Per-node settings (retry, timeout, continueOnError, notes, outputAlias)
  const [nodeSettings, setNodeSettings] = useState({});
  const nodeSettingsRef = useRef({});
  useEffect(() => { nodeSettingsRef.current = nodeSettings; }, [nodeSettings]);

  // ── My Flows: load user's saved automations ──────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(collection(db, "users", user.uid, "automations"), (snap) => {
      setUserAutomations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // ── Execution View States ──
  const [viewMode, setViewMode] = useState("editor"); // "editor" | "executions"

  // Guard: block position mutations when reviewing executions so nodes can't be dragged
  // (nodesDraggable must stay true for onNodeDoubleClick to fire in ReactFlow)
  const onNodesChange = useCallback((changes) => {
    if (viewMode === "executions") {
      const allowed = changes.filter(c => c.type !== "position" && c.type !== "dimensions");
      if (allowed.length > 0) onNodesChangeRaw(allowed);
      return;
    }
    onNodesChangeRaw(changes);
  }, [viewMode, onNodesChangeRaw]);

  const [executions, setExecutions] = useState([]);
  const reactFlowInstance = useRef(null);

  useEffect(() => {
     if (reactFlowInstance.current) {
        setTimeout(() => {
           reactFlowInstance.current.fitView({ padding: 0.4, duration: 300 });
        }, 300); // Trigger fitView after the CSS width transition finishes
     }
  }, [viewMode]);

  const [activeExecutionId, setActiveExecutionId] = useState(null);
  const [deleteExecutionModal, setDeleteExecutionModal] = useState(null);
  const [isDeletingExecution, setIsDeletingExecution] = useState(false);
  const [inputViewType, setInputViewType] = useState("JSON");
  const [outputViewType, setOutputViewType] = useState("JSON");

  const handleDeleteExecutionLog = async () => {
    if (!deleteExecutionModal || !user?.uid) return;
    setIsDeletingExecution(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "execution_logs", deleteExecutionModal));
      setDeleteExecutionModal(null);
      if (activeExecutionId === deleteExecutionModal) setActiveExecutionId(null);
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Failed to delete the execution log.");
    } finally {
      setIsDeletingExecution(false);
    }
  };

  const [showDeleteAutomationModal, setShowDeleteAutomationModal] = useState(false);
  const [isDeletingAutomation, setIsDeletingAutomation] = useState(false);

  const handleDeleteAutomation = async () => {
    if (!editId || !user?.uid) return;
    setIsDeletingAutomation(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "automations", editId));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting automation:", error);
      alert("Failed to delete the automation.");
    } finally {
      setIsDeletingAutomation(false);
    }
  };

  const renderDataView = (data, viewType) => {
    let parsedData = data;
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object' && parsed !== null) {
                parsedData = parsed;
            }
        } catch (e) {
            // Keep as string if not parseable
        }
    }

    if (parsedData === undefined || parsedData === null || (typeof parsedData === 'object' && Object.keys(parsedData).length === 0)) return "No payload available.";
    
    if (viewType === "JSON") return JSON.stringify(parsedData, null, 2);
    
    if (viewType === "Schema") {
      const generateSchema = (obj, indent = "") => {
        if (obj === null) return "null";
        if (Array.isArray(obj)) {
          if (obj.length === 0) return "Array []";
          return `Array [\n${indent}  ${generateSchema(obj[0], indent + "  ")}\n${indent}]`;
        }
        if (typeof obj === "object") {
          const keys = Object.keys(obj);
          if (keys.length === 0) return "Object {}";
          return `Object {\n${keys.map(k => `${indent}  "${k}": ${generateSchema(obj[k], indent + "  ")}`).join("\n")}\n${indent}}`;
        }
        return typeof obj;
      };
      return generateSchema(parsedData);
    }
    
    if (viewType === "Table") {
       if (typeof parsedData !== "object") return String(parsedData);
       if (Array.isArray(parsedData)) {
           if (parsedData.length === 0) return "Empty Array";
           const firstItem = parsedData[0];
           if (typeof firstItem === "object" && firstItem !== null) {
               const keys = Array.from(new Set(parsedData.flatMap(o => Object.keys(o || {}))));
               return (
                  <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                          <tr className="bg-gray-100 dark:bg-zinc-800">
                              {keys.map(k => <th key={k} className="p-2 border border-gray-200 dark:border-zinc-700 font-bold">{k}</th>)}
                          </tr>
                      </thead>
                      <tbody>
                          {parsedData.map((row, i) => (
                             <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                                {keys.map(k => (
                                   <td key={k} className="p-2 border-r border-gray-100 dark:border-zinc-800/50 whitespace-pre-wrap max-w-[200px] break-words">
                                      {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}
                                   </td>
                                ))}
                             </tr>
                          ))}
                      </tbody>
                  </table>
               );
           } else {
               return (
                  <table className="w-full text-left text-[11px] border-collapse">
                      <tbody>
                          {parsedData.map((item, i) => (
                             <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                               <td className="p-2 break-words">{String(item)}</td>
                             </tr>
                          ))}
                      </tbody>
                  </table>
               );
           }
       } else {
           const keys = Object.keys(parsedData);
           if (keys.length === 0) return "Empty Object";
           return (
              <table className="w-full text-left text-[11px] border-collapse">
                  <tbody>
                      {keys.map(k => (
                         <tr key={k} className="border-b border-gray-100 dark:border-zinc-800/50">
                           <td className="p-2 font-bold bg-gray-50 dark:bg-zinc-800/50 w-1/3 border-r border-gray-100 dark:border-zinc-800/50 break-words">{k}</td>
                           <td className="p-2 whitespace-pre-wrap break-words">
                             {typeof parsedData[k] === 'object' ? JSON.stringify(parsedData[k]) : String(parsedData[k] ?? '')}
                           </td>
                         </tr>
                      ))}
                  </tbody>
              </table>
           );
       }
    }
  };

  // Auto-select the newest execution when switching to Executions mode,
  // but ONLY if no specific execId has already been set (e.g. by executeWorkflow)
  useEffect(() => {
       if (viewMode === "executions" && executions.length > 0 && !activeExecutionId) {
           setActiveExecutionId(executions[0].id);
       }
  }, [viewMode, executions, activeExecutionId]);

  const [nodeStatuses, setNodeStatuses] = useState({}); // { nodeId: "idle"|"running"|"success"|"error" }
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);

  const editData = location.state?.automationData;
  const editId = location.state?.editAutomationId;
  const initialConfigs = location.state?.stepConfigs;

  useEffect(() => {
    if (editData && editId) {
      setAutomationName(editData.title || editData.name || "My Automation");
      if (editData.steps) {
        const newNodes = editData.steps.map((step, idx) => {
          const template = templateAutomations.find(a => a.id === step.templateId || a.title === step.title || a.n8nWebhookId === step.n8nWebhookId) || {};
          const nodeId = step.id || `${template.id || 'node'}-${Date.now()}-${idx}`;
          // Destructure out the saved inputs so they don't override the schema's inputs array
          const { inputs: savedInputs, ...safeStep } = step;
          return {
            id: nodeId,
            type: step.type || "automationNode",
            position: step.position || { x: 200 + idx * 340, y: 160 + (idx % 2) * 80 },
            data: {
              ...template,
              ...safeStep,
              stepIndex: idx,
              onConfigure: () => openConfigRef.current(nodeId, template),
              onRemove: () => removeNode(nodeId),
            }
          };
        });
        setNodes(newNodes);
      }
      if (editData.edges) {
        const mappedEdges = editData.edges.map(e => ({
            id: `e-${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || null,
            targetHandle: e.targetHandle || null,
            type: "customEdge",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            data: {
              onDelete: (id) => setEdges((eds) => eds.filter(ed => ed.id !== id)),
              onAddNode: (id) => { setInsertEdgeId(id); setShowLogicPanel(true); }
            }
        }));
        setEdges(mappedEdges);
      }
      // Always hydrate configs from saved step.inputs (keyed by node ID)
      // This ensures Execute Workflow sends the correct inputs, not empty {}
      const hydratedConfigs = {};
      const hydratedSettings = {};
      editData.steps?.forEach((step, idx) => {
        const nodeId = step.id || null;
        if (!nodeId) return;
        // Start with saved inputs from Firestore
        if (step.inputs && Object.keys(step.inputs).length > 0) {
          hydratedConfigs[nodeId] = { ...step.inputs };
        }
        if (step.settings && Object.keys(step.settings).length > 0) {
          hydratedSettings[nodeId] = { ...step.settings };
        }
        // Merge any override configs passed via navigation state (index-based)
        if (initialConfigs && initialConfigs[idx]) {
          hydratedConfigs[nodeId] = { ...(hydratedConfigs[nodeId] || {}), ...initialConfigs[idx] };
        }
      });
      if (Object.keys(hydratedConfigs).length > 0) {
        setConfigs(hydratedConfigs);
      }
      if (Object.keys(hydratedSettings).length > 0) {
        setNodeSettings(hydratedSettings);
      }
      setIsAutomationEnabled(editData.status !== "disabled");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData, editId]);

  // ── Fetch Executions && Status Polling ───────────────────────────────────
  useEffect(() => {
    if (!user?.uid || !editId) return;
    const q = query(
      collection(db, "users", user.uid, "execution_logs"),
      where("automationId", "==", editId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
      setExecutions(logs);
    });
    return () => unsubscribe();
  }, [user, editId]);

  // Derived Node Statuses based on Execution
  useEffect(() => {
      if (activeExecutionId) {
        const activeLog = executions.find(l => l.id === activeExecutionId);
        if (activeLog) {
           const newStatuses = {};
           const ctx = activeLog.executionContext || {};
           Object.keys(ctx).forEach(key => { newStatuses[key] = "success"; });

           const statusLower = (activeLog.status || "").toLowerCase();
           let stepId = activeLog.currentStepId;
           
           if (!stepId && (statusLower.includes("processing") || statusLower.includes("running") || statusLower.includes("started"))) {
               const roots = nodes.filter((n) => !edges.find((e) => e.target === n.id));
               if (roots.length > 0) stepId = roots[0].id;
           }

           if (statusLower.includes("failed") || statusLower.includes("error")) {
               if (stepId) newStatuses[stepId] = "error";
           } else if (statusLower.includes("running") || statusLower.includes("waiting") || statusLower.includes("processing") || statusLower.includes("started")) {
               if (stepId) newStatuses[stepId] = "running";
           } else if (statusLower === "completed" || statusLower === "successful") {
               if (stepId) newStatuses[stepId] = "success";
           }
           setNodeStatuses(newStatuses);
        }
      } else {
        setNodeStatuses({});
      }
  }, [executions, activeExecutionId, nodes, edges]);

  const executeWorkflow = async () => {
    if (!editId) { alert("Please save the automation before executing."); return; }

    // Show optimistic running badge on the first (root) node immediately
    const sortedForExec = getSortedNodes(nodes, edges);
    const firstExecNode = sortedForExec[0];
    setNodeStatuses(firstExecNode ? { [firstExecNode.id]: "running" } : {});

    try {
      const idToken = await auth.currentUser.getIdToken();
      const payload = {
         steps: nodes.map((n) => ({
             id: n.id,
             type: n.type,
             n8nWebhookId: n.data.n8nWebhookId || null,
             connected_account_type: n.data.connected_account_type || null,
             connected_accounts: n.data.connected_accounts || [],
             inputs: getNodeInputs(n.id, n.data),
             title: n.data.title,
             icon: n.data.icon
         })),
         edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle }))
      };

      const res = await fetch(`${API_BASE}/automations/${editId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger automation");

      // Pin the active execution to the newly created one, THEN switch to executions tab
      setActiveExecutionId(data.executionId);
      setViewMode("executions");
    } catch (err) {
      setNodeStatuses({});
      alert(err.message);
    }
  };

  const toggleStatus = async () => {
      if (!editId) return;
      const newStatus = isAutomationEnabled ? "disabled" : "active";
      try {
        await updateDoc(doc(db, "users", user.uid, "automations", editId), { status: newStatus });
        setIsAutomationEnabled(!isAutomationEnabled);
      } catch (err) { alert("Failed to change status"); }
  };

  // Handle Topological Re-indexing Effect
  useEffect(() => {
    if (nodes.length === 0) return;
    const sorted = getSortedNodes(nodes, edges);
    let orderChanged = false;
    for (let i = 0; i < sorted.length; i++) {
       if (sorted[i].id !== nodes[i].id || sorted[i].data.stepIndex !== i) {
           orderChanged = true;
           break;
       }
    }
    if (orderChanged) {
       setNodes((currentNodes) => {
          const currentSorted = getSortedNodes(currentNodes, edges);
          let changed = false;
          for (let i = 0; i < currentSorted.length; i++) {
            if (currentSorted[i].id !== currentNodes[i].id || currentSorted[i].data.stepIndex !== i) {
                changed = true; break;
            }
          }
          if (!changed) return currentNodes;
          
          return currentSorted.map((n, i) => ({
             ...n,
             data: { ...n.data, stepIndex: i }
          }));
       });
    }
  }, [nodes, edges, setNodes]);

  // ── Carousel ──────────────────────────────────────────────────────────────
  const [carouselPage, setCarouselPage] = useState(0);
  const totalPages = Math.ceil(STANDARD_AUTOMATIONS.length / CARDS_PER_PAGE);
  const visibleCards = STANDARD_AUTOMATIONS.slice(
    carouselPage * CARDS_PER_PAGE,
    carouselPage * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  // ── Add node ──────────────────────────────────────────────────────────────
  const addAutomationNode = useCallback(
    (template) => {
      const nodeId = `${template.id}-${Date.now()}`;
      
      if (pendingConnection) {
        setNodes((nds) => {
           const sourceNode = nds.find(n => n.id === pendingConnection.sourceNodeId);
           let posX = 400; let posY = 200;
           if (sourceNode) {
             posX = sourceNode.position.x + 340;
             posY = sourceNode.position.y;
           }
           const newNode = {
              id: nodeId,
              type: template.nodeType || "automationNode",
              position: { x: posX, y: posY },
              data: {
                ...template,
                onConfigure: () => openConfigRef.current(nodeId, template),
                onRemove: () => removeNode(nodeId),
              },
           };
           return [...nds, newNode];
        });

        setEdges((eds) => [
          ...eds,
          {
            id: `e-${pendingConnection.sourceNodeId}-${nodeId}`,
            source: pendingConnection.sourceNodeId,
            target: nodeId,
            type: "customEdge",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            data: { onDelete: (id) => setEdges(eds => eds.filter(ex => ex.id !== id)), onAddNode: (id) => { setInsertEdgeId(id); setShowLogicPanel(true); } }
          }
        ]);

        setPendingConnection(null);
        setShowLogicPanel(false);
      } else if (insertEdgeId) {
        setEdges((eds) => {
          const edgeToReplace = eds.find(e => e.id === insertEdgeId);
          if (!edgeToReplace) return eds;
          
          setNodes((nds) => {
            const sourceNode = nds.find(n => n.id === edgeToReplace.source);
            const targetNode = nds.find(n => n.id === edgeToReplace.target);
            
            let posX = 400; let posY = 200;
            if (sourceNode && targetNode) {
              posX = (sourceNode.position.x + targetNode.position.x) / 2;
              posY = sourceNode.position.y - 60;
            } else if (sourceNode) {
              posX = sourceNode.position.x + 340;
              posY = sourceNode.position.y;
            }
            
            const newNode = {
              id: nodeId,
              type: template.nodeType || "automationNode",
              position: { x: posX, y: posY },
              data: {
                ...template,
                onConfigure: () => openConfigRef.current(nodeId, template),
                onRemove: () => removeNode(nodeId),
              },
            };
            
            const newNds = [...nds];
            const sourceIndex = newNds.findIndex(n => n.id === edgeToReplace.source);
            if (sourceIndex !== -1) {
              newNds.splice(sourceIndex + 1, 0, newNode);
            } else {
              newNds.push(newNode);
            }
            
            return newNds;
          });
          
          const filtered = eds.filter(e => e.id !== insertEdgeId);
          const edge1 = {
              id: `e-${edgeToReplace.source}-${nodeId}`,
              source: edgeToReplace.source,
              target: nodeId,
              type: "customEdge",
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
              data: { onDelete: (id) => setEdges(eds => eds.filter(ex => ex.id !== id)), onAddNode: (id) => { setInsertEdgeId(id); setShowLogicPanel(true); } }
          };
          const edge2 = {
              id: `e-${nodeId}-${edgeToReplace.target}`,
              source: nodeId,
              target: edgeToReplace.target,
              type: "customEdge",
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
              data: { onDelete: (id) => setEdges(eds => eds.filter(ex => ex.id !== id)), onAddNode: (id) => { setInsertEdgeId(id); setShowLogicPanel(true); } }
          };
          return [...filtered, edge1, edge2];
        });
        
        setInsertEdgeId(null);
        setShowLogicPanel(false);
      } else {
        setNodes((nds) => {
          const stepIndex = nds.length;
          return [
            ...nds,
            {
              id: nodeId,
              type: template.nodeType || "automationNode",
              position: { x: 200 + stepIndex * 340, y: 160 + (stepIndex % 2) * 80 },
              data: {
                ...template,
                stepIndex,
                onConfigure: () => openConfigRef.current(nodeId, template),
                onRemove: () => removeNode(nodeId),
              },
            },
          ];
        });
        setShowLogicPanel(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insertEdgeId, pendingConnection]
  );

  const removeNode = useCallback(
    (nodeId) => {
      setNodes((nds) => {
        const filtered = nds.filter((n) => n.id !== nodeId);
        return filtered.map((n, i) => ({
          ...n,
          data: { ...n.data, stepIndex: i, onConfigure: () => openConfigRef.current(n.id, n.data), onRemove: () => removeNode(n.id) },
        }));
      });
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (configNode?.nodeId === nodeId) setConfigNode(null);
    },
    [setNodes, setEdges, configNode]
  );

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "customEdge",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            data: { 
              onDelete: (id) => setEdges((eds) => eds.filter(e => e.id !== id)),
              onAddNode: (id) => { setInsertEdgeId(id); setShowLogicPanel(true); }
            }
          },
          eds
        )
      ),
    [setEdges, setShowLogicPanel]
  );

  const onConnectStart = useCallback((_, { nodeId }) => {
    setConnectingNodeId(nodeId);
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      if (targetIsPane && connectingNodeId) {
        setPendingConnection({ sourceNodeId: connectingNodeId });
        setShowLogicPanel(true);
      }
      setConnectingNodeId(null);
    },
    [connectingNodeId]
  );

  const openConfig = (nodeId, template) => {
    setConfigNode({ nodeId, template });
    setActiveConfigTab("params"); // reset to params tab on open
    // Always read from ref so we get the current configs,
    // not the stale closure captured when the node was created
    setConfigValues(configsRef.current[nodeId] || {});
  };
  // Update the ref on every render so node callbacks are always fresh
  openConfigRef.current = openConfig;
  /**
   * Builds the final inputs object for a node, merging template defaultValues
   * with user-set values so fields like `action` are always present for N8N.
   */
  const getNodeInputs = useCallback((nodeId, nodeData) => {
    const tpl = templateAutomations.find(
      (a) => a.n8nWebhookId === nodeData?.n8nWebhookId || a.id === nodeData?.templateId || a.id === nodeData?.id
    );
    const defaults = {};
    (tpl?.inputs || []).forEach((inp) => {
      if (inp.defaultValue !== undefined) defaults[inp.id] = inp.defaultValue;
    });
    return { ...defaults, ...(configsRef.current[nodeId] || {}) };
  }, []);

  const saveConfig = () => {
    if (!configNode) return;
    setConfigs((prev) => ({ ...prev, [configNode.nodeId]: configValues }));
    setConfigNode(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (nodes.length === 0) { alert("Add at least one automation to the canvas."); return; }
    setIsSaving(true);
    try {
      // Create graph steps array containing the id, type, and specific configs
      const steps = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        n8nWebhookId: n.data.n8nWebhookId || null,
        connected_account_type: n.data.connected_account_type || null,
        connected_accounts: n.data.connected_accounts || [],
        inputs: getNodeInputs(n.id, n.data),
        settings: nodeSettings[n.id] || {},
        title: n.data.title,
        icon: n.data.icon,
        position: n.position,
        templateId: n.data.templateId || n.data.id || null
      }));

      // Extract raw connections
      const graphEdges = edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null
      }));

      const payload = {
        name: automationName.trim() || "My Automation",
        title: automationName.trim() || "My Automation",
        description: `Custom automation with ${nodes.length} nodes and logic routing.`,
        steps, 
        edges: graphEdges,
        icon: nodes[0]?.data.icon || "bolt", 
        status: "draft", 
        isCustom: true, 
        originalTemplateId: nodes[0]?.data.id || null,
      };

      if (location.state?.editAutomationId) {
        await setDoc(doc(db, "users", user.uid, "automations", location.state.editAutomationId), {
          ...payload,
          updatedAt: serverTimestamp(),
          status: location.state.automationData?.status || "draft"
        }, { merge: true });
        navigate(`/automations/${location.state.editAutomationId}`);
      } else {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE}/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save automation");
        navigate("/automations?tab=custom");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onNodeDoubleClick = useCallback((event, node) => {
    // Reconstruct full template from catalogued automations so the modal
    // has the correct inputs schema even in executions-review mode
    const catalogTemplate = templateAutomations.find(
      (a) => a.id === node.data.templateId || a.id === node.data.id || a.title === node.data.title
    );
    const mergedTemplate = catalogTemplate ? { ...catalogTemplate, ...node.data } : node.data;
    openConfig(node.id, mergedTemplate);
  }, [configs]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-zinc-900">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 h-20 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 z-20 flex-shrink-0 shadow-sm">

        {/* Logo (identical to Sidebar) */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 group"
        >
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:opacity-90 transition-opacity">
            <span className="material-symbols-rounded text-2xl">rocket_launch</span>
          </div>
          <div className="leading-none">
            <p className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight">WebPilot</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Automation</p>
          </div>
        </button>

        {/* Toggles & Name */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          <div className="relative flex items-center gap-3">
            {editingName ? (
              <input
                autoFocus
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                className="text-sm font-bold text-center border-b-2 border-indigo-500 bg-transparent outline-none px-2 text-gray-900 dark:text-gray-100 w-52"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 group px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{automationName}</span>
                <span className="material-symbols-rounded text-[16px] text-gray-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all">edit</span>
              </button>
            )}
            
            {/* Active / Inactive Switch */}
            {editId && (
                <label className="inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" checked={isAutomationEnabled} onChange={toggleStatus} className="sr-only peer" />
                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ms-2 text-xs font-bold text-gray-600 dark:text-gray-300">{isAutomationEnabled ? 'Active' : 'Inactive'}</span>
                </label>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen((p) => !p)}
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <span className="material-symbols-rounded text-[22px]">dark_mode</span>
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-11 w-36 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xl z-50 overflow-hidden">
                {[
                  { id: "system", label: "System", icon: "devices" },
                  { id: "light", label: "Light", icon: "light_mode" },
                  { id: "dark", label: "Dark", icon: "dark_mode" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setTheme(item.id); setThemeOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 ${theme === item.id ? "font-bold text-indigo-500" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    <span className="material-symbols-rounded text-sm">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + credits popup */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 hover:ring-2 hover:ring-indigo-400/40 transition-all"
            >
              <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 w-68 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl z-50 p-4" style={{ width: 260 }}>
                {/* User info */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-zinc-700">
                  <img src={avatarSrc} alt="" className="w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-700" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name || "WebPilot User"}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                {/* Credits */}
                <div className="bg-gray-50 dark:bg-zinc-700/60 rounded-xl p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Daily Credits</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{isAdmin ? "∞" : dailyCredits}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-600 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${isAdmin ? "bg-emerald-400 w-full" : dailyCredits > 10 ? "bg-indigo-500" : dailyCredits > 5 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: isAdmin ? "100%" : `${Math.min(100, (dailyCredits / 20) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{isAdmin ? "Admin — Unlimited" : "Resets daily at midnight UTC"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1" />

          {/* Cancel */}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>

          {/* Save + credit cost */}
          <div className="flex flex-col items-end gap-0.5">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-md disabled:opacity-60 flex items-center gap-2"
            >
              {isSaving ? (
                <><span className="material-symbols-rounded text-sm animate-spin">refresh</span>Saving…</>
              ) : (
                <><span className="material-symbols-rounded text-base">save</span>Save Automation</>
              )}
            </button>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <span className="material-symbols-rounded text-[10px]">bolt</span>
              {isAdmin ? "Free for admin" : `${SAVE_COST} credits will be deducted`}
            </p>
          </div>
        </div>
      </div>

      {/* ── CANVAS ───────────────────────────────────────────────────────── */}
      <div className={`flex-1 relative overflow-hidden transition-all duration-300 ${viewMode === "executions" ? "mr-80" : "mr-0"}`}>
        
        {/* DELETE AUTOMATION BUTTON */}
        {editId && viewMode === "editor" && (
            <div className="absolute top-6 left-6 z-30">
               <button
                  onClick={() => setShowDeleteAutomationModal(true)}
                  className="bg-white dark:bg-zinc-800 p-2 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center group"
                  title="Delete this automation"
               >
                  <span className="material-symbols-rounded text-[20px] transition-transform group-hover:scale-110">delete</span>
               </button>
            </div>
        )}

        {/* FLOATING TOGGLE at top center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex bg-white/80 backdrop-blur-md dark:bg-zinc-800/80 rounded-full p-1 border border-gray-200/50 dark:border-zinc-700/50 shadow-xl">
          <button
             onClick={() => setViewMode("editor")}
             className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === "editor" ? "bg-indigo-600 shadow-md text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
          >
             Editor
          </button>
          <button
             onClick={() => setViewMode("executions")}
             className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === "executions" ? "bg-indigo-600 shadow-md text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
          >
             Executions
          </button>
        </div>

        <ReactFlow
          onInit={(instance) => { reactFlowInstance.current = instance; }}
          nodes={nodes.map((n) => ({ ...n, data: { ...n.data, executionState: viewMode === "executions" ? (nodeStatuses[n.id] || "idle") : "idle", viewMode } }))}
          edges={edges.map(e => ({ ...e, data: { ...e.data, viewMode } }))}
          onNodesChange={onNodesChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={true}
          nodesConnectable={viewMode === "editor"}
          elementsSelectable={true}
          edgesFocusable={viewMode === "editor"}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode="Delete"
          style={{ background: "transparent" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.5}
            color="#9ca3af"
            className="opacity-30 dark:opacity-20"
          />
          <Controls
            style={{ bottom: 120, right: 20, left: "auto", top: "auto" }}
            className="!shadow-lg !rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700"
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="material-symbols-rounded text-5xl text-gray-300 dark:text-zinc-700 block mb-2">account_tree</span>
              <p className="text-sm text-gray-400 dark:text-zinc-600 font-medium">Click a card below to add it to the canvas</p>
            </div>
          </div>
        )}

        {/* ── EXECUTE BUTTON ── */}
        {viewMode === "editor" && (
          <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-30">
              <button
                 onClick={executeWorkflow}
                 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-xl flex items-center gap-2 transform transition-transform hover:scale-105"
              >
                 <span className="material-symbols-rounded">play_arrow</span>
                 Execute Workflow
              </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM CAROUSEL ─────────────────────────────── */}
      {viewMode === "editor" && (
      <div className="flex-shrink-0 flex justify-center items-center py-5 px-6 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 z-20">
        <div className="flex items-center gap-3">

          {/* Prev */}
          <button
            onClick={() => setCarouselPage((p) => Math.max(0, p - 1))}
            disabled={carouselPage === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <span className="material-symbols-rounded text-base">chevron_left</span>
          </button>

          {/* Cards */}
          <div className="flex gap-3">
            {visibleCards.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => addAutomationNode(tmpl)}
                style={{ minWidth: 240 }}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group shadow-sm"
              >
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <span className="material-symbols-rounded text-indigo-500 dark:text-indigo-400 text-2xl">{tmpl.icon}</span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{tmpl.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{tmpl.description}</p>
                </div>
                <span className="material-symbols-rounded text-[14px] text-gray-300 dark:text-zinc-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 ml-auto flex-shrink-0 transition-colors">add_circle</span>
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setCarouselPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={carouselPage >= totalPages - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <span className="material-symbols-rounded text-base">chevron_right</span>
          </button>

          {/* Dots */}
          <div className="flex gap-1 ml-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselPage(i)}
                className={`rounded-full transition-all ${carouselPage === i ? "w-4 h-1.5 bg-indigo-500" : "w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600"}`}
              />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── EXECUTIONS SIDEBAR ────────────────────────────────────────────── */}
      <div className={`fixed right-0 top-[80px] bottom-0 w-80 bg-white dark:bg-zinc-800 border-l border-gray-200 dark:border-zinc-700 shadow-2xl transition-transform duration-300 z-40 flex flex-col ${viewMode === "executions" ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Past Executions</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">View recent automation runs</p>
          </div>
          <button onClick={() => setViewMode("editor")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-400 hover:text-gray-600">
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {executions.length === 0 ? (
                 <p className="text-center text-xs text-gray-500 py-10">No execution history found.</p>
             ) : (
                 executions.map(ex => (
                     <div 
                       key={ex.id}
                       onClick={() => setActiveExecutionId(ex.id)}
                       role="button"
                       className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all ${activeExecutionId === ex.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800"}`}
                     >
                       <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {ex.timestamp ? new Date(ex.timestamp.toDate()).toLocaleString() : "Just now"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ['completed','successful','success'].includes((ex.status||"").toLowerCase())
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : (ex.status||"").toLowerCase().includes('failed') || (ex.status||"").toLowerCase().includes('error')
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                              {(ex.status||"").toLowerCase() === 'success' ? 'successful' : ex.status}
                          </span>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex-1">{ex.message || "Execution log"}</p>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteExecutionModal(ex.id);
                            }}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 m-[-4px]"
                            title="Delete execution log"
                          >
                             <span className="material-symbols-rounded text-[14px]">delete</span>
                          </button>
                       </div>
                     </div>
                 ))
             )}
        </div>
      </div>

      {/* ── MY FLOWS LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <div className={`fixed left-0 top-[80px] bottom-0 w-72 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 shadow-2xl transition-transform duration-300 z-40 flex flex-col ${showMyFlowsPanel ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">My Automations</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Click to open a saved flow</p>
          </div>
          <button onClick={() => setShowMyFlowsPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {userAutomations.filter(a => a.isCustom).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <span className="material-symbols-rounded text-4xl text-gray-300 dark:text-zinc-700 mb-2">auto_awesome</span>
              <p className="text-xs text-gray-400 dark:text-zinc-600 font-medium">No custom flows yet.</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-700 mt-1">Build one using the canvas editor</p>
            </div>
          ) : (
            userAutomations.filter(a => a.isCustom).map((auto) => (
              <button
                key={auto.id}
                onClick={() => navigate("/canvas-automation", { state: { editAutomationId: auto.id, automationData: auto } })}
                className="w-full text-left bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-3 flex items-center gap-3 group transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-rounded text-indigo-500 text-sm">{auto.icon || "bolt"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">{auto.name || auto.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {(auto.steps?.length || 0)} step{(auto.steps?.length || 0) !== 1 ? "s" : ""}
                    {auto.status === "active" ? " · Active" : auto.status === "disabled" ? " · Inactive" : ""}
                  </p>
                </div>
                <span className="material-symbols-rounded text-[14px] text-gray-300 dark:text-zinc-600 group-hover:text-indigo-500 flex-shrink-0 transition-colors">chevron_right</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Floating My Flows Toggle (left edge) */}
      {viewMode === "editor" && (
      <button
        onClick={() => { setShowMyFlowsPanel(p => !p); setShowLogicPanel(false); }}
        className={`fixed left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border-2 border-l-0 border-gray-200 dark:border-zinc-700 shadow-xl rounded-r-2xl pr-2.5 pl-1.5 py-4 flex items-center gap-2 text-indigo-500 hover:pl-3 hover:border-indigo-500 transition-all z-30 group ${showMyFlowsPanel ? '-translate-x-full' : 'translate-x-0'}`}
        title="Browse my automations"
      >
        <span className="font-bold text-[10px] [writing-mode:vertical-rl] tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 mb-1">MY FLOWS</span>
        <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">keyboard_tab</span>
      </button>
      )}

      {/* ── BUILT-IN LOGIC NODES SIDEBAR ────────────────────────────────────────────── */}
      <div className={`fixed right-0 top-[80px] bottom-0 w-72 bg-white dark:bg-zinc-800 border-l border-gray-200 dark:border-zinc-700 shadow-2xl transition-transform duration-300 z-40 flex flex-col ${showLogicPanel && viewMode !== "executions" ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Built-in Logic</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Drag or click to add</p>
          </div>
          <button onClick={() => setShowLogicPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {LOGIC_NODES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => addAutomationNode(tmpl)}
              className="w-full text-left bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-3 flex items-center gap-3 group transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-indigo-500 text-sm">{tmpl.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">{tmpl.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{tmpl.description}</p>
              </div>
              <span className="material-symbols-rounded text-[14px] text-gray-300 dark:text-zinc-600 group-hover:text-indigo-500 ml-auto flex-shrink-0">add</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Toggle Button (if panel is hidden) */}
      {viewMode === "editor" && (
      <button
        onClick={() => { setShowLogicPanel(p => !p); setShowMyFlowsPanel(false); }}
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border-2 border-r-0 border-gray-200 dark:border-zinc-700 shadow-xl rounded-l-2xl pl-2.5 pr-1.5 py-4 flex items-center gap-2 text-indigo-500 hover:pr-3 hover:border-indigo-500 transition-all z-30 group ${showLogicPanel ? 'translate-x-full' : 'translate-x-0'}`}
        title="Access built-in nodes"
      >
        <span className="material-symbols-rounded rotate-180 group-hover:-translate-x-1 transition-transform">keyboard_tab</span>
        <span className="font-bold text-[10px] [writing-mode:vertical-rl] rotate-180 tracking-widest text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 mt-1">LOGIC NODES</span>
      </button>
      )}

      {/* ── 3-PANE CONFIG MODAL ────────────────────────────────────────────── */}
      {configNode && (
        <div className="fixed inset-0 z-[100] flex bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setConfigNode(null)}>
           <div className="w-[95vw] h-[95vh] m-auto flex flex-col bg-white dark:bg-[#121212] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setConfigNode(null)} className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm font-bold">
                        <span className="material-symbols-rounded">arrow_back</span>
                        Back to canvas
                     </button>
                  </div>
                  
                  {/* Center Node Title */}
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white dark:bg-[#242424] px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                      <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
                          <span className="material-symbols-rounded text-indigo-500 dark:text-indigo-400 text-sm">{configNode.template.icon}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{configNode.template.title}</p>
                      
                      {viewMode === "editor" && (
                         <div className="ml-4 pl-4 border-l border-gray-200 dark:border-zinc-600 flex items-center">
                            <button 
                                onClick={() => alert("Per-node execution is currently in development! Please use 'Execute Workflow' to test the full logic.")}
                                className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors"
                            >
                                <span className="material-symbols-rounded text-[14px]">play_arrow</span>
                                Execute step
                            </button>
                         </div>
                      )}
                  </div>
                  <div className="w-24"></div> {/* spacer */}
              </div>
              <div className="flex-1 flex overflow-hidden">
                 
                 {/* LEFT PANE (INPUT) */}
                 {!(configNode?.template?.nodeType?.toLowerCase().includes("trigger") || configNode?.template?.nodeType === "scheduleNode") && (
                 <div className="flex-1 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-slate-50 dark:bg-[#0f0f0f] relative">
                      {/* Upstream connected nodes left edge handles */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
                         {edges.filter(e => e.target === configNode.nodeId).map(e => {
                             const sourceNode = nodes.find(n => n.id === e.source);
                             if (!sourceNode) return null;
                             return (
                                 <div key={sourceNode.id} className="group/node relative flex items-center justify-start">
                                     <button 
                                         onClick={() => openConfig(sourceNode.id, sourceNode.data)}
                                         className="w-10 h-10 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl shadow-xl flex items-center justify-center border border-gray-200 dark:border-zinc-700 transition-all hover:scale-110 hover:border-indigo-400 dark:hover:border-indigo-500 z-10"
                                     >
                                         <span className="material-symbols-rounded text-[18px]">{sourceNode.data.icon}</span>
                                     </button>
                                     <div className="absolute left-12 opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-700 pointer-events-none z-20">
                                         {sourceNode.data.title}
                                     </div>
                                 </div>
                             );
                         })}
                      </div>

                      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800/50">
                         <span className="text-xs font-bold tracking-widest text-gray-500 dark:text-zinc-400 uppercase">Input</span>
                         {viewMode === "executions" && (
                             <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-md border border-gray-200 dark:border-zinc-700/50 gap-0.5">
                                 {['Schema', 'Table', 'JSON'].map(type => (
                                     <button 
                                        key={type} 
                                        onClick={() => setInputViewType(type)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${inputViewType === type ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 shadow-sm border-gray-200 dark:border-zinc-600' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 border-transparent'}`}
                                     >
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col min-h-0">
                          {viewMode === "executions" ? (
                              <div className="flex-1 w-full bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm relative group/copy">
                                  <button 
                                      onClick={(e) => {
                                          const rawInput = executions.find(ex => ex.id === activeExecutionId)?.executionContext?.[configNode.nodeId]?.input;
                                          const text = rawInput ? JSON.stringify(rawInput, null, 2) : "No input payload available.";
                                          navigator.clipboard.writeText(text);
                                          const btn = e.currentTarget;
                                          const icon = btn.querySelector('span');
                                          icon.className = "material-symbols-rounded text-[14px] text-green-500";
                                          icon.textContent = "check";
                                          setTimeout(() => { 
                                              if (icon) {
                                                  icon.className = "material-symbols-rounded text-[14px]"; 
                                                  icon.textContent = "content_copy"; 
                                              }
                                          }, 2000);
                                      }}
                                      className="absolute top-3 right-3 opacity-0 group-hover/copy:opacity-100 transition-opacity bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg p-1.5 flex items-center justify-center shadow-sm z-10"
                                      title="Copy to clipboard"
                                  >
                                      <span className="material-symbols-rounded text-[14px]">content_copy</span>
                                  </button>
                                  <div className={`absolute inset-0 text-xs text-gray-800 dark:text-zinc-300 p-4 overflow-auto ${inputViewType === "Table" ? "" : "font-mono whitespace-pre-wrap break-words"}`}>
                                      {(() => {
                                          const rawInput = executions.find(e => e.id === activeExecutionId)?.executionContext?.[configNode.nodeId]?.input;
                                          return renderDataView(rawInput, inputViewType);
                                      })()}
                                  </div>
                              </div>
                          ) : (
                              <div className="flex-1 flex flex-col justify-center items-center text-center">
                                  <p className="text-gray-900 dark:text-zinc-300 text-sm font-bold mb-4">No input data yet</p>
                                  <button onClick={() => alert("Per-node execution is currently in development! Please use 'Execute Workflow' to test the full logic.")} className="px-5 py-2.5 bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-700 dark:text-zinc-300 transition-colors shadow-sm">Execute previous nodes</button>
                                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-3 font-medium">to mock input from the earliest node that needs it</p>
                              </div>
                          )}
                       </div>
                  </div>
                  )}

                  {/* CENTER PANE (CONFIG) */}
                  <div className={`${(configNode?.template?.nodeType?.toLowerCase().includes("trigger") || configNode?.template?.nodeType === "scheduleNode") ? "flex-1" : "w-[450px]"} flex flex-col bg-white dark:bg-[#141414] shadow-2xl z-10 flex-shrink-0`}>
                     <div className="flex items-center gap-6 px-5 pt-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
                       {["params", "settings", "docs"].filter(t => !(t === "settings" && (configNode?.template?.nodeType?.toLowerCase().includes("trigger") || configNode?.template?.nodeType === "scheduleNode"))).map((tab) => {
                         const labels = { params: "Parameters", settings: "Settings", docs: "Docs ⇗" };
                         const active = activeConfigTab === tab;
                         return (
                           <button key={tab} onClick={() => setActiveConfigTab(tab)}
                             className={`text-sm font-bold pb-2 transition-colors ${active ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"} ${tab === "docs" ? "ml-auto" : ""}`}>
                             {labels[tab]}
                           </button>
                         );
                       })}
                     </div>

                     {viewMode === "executions" && (
                       <div className="mx-4 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                         <span className="material-symbols-rounded text-amber-500 text-[16px] flex-shrink-0">visibility</span>
                         <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Read-only — viewing recorded configuration from this execution.</p>
                       </div>
                     )}

                     <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                       {/* PARAMETERS TAB */}
                       {activeConfigTab === "params" && (
                         <>
                           {(configNode.template.inputs || []).length > 0 ? configNode.template.inputs.filter((inp) => {
                             if (!inp.dependency) return true;
                             const depVal = configValues[inp.dependency.field] !== undefined
                               ? configValues[inp.dependency.field]
                               : configNode.template.inputs.find(i => i.id === inp.dependency.field)?.defaultValue;
                             if (Array.isArray(inp.dependency.value)) return inp.dependency.value.includes(depVal);
                             return depVal === inp.dependency.value;
                           }).map((inp) => (
                             <div key={inp.id} className={viewMode === "executions" ? "opacity-60 pointer-events-none" : ""}>
                               {inp.type !== "toggle" && <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{inp.label}</label>}
                               {inp.type === "textarea" ? (
                                 <textarea rows={6} placeholder={inp.placeholder || ""} value={configValues[inp.id] || ""}
                                   onChange={(e) => setConfigValues(v => ({ ...v, [inp.id]: e.target.value }))}
                                   className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y shadow-inner" />
                               ) : inp.type === "select" ? (
                                 <select value={configValues[inp.id] || inp.defaultValue || ""}
                                   onChange={(e) => setConfigValues(v => ({ ...v, [inp.id]: e.target.value }))}
                                   className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner">
                                   {(inp.options || []).map(o => <option key={o}>{o}</option>)}
                                 </select>
                               ) : inp.type === "radio" ? (
                                 <div className="flex flex-wrap gap-3">
                                   {(inp.options || []).map(o => (
                                     <label key={o} className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800">
                                       <input type="radio" name={inp.id} value={o}
                                         checked={(configValues[inp.id] !== undefined ? configValues[inp.id] : inp.defaultValue) === o}
                                         onChange={(e) => setConfigValues(v => ({ ...v, [inp.id]: e.target.value }))}
                                         className="accent-indigo-500 w-4 h-4" />
                                       <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{o}</span>
                                     </label>
                                   ))}
                                 </div>
                               ) : inp.type === "toggle" ? (
                                 <label className="inline-flex items-center cursor-pointer relative mt-1 flex-row-reverse justify-end gap-3">
                                   <input type="checkbox"
                                     checked={configValues[inp.id] !== undefined ? !!configValues[inp.id] : !!inp.defaultValue}
                                     onChange={(e) => setConfigValues(v => ({ ...v, [inp.id]: e.target.checked }))}
                                     className="sr-only peer" />
                                   <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-[#1a1a1a] dark:border dark:border-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-emerald-500"></div>
                                   <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{inp.label}</span>
                                 </label>
                               ) : inp.type === "datetime-local" ? (
                                 <div className="pt-1">
                                   <CustomDateTimePicker value={configValues[inp.id]} placeholder={inp.placeholder || "Select date and time"}
                                     onChange={(val) => setConfigValues(v => ({ ...v, [inp.id]: val }))} />
                                 </div>
                               ) : (
                                 <input type={inp.type === "url" ? "url" : inp.type === "number" ? "number" : "text"}
                                   placeholder={inp.placeholder || ""} value={configValues[inp.id] || ""}
                                   onChange={(e) => setConfigValues(v => ({ ...v, [inp.id]: e.target.value }))}
                                   className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner" />
                               )}
                               {inp.helperText && <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-500 mt-1.5">{inp.helperText}</p>}
                             </div>
                           )) : (
                             <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                               <span className="material-symbols-rounded text-4xl text-gray-300 dark:text-zinc-700 mb-3">settings_suggest</span>
                               <p className="text-sm font-bold text-gray-500 dark:text-zinc-500">No configuration needed.</p>
                             </div>
                           )}
                         </>
                       )}

                       {/* SETTINGS TAB */}
                       {activeConfigTab === "settings" && (() => {
                         const ns = nodeSettings[configNode.nodeId] || {};
                         const setNs = (key, val) => setNodeSettings(prev => ({
                           ...prev,
                           [configNode.nodeId]: { ...(prev[configNode.nodeId] || {}), [key]: val }
                         }));
                         return (
                           <div className={`space-y-6 ${viewMode === "executions" ? "opacity-60 pointer-events-none" : ""}`}>
                             <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-[#1a1a1a]">
                               <div>
                                 <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Continue on Error</p>
                                 <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5">If ON, the workflow continues even if this node fails.</p>
                               </div>
                               <label className="inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={!!ns.continueOnError}
                                   onChange={(e) => setNs("continueOnError", e.target.checked)} />
                                 <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                               </label>
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Retry on Failure</label>
                               <p className="text-[11px] text-gray-400 dark:text-zinc-500 mb-2">Auto retries if this node fails (0 = disabled).</p>
                               <div className="flex gap-2">
                                 {[0, 1, 2, 3, 5].map(n => (
                                   <button key={n} onClick={() => setNs("retryCount", n)}
                                     className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all ${(ns.retryCount ?? 0) === n ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400"}`}>
                                     {n}
                                   </button>
                                 ))}
                               </div>
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Timeout (seconds)</label>
                               <p className="text-[11px] text-gray-400 dark:text-zinc-500 mb-2">Max wait before failing this node. Leave blank for no limit.</p>
                               <input type="number" min={0} placeholder="e.g. 120" value={ns.timeout || ""}
                                 onChange={(e) => setNs("timeout", e.target.value ? parseInt(e.target.value) : undefined)}
                                 className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner" />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Output Variable Name</label>
                               <p className="text-[11px] text-gray-400 dark:text-zinc-500 mb-2">Custom alias for this step output. Defaults to <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">{"{{PREVIOUS_RESULT}}"}</code>.</p>
                               <input type="text" placeholder="e.g. VIDEO_URL" value={ns.outputAlias || ""}
                                 onChange={(e) => setNs("outputAlias", e.target.value)}
                                 className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner" />
                               {ns.outputAlias && (
                                 <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-1.5 font-bold">Use <code>{`{{${ns.outputAlias}}}`}</code> in subsequent nodes.</p>
                               )}
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Step Notes</label>
                               <p className="text-[11px] text-gray-400 dark:text-zinc-500 mb-2">Private notes — visible only in the editor.</p>
                               <textarea rows={4} placeholder="e.g. Sends the daily email digest to the marketing list..."
                                 value={ns.notes || ""} onChange={(e) => setNs("notes", e.target.value)}
                                 className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y shadow-inner" />
                             </div>
                           </div>
                         );
                       })()}

                       {/* DOCS TAB */}
                       {activeConfigTab === "docs" && (() => {
                         const tpl = templateAutomations.find(a =>
                           a.id === configNode.template.id ||
                           a.n8nWebhookId === configNode.template.n8nWebhookId
                         );
                         const docs = tpl?.docs;
                         if (!docs) return (
                           <div className="flex flex-col items-center justify-center h-full text-center p-10">
                             <span className="material-symbols-rounded text-4xl text-gray-300 dark:text-zinc-700 mb-3">menu_book</span>
                             <p className="text-sm font-bold text-gray-500 dark:text-zinc-500">No documentation available for this node.</p>
                           </div>
                         );
                         return (
                           <div className="space-y-8 pb-4">
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                               <div className="flex items-center gap-2 mb-2">
                                 <span className="material-symbols-rounded text-indigo-500 text-base">info</span>
                                 <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Overview</p>
                               </div>
                               <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{docs.overview}</p>
                             </div>
                             {docs.setup?.length > 0 && (
                               <div>
                                 <div className="flex items-center gap-2 mb-3">
                                   <span className="material-symbols-rounded text-emerald-500 text-base">checklist</span>
                                   <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Setup Guide</p>
                                 </div>
                                 <ol className="space-y-2">
                                   {docs.setup.map((step, i) => (
                                     <li key={i} className="flex items-start gap-3">
                                       <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                                       <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step}</p>
                                     </li>
                                   ))}
                                 </ol>
                               </div>
                             )}
                             {docs.errorHandling?.length > 0 && (
                               <div>
                                 <div className="flex items-center gap-2 mb-3">
                                   <span className="material-symbols-rounded text-red-400 text-base">error</span>
                                   <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Error Handling</p>
                                 </div>
                                 <div className="space-y-3">
                                   {docs.errorHandling.map((item, i) => (
                                     <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800">
                                       <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1.5">
                                         <span className="material-symbols-rounded text-[12px]">warning</span>
                                         {item.error}
                                       </p>
                                       <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">{item.fix}</p>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                             {docs.tips?.length > 0 && (
                               <div>
                                 <div className="flex items-center gap-2 mb-3">
                                   <span className="material-symbols-rounded text-amber-500 text-base">lightbulb</span>
                                   <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Pro Tips</p>
                                 </div>
                                 <ul className="space-y-2">
                                   {docs.tips.map((tip, i) => (
                                     <li key={i} className="flex items-start gap-2.5">
                                       <span className="material-symbols-rounded text-amber-400 text-[14px] mt-0.5 flex-shrink-0">arrow_right</span>
                                       <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                           </div>
                         );
                       })()}

                     </div>

                     {viewMode === "editor" && (
                       <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#141414]">
                         <button onClick={saveConfig} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-transform hover:scale-[1.02] shadow-xl">
                           Save Configuration
                         </button>
                       </div>
                     )}
                  </div>

                 {/* RIGHT PANE (OUTPUT) */}
                 <div className="flex-1 border-l border-gray-200 dark:border-zinc-800 flex flex-col bg-slate-50 dark:bg-[#0f0f0f] relative">
                     {/* Downstream connected nodes right edge handles */}
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
                        {edges.filter(e => e.source === configNode.nodeId).map(e => {
                            const targetNode = nodes.find(n => n.id === e.target);
                            if (!targetNode) return null;
                            return (
                                <div key={targetNode.id} className="group/node relative flex items-center justify-end">
                                    <div className="absolute right-12 opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-700 pointer-events-none z-20">
                                        {targetNode.data.title}
                                    </div>
                                    <button 
                                        onClick={() => openConfig(targetNode.id, targetNode.data)}
                                        className="w-10 h-10 bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl shadow-xl flex items-center justify-center border border-gray-200 dark:border-zinc-700 transition-all hover:scale-110 hover:border-indigo-400 dark:hover:border-indigo-500 z-10"
                                    >
                                        <span className="material-symbols-rounded text-[18px]">{targetNode.data.icon}</span>
                                    </button>
                                </div>
                            );
                        })}
                     </div>

                     <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800/50">
                        <span className="text-xs font-bold tracking-widest text-gray-500 dark:text-zinc-400 uppercase">Output</span>
                        {viewMode === "executions" && (
                             <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-md border border-gray-200 dark:border-zinc-700/50 gap-0.5">
                                 {['Schema', 'Table', 'JSON'].map(type => (
                                     <button 
                                        key={type} 
                                        onClick={() => setOutputViewType(type)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${outputViewType === type ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 shadow-sm border-gray-200 dark:border-zinc-600' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 border-transparent'}`}
                                     >
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         )}
                     </div>
                     <div className="flex-1 p-4 flex flex-col min-h-0">
                         {viewMode === "executions" ? (
                             <div className="flex-1 w-full bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm relative group/copy">
                                 <button 
                                     onClick={(e) => {
                                         const ctx = executions.find(ex => ex.id === activeExecutionId)?.executionContext?.[configNode.nodeId];
                                         let text = "No output trace available.";
                                         if (ctx) {
                                             if (ctx.output && Object.keys(ctx.output).length > 0) {
                                                 text = JSON.stringify(ctx.output, null, 2);
                                             } else {
                                                 const { input: _omit, output: _omit2, ...rest } = ctx;
                                                 if (Object.keys(rest).length > 0) text = JSON.stringify(rest, null, 2);
                                             }
                                         }
                                         navigator.clipboard.writeText(text);
                                         const btn = e.currentTarget;
                                         const icon = btn.querySelector('span');
                                         icon.className = "material-symbols-rounded text-[14px] text-green-500";
                                         icon.textContent = "check";
                                         setTimeout(() => { 
                                             if (icon) {
                                                 icon.className = "material-symbols-rounded text-[14px]"; 
                                                 icon.textContent = "content_copy"; 
                                             }
                                         }, 2000);
                                     }}
                                     className="absolute top-3 right-3 opacity-0 group-hover/copy:opacity-100 transition-opacity bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg p-1.5 flex items-center justify-center shadow-sm z-10"
                                     title="Copy to clipboard"
                                 >
                                     <span className="material-symbols-rounded text-[14px]">content_copy</span>
                                 </button>
                                 <div className={`absolute inset-0 text-xs text-gray-800 dark:text-zinc-300 p-4 overflow-auto ${outputViewType === "Table" ? "" : "font-mono whitespace-pre-wrap break-words"}`}>
                                     {(() => {
                                         const ctx = executions.find(e => e.id === activeExecutionId)?.executionContext?.[configNode.nodeId];
                                         let rawOutput = null;
                                         if (ctx) {
                                             if (ctx.output && Object.keys(ctx.output).length > 0) {
                                                 rawOutput = ctx.output;
                                             } else {
                                                 const { input: _omit, output: _omit2, ...rest } = ctx;
                                                 if (Object.keys(rest).length > 0) rawOutput = rest;
                                             }
                                         }
                                         return renderDataView(rawOutput, outputViewType);
                                     })()}
                                 </div>
                             </div>
                         ) : (
                             <div className="flex-1 flex flex-col justify-center items-center text-center">
                                 <p className="text-gray-900 dark:text-zinc-300 text-sm font-bold mb-3">Execute this node to view data</p>
                             </div>
                         )}
                     </div>
                 </div>

               </div>
           </div>
        </div>
      )}

      {/* -------- Delete Confirmation Modal -------- */}
      {deleteExecutionModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => !isDeletingExecution && setDeleteExecutionModal(null)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col gap-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <span className="material-symbols-rounded text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Delete Execution Log
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              If you delete this execution log, it will be permanently removed and you cannot reverse this action.
            </p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setDeleteExecutionModal(null)}
                className="flex-1 h-10 text-sm font-semibold rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                disabled={isDeletingExecution}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExecutionLog}
                disabled={isDeletingExecution}
                className="flex-1 h-10 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeletingExecution ? (
                   <span className="material-symbols-rounded animate-spin text-[18px]">progress_activity</span>
                ) : (
                   "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Delete Automation Modal -------- */}
      {showDeleteAutomationModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => !isDeletingAutomation && setShowDeleteAutomationModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col gap-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <span className="material-symbols-rounded text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Delete Automation
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{automationName}"</span>? This will permanently remove the workflow and all of its execution logs.
            </p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteAutomationModal(false)}
                className="flex-1 h-10 text-sm font-semibold rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                disabled={isDeletingAutomation}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAutomation}
                disabled={isDeletingAutomation}
                className="flex-1 h-10 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeletingAutomation ? (
                   <span className="material-symbols-rounded animate-spin text-[18px]">progress_activity</span>
                ) : (
                   "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
