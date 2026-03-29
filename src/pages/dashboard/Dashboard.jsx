import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import ExecutionTrendChart from "../../components/ui/ExecutionTrendChart";
import StatusDistributionChart from "../../components/ui/StatusDistributionChart";
import { formatExecutionTrend, formatStatusDistribution } from "../../utils/chartUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalAutomations: 0,
    activeAutomations: 0,
    failedExecutions: 0,
    connectedAccounts: 0
  });
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [trendLogs, setTrendLogs] = useState([]);

  const trendData = useMemo(() => formatExecutionTrend(trendLogs, 7), [trendLogs]);
  const distributionData = useMemo(() => formatStatusDistribution(trendLogs), [trendLogs]);

  useEffect(() => {
    if (!user?.uid) return;

    const autoUnsub = onSnapshot(collection(db, "users", user.uid, "automations"), (snapshot) => {
      let total = snapshot.size;
      let active = 0;
      snapshot.forEach(doc => {
        if (doc.data().status === 'enabled' || doc.data().status === 'active') active++;
      });
      setStats(s => ({ ...s, totalAutomations: total, activeAutomations: active }));
    });

    const accountsUnsub = onSnapshot(collection(db, "users", user.uid, "connected_accounts"), (snapshot) => {
      setStats(s => ({ ...s, connectedAccounts: snapshot.size }));
    });

    const recentQ = query(collection(db, "users", user.uid, "execution_logs"), orderBy("timestamp", "desc"), limit(4));
    const recentUnsub = onSnapshot(recentQ, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().automationName || "Unknown",
        status: docSnap.data().status || "Unknown",
        icon: docSnap.data().icon || "receipt_long",
        time: docSnap.data().timestamp ? docSnap.data().timestamp.toDate().toLocaleString() : "Just now",
        isTimedOut: docSnap.data().status === "Running" && new Date() - docSnap.data().timestamp?.toDate() > 15 * 60 * 1000
      }));
      setRecentExecutions(logs);
    });

    const failedQ = query(collection(db, "users", user.uid, "execution_logs"), where("status", "in", ["Failed", "failed", "error", "Error", "timeout", "TIMEOUT", "Timed Out", "timed out"]));
    const failedUnsub = onSnapshot(failedQ, (snapshot) => {
      setStats(s => ({ ...s, failedExecutions: snapshot.size }));
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const trendQ = query(collection(db, "users", user.uid, "execution_logs"), where("timestamp", ">=", sevenDaysAgo));
    const trendUnsub = onSnapshot(trendQ, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => docSnap.data());
      setTrendLogs(logs);
    });

    return () => {
      autoUnsub();
      accountsUnsub();
      recentUnsub();
      failedUnsub();
      trendUnsub();
    };
  }, [user]);

  // 🔹 ICON + COLOR CONFIG FOR RECENT EXECUTIONS
  // Using background/text tokens for better dark mode adaptation
  const executionMeta = {
    "HubSpot Data Sync": {
      icon: "sync",
      bg: "bg-blue-100 dark:bg-blue-500/10",
      color: "text-blue-600 dark:text-blue-400",
    },
    "Lead Enrichment Email": {
      icon: "mail",
      bg: "bg-purple-100 dark:bg-purple-500/10",
      color: "text-purple-600 dark:text-purple-400",
    },
    "Weekly Report Generator": {
      icon: "description",
      bg: "bg-orange-100 dark:bg-orange-500/10",
      color: "text-orange-600 dark:text-orange-400",
    },
    "Slack Notification Bot": {
      icon: "chat",
      bg: "bg-emerald-100 dark:bg-emerald-500/10",
      color: "text-emerald-600 dark:text-emerald-400",
    },
  };

  return (
    <>
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Total Automations */}
        <div className="group bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-2xl">
                smart_toy
              </span>
            </div>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
              +12%
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">{stats.totalAutomations}</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
              Total Automations
            </p>
          </div>
        </div>

        {/* Active Automations */}
        <div className="group bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-2xl">
                play_circle
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">{stats.activeAutomations}</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
              Active Automations
            </p>
          </div>
        </div>

        {/* Failed Executions */}
        <div className="group bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark hover:shadow-lg hover:border-red-500/20 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-red-600 dark:text-red-400 text-2xl">
                error
              </span>
            </div>
            <span className="text-xs bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
              Needs Attention
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">{stats.failedExecutions}</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
              Failed Executions
            </p>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="group bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-purple-600 dark:text-purple-400 text-2xl">
                link
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">{stats.connectedAccounts}</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
              Connected Accounts
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* EXECUTION VOLUME CARD */}
        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
              <span className="material-symbols-rounded text-primary">timeline</span>
            </div>
            <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
              Execution Volume (Last 7 Days)
            </h3>
          </div>
          <div className="p-6 flex-1">
            <ExecutionTrendChart data={trendData} />
          </div>
        </div>

        {/* STATUS DISTRIBUTION CARD */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
              <span className="material-symbols-rounded text-primary">pie_chart</span>
            </div>
            <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
              Status Distribution
            </h3>
          </div>
          <div className="p-6 flex-1 w-full flex items-center justify-center">
            <StatusDistributionChart data={distributionData} />
          </div>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* RECENT EXECUTIONS */}
        <div className="xl:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                <span className="material-symbols-rounded text-primary">receipt_long</span>
              </div>
              <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                Recent Executions
              </h3>
            </div>
            <button
              className="text-primary text-sm font-semibold hover:text-primary-hover hover:underline transition-colors"
              onClick={() => navigate("/execution-logs")}
            >
              View All
            </button>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider border-b border-border-light dark:border-border-dark">
                  <th className="py-3 pb-4 pl-2">Automation Name</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Execution Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-light dark:divide-gray-800">
                {recentExecutions.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      No recent executions found.
                    </td>
                  </tr>
                ) : recentExecutions.map((log) => {
                  const effectiveStatus = log.isTimedOut ? "Timed Out" : log.status;
                  const statusLower = (effectiveStatus || '').toLowerCase();
                  const isSuccess = ['success', 'successful', 'completed', 'complete'].includes(statusLower);
                  const isRunning = statusLower.startsWith('running');
                  const isTimedOut = statusLower === 'timed out' || statusLower === 'timeout';
                  
                  return (
                  <tr
                    key={log.id}
                    className="group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-4 pl-2 flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${executionMeta[log.name]?.bg || "bg-primary/10"}`}
                      >
                        <span
                          className={`material-symbols-rounded text-xl ${executionMeta[log.name]?.color || "text-primary"}`}
                        >
                          {log.icon || executionMeta[log.name]?.icon || "code"}
                        </span>
                      </div>
                      <span className="font-medium text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
                        {log.name}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${
                            isSuccess
                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : isRunning
                            ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : isTimedOut
                            ? "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                            : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                          }`}
                      >
                        {isRunning && <span className="material-symbols-rounded text-[12px] align-middle mr-1 animate-spin">refresh</span>}
                        {isTimedOut && <span className="material-symbols-rounded text-[12px] align-middle mr-1">schedule</span>}
                        {effectiveStatus}
                      </span>
                    </td>

                    <td className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
                      {log.time}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* QUICK ACTIONS */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                <span className="material-symbols-rounded text-primary">bolt</span>
              </div>
              <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                Quick Actions
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <Button
                variant="primary"
                onClick={() => navigate("/canvas-automation")}
                className="w-full justify-start pl-4"
              >
                <span className="material-symbols-rounded mr-2">add</span>
                Create New Automation
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start pl-4 bg-white dark:bg-transparent"
                onClick={() => navigate("/connected-accounts")}
              >
                <span className="material-symbols-rounded mr-2">link</span>
                Connected Accounts
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start pl-4 bg-white dark:bg-transparent"
                onClick={() => navigate("/automations")}
              >
                <span className="material-symbols-rounded mr-2">smart_toy</span>
                Manage Automations
              </Button>
            </div>
          </div>

          {/* ✅ NEW INTEGRATION */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-lg"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <span className="material-symbols-rounded text-lg">bolt</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">New Integration</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Notion Integration</h3>
              <p className="text-sm text-blue-100 mb-5 leading-relaxed">
                Connect your workspace to automate database entries and page creation seamlessley.
              </p>
              <button className="w-full bg-white text-blue-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm">
                Connect Notion
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}