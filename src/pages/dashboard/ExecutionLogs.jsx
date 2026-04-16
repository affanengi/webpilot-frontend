import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import { formatDailyStackedData } from "../../utils/chartUtils";
import DailyStatusStackedChart from "../../components/ui/DailyStatusStackedChart";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const WORKFLOW_DROPDOWN_WIDTH = 256;
const TIME_DROPDOWN_WIDTH = 160;

export default function ExecutionLogs() {
  const [searchParams] = useSearchParams();
  const initialWorkflow = searchParams.get("workflow") || "All";
  const [workflowFilter, setWorkflowFilter] = useState(initialWorkflow);
  const [timeFilter, setTimeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultModal, setResultModal] = useState(null); // { name, status, date, message, resultLink }
  const [deleteModal, setDeleteModal] = useState(null);
  const [analyzeModal, setAnalyzeModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();

  const workflowBtnRef = useRef(null);
  const timeBtnRef = useRef(null);
  const workflowMenuRef = useRef(null);
  const timeMenuRef = useRef(null);

  const [workflowPos, setWorkflowPos] = useState({ top: 0, left: 0 });
  const [timePos, setTimePos] = useState({ top: 0, left: 0 });

  const handleDeleteLog = async () => {
    if (!deleteModal || !user?.uid) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "execution_logs", deleteModal));
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Failed to delete the execution log.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (
        workflowOpen &&
        !workflowMenuRef.current?.contains(e.target) &&
        !workflowBtnRef.current?.contains(e.target)
      ) {
        setWorkflowOpen(false);
      }

      if (
        timeOpen &&
        !timeMenuRef.current?.contains(e.target) &&
        !timeBtnRef.current?.contains(e.target)
      ) {
        setTimeOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [workflowOpen, timeOpen]);

  /* ---------- FETCH LOGS ---------- */
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "execution_logs"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.automationName || "Automation",
          status: data.status || "Unknown",
          icon: data.icon || "receipt_long",
          date: data.timestamp ? data.timestamp.toDate() : new Date(),
          resultLink: data.resultLink,
          message: data.message,
          chartData: data.chartData || null,
          executionContext: data.executionContext || {}
        };
      });
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const workflows = useMemo(
    () => ["All", ...new Set(logs.map((l) => l.name))],
    [logs]
  );

  const now = new Date();

  // If a log has been Running for over 15 minutes, display it as Timed Out.
  // N8N may have failed without calling the callback — this prevents infinite spinners.
  const TIMEOUT_MS = 15 * 60 * 1000;
  const getEffectiveStatus = (log) => {
    if (log.status === "Running" && now - log.date > TIMEOUT_MS) return "Timed Out";
    return log.status;
  };

  const filteredLogs = logs.filter((log) => {
    const workflowMatch =
      workflowFilter === "All" || log.name === workflowFilter;

    let timeMatch = true;
    if (timeFilter === "24h")
      timeMatch = now - log.date <= 24 * 60 * 60 * 1000;
    if (timeFilter === "7d")
      timeMatch = now - log.date <= 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === "30d")
      timeMatch = now - log.date <= 30 * 24 * 60 * 60 * 1000;

    const effectiveStatus = getEffectiveStatus(log);
    const statusLower = effectiveStatus.toLowerCase();
    
    let statusMatch = true;
    if (statusFilter === "Successful") {
       statusMatch = ["success", "successful", "completed"].includes(statusLower);
    } else if (statusFilter === "Failed") {
       statusMatch = statusLower === "failed";
    } else if (statusFilter === "Timeout") {
       statusMatch = ["timed out", "timeout"].includes(statusLower);
    } else if (statusFilter === "Running") {
       statusMatch = statusLower === "running";
    }

    return workflowMatch && timeMatch && statusMatch;
  });

  const chartDays = timeFilter === "24h" ? 2 : timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 14; 
  const chartData = useMemo(() => formatDailyStackedData(filteredLogs, chartDays), [filteredLogs, chartDays]);

  const openWorkflowDropdown = () => {
    const rect = workflowBtnRef.current.getBoundingClientRect();
    setWorkflowPos({
      top: rect.bottom + 8,
      left: Math.min(
        rect.left,
        window.innerWidth - WORKFLOW_DROPDOWN_WIDTH - 12
      ),
    });
    setWorkflowOpen((p) => !p);
    setTimeOpen(false);
  };

  const openTimeDropdown = () => {
    const rect = timeBtnRef.current.getBoundingClientRect();
    setTimePos({
      top: rect.bottom + 8,
      left: Math.min(
        rect.left,
        window.innerWidth - TIME_DROPDOWN_WIDTH - 12
      ),
    });
    setTimeOpen((p) => !p);
    setWorkflowOpen(false);
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
            <span className="material-symbols-rounded text-primary">receipt_long</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Execution Logs
          </h2>
        </div>

        <div className="flex gap-3">
          <button
            ref={workflowBtnRef}
            onClick={openWorkflowDropdown}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            {workflowFilter}
            <span className="material-symbols-outlined text-[18px] text-gray-400">
              expand_more
            </span>
          </button>

          <button
            ref={timeBtnRef}
            onClick={openTimeDropdown}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            {timeFilter === "All" ? "All time" : timeFilter}
            <span className="material-symbols-outlined text-[18px] text-gray-400">
              expand_more
            </span>
          </button>
        </div>
      </div>

      {workflowOpen && (
        <div
          ref={workflowMenuRef}
          className="fixed z-50 w-64 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black/5"
          style={workflowPos}
        >
          <div className="p-3 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-white/5 rounded-t-xl">
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/20 border border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary-light dark:text-text-primary-dark placeholder-gray-400"
            />
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {workflows
              .filter((w) =>
                w.toLowerCase().includes(search.toLowerCase())
              )
              .map((wf) => (
                <button
                  key={wf}
                  onClick={() => {
                    setWorkflowFilter(wf);
                    setWorkflowOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-text-primary-light dark:text-text-primary-dark transition-colors"
                >
                  {wf}
                </button>
              ))}
          </div>
        </div>
      )}

      {timeOpen && (
        <div
          ref={timeMenuRef}
          className="fixed z-50 w-40 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black/5 p-1"
          style={timePos}
        >
          {["All", "24h", "7d", "30d"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTimeFilter(t);
                setTimeOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-text-primary-light dark:text-text-primary-dark transition-colors"
            >
              {t === "All" ? "All time" : t}
            </button>
          ))}
        </div>
      )}

      {/* CHART SECTION */}
      <div className="border-b border-border-light dark:border-border-dark p-6 bg-gray-50/50 dark:bg-black/10">
        <DailyStatusStackedChart data={chartData} />
      </div>

      {/* FILTER CHIPS SECTION */}
      <div className="p-4 sm:px-6 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <div className="flex flex-wrap gap-2">
          {["All", "Successful", "Failed", "Timeout", "Running"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                statusFilter === status
                  ? status === "Successful"
                    ? "bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400"
                    : status === "Failed"
                      ? "bg-red-100 border-red-200 text-red-800 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400"
                      : status === "Timeout"
                        ? "bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400"
                        : status === "Running"
                          ? "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400"
                          : "bg-gray-200 border-gray-300 text-gray-800 dark:bg-white/20 dark:border-white/20 dark:text-white"
                  : "bg-transparent border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* COUNT BADGE */}
        <div className="flex items-center gap-1.5 ml-4 shrink-0">
          {statusFilter !== "All" && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              statusFilter === "Successful"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : statusFilter === "Failed"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  : statusFilter === "Timeout"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
            }`}>
              {filteredLogs.length}
            </span>
          )}
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium whitespace-nowrap">
            {statusFilter === "All"
              ? `Total: ${filteredLogs.length} execution${filteredLogs.length !== 1 ? "s" : ""}`
              : `of ${logs.length} total`}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase text-text-secondary-light dark:text-text-secondary-dark bg-gray-50/50 dark:bg-white/5 border-y border-border-light dark:border-border-dark">
            <tr>
              <th className="py-4 px-6">Workflow</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Date & Time</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-text-primary-light dark:text-text-primary-dark flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded">
                      {log.icon}
                    </span>
                  </div>
                  {log.name}
                </td>

                <td className="py-4 px-6">
                  {(() => {
                    const effectiveStatus = getEffectiveStatus(log);
                    const isSuccess = effectiveStatus === "Success" || effectiveStatus === "Successful" || effectiveStatus === "successful" || effectiveStatus === "completed";
                    const isRunning = effectiveStatus === "Running";
                    const isTimedOut = effectiveStatus === "Timed Out";
                    const colorClass = isSuccess
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : isRunning
                        ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : isTimedOut
                          ? "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400";
                    return (
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-center inline-block min-w-20 ${colorClass}`}>
                        {isRunning && <span className="material-symbols-rounded text-[12px] align-middle mr-1 animate-spin">refresh</span>}
                        {isTimedOut && <span className="material-symbols-rounded text-[12px] align-middle mr-1">schedule</span>}
                        {effectiveStatus}
                      </span>
                    );
                  })()}
                </td>

                <td className="py-4 px-6 text-text-secondary-light dark:text-text-secondary-dark font-medium">
                  {log.date.toLocaleString()}
                  <p className="text-xs text-gray-400 mt-1">{log.message || ""}</p>
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => setResultModal({
                        name: log.name,
                        status: getEffectiveStatus(log),
                        date: log.date,
                        message: log.message,
                        resultLink: log.resultLink,
                        chartData: log.chartData,
                        executionContext: log.executionContext,
                      })}
                      variant="outline"
                      className="h-8 py-1 px-3 text-xs rounded-full whitespace-nowrap"
                    >
                      View Results
                    </Button>
                    <button
                      onClick={() => setDeleteModal(log.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete log"
                    >
                      <span className="material-symbols-rounded text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------- Delete Confirmation Modal -------- */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => !isDeleting && setDeleteModal(null)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <span className="material-symbols-rounded text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  Delete Execution Log
                </h3>
              </div>
            </div>

            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              If you delete this execution log, it will be permanently removed and you cannot reverse this action.
            </p>

            <div className="flex gap-3 mt-2">
              <Button
                onClick={() => setDeleteModal(null)}
                variant="outline"
                className="flex-1 h-10 text-sm font-semibold"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                onClick={handleDeleteLog}
                disabled={isDeleting}
                className="flex-1 h-10 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Result Detail Modal -------- */}
      {resultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setResultModal(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setResultModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-rounded text-[22px]">close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-rounded text-[22px]">receipt_long</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  Execution Result
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                  Workflow details
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 dark:bg-black/20 rounded-xl border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Workflow</span>
                <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">{resultModal.name}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Status</span>
                {(() => {
                  const s = resultModal.status;
                  const isSuccess = ["Success","Successful","successful","completed"].includes(s);
                  const colorClass = isSuccess
                    ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400";
                  return (
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${colorClass}`}>
                      {s}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Timestamp</span>
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{resultModal.date.toLocaleString()}</span>
              </div>
              {resultModal.message && (
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark shrink-0">Message</span>
                  <span className="text-xs text-right text-text-secondary-light dark:text-text-secondary-dark">{resultModal.message}</span>
                </div>
              )}
            </div>

            {/* Link or no-result notice */}
            {(() => {
              // Extract all potential links from execution context, fallback to root resultLink
              const collectedLinks = new Set();
              if (resultModal.resultLink) collectedLinks.add(resultModal.resultLink);
              
              if (resultModal.executionContext) {
                Object.values(resultModal.executionContext).forEach(stepCtx => {
                  if (stepCtx && typeof stepCtx.result === 'string' && stepCtx.result.startsWith('http')) {
                    collectedLinks.add(stepCtx.result);
                  }
                });
              }
              const linksArray = Array.from(collectedLinks);

              if (linksArray.length > 0) {
                return (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Generated result links:
                    </p>
                    {linksArray.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors group"
                      >
                        <span className="material-symbols-rounded text-primary text-[18px] shrink-0">open_in_new</span>
                        <span className="text-sm font-semibold text-primary truncate group-hover:underline">
                          {link}
                        </span>
                      </a>
                    ))}
                  </div>
                );
              }
              
              if (resultModal.status?.toUpperCase() === 'FAILED') {
                return (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                    <span className="material-symbols-rounded text-red-500 text-[20px] shrink-0 mt-0.5">error</span>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      This automation failed in between. You can re-run the automation from the Automations page.
                    </p>
                  </div>
                );
              }
              
              if (resultModal.status?.toUpperCase() === 'TIMED OUT') {
                return (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                    <span className="material-symbols-rounded text-orange-500 text-[20px] shrink-0 mt-0.5">schedule</span>
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      This automation did not produce a result. It was stopped because it exceeded the allowed execution time (timed out). You can manually run automation from Automations page.
                    </p>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Action Buttons Container */}
            <div className="flex flex-col gap-3">
              {resultModal.chartData && resultModal.status?.toUpperCase() !== 'FAILED' && (
                <button
                  onClick={() => {
                    setAnalyzeModal(resultModal);
                    setResultModal(null);
                  }}
                  className="flex items-center justify-center gap-2 w-full h-10 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-rounded text-[18px]">bar_chart</span>
                  Analyze Results
                </button>
              )}
              {/* Footer */}
              <Button onClick={() => setResultModal(null)} variant="outline" className="w-full h-10 text-sm font-semibold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Analyze / Chart Viewer (Full Screen) -------- */}
      {analyzeModal && (() => {
        // Parse chartData string from Firestore — now { insightsText, charts }
        let charts = [];
        let insightsText = '';
        try {
          if (analyzeModal.chartData) {
            const parsed = JSON.parse(analyzeModal.chartData);
            // Support both old plain-array format and new { insightsText, charts } format
            if (Array.isArray(parsed)) {
              charts = parsed;
            } else {
              charts = parsed.charts || [];
              insightsText = parsed.insightsText || '';
            }
          }
        } catch(e) {}

        const PALETTE = [
          "#6366f1","#22d3ee","#f59e0b","#34d399","#f87171",
          "#a78bfa","#fb923c","#38bdf8","#4ade80","#e879f9"
        ];

        // Build recharts-compatible data from each chart config
        const buildData = (chart) =>
          chart.labels.map((label, i) => ({
            name: label,
            ...chart.datasets.reduce((acc, ds) => {
              acc[ds.label] = ds.data[i] ?? 0;
              return acc;
            }, {})
          }));

        const renderChart = (chart, idx) => {
          const data = buildData(chart);
          const seriesKeys = chart.datasets.map(d => d.label);

          if (chart.type === 'pie' || chart.type === 'doughnut') {
            const pieData = chart.labels.map((label, i) => ({
              name: label,
              value: chart.datasets[0]?.data[i] ?? 0
            }));
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">{chart.title}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name, percent}) => `${name} (${(percent*100).toFixed(0)}%)`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          }

          if (chart.type === 'line') {
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">{chart.title}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{top:5,right:30,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                    <XAxis dataKey="name" tick={{fontSize:12}} />
                    <YAxis tick={{fontSize:12}} />
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                    {seriesKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{r:4}} activeDot={{r:6}} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          }

          // Default: bar
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">{chart.title}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{top:5,right:30,left:0,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                  <XAxis dataKey="name" tick={{fontSize:12}} />
                  <YAxis tick={{fontSize:12}} />
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Legend />
                  {seriesKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} fill={PALETTE[i % PALETTE.length]} radius={[4,4,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        };

        return (
          <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-rounded text-[22px]">bar_chart</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Data Analysis Results</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{analyzeModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyzeModal(null)}
                className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-gray-500 dark:text-gray-300"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto flex flex-col gap-6">

                {/* AI Insights */}
                {insightsText && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-rounded text-indigo-500 text-[20px]">auto_awesome</span>
                      <h3 className="text-base font-bold text-gray-800 dark:text-white">AI Insights</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{insightsText}</pre>
                    </div>
                  </div>
                )}

                {/* Charts Grid */}
                {charts.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-indigo-500 text-[18px]">stacked_bar_chart</span>
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Visualizations</h3>
                    </div>
                    <div className={`grid gap-6 ${ charts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2' }`}>
                      {charts.map((chart, idx) => renderChart(chart, idx))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <span className="material-symbols-rounded text-5xl mb-4 opacity-40">data_alert</span>
                    <p className="text-sm">No chart data available for this run.</p>
                    <p className="text-xs mt-1 opacity-70">Make sure 'Generate Charts' was enabled and the analysis succeeded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}