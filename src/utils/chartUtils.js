// chartUtils.js
// Utility functions for formatting raw Firestore execution logs into Recharts-friendly data arrays

export function formatExecutionTrend(logs, days = 7) {
  const data = [];
  const now = new Date();
  
  // Initialize the last 'days' with 0 executions
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    data.push({
      dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateObj: new Date(d.setHours(0,0,0,0)), // normalizing to midnight for comparison
      executions: 0
    });
  }

  // Count executions
  logs.forEach(log => {
    if (!log.date && !log.timestamp) return;
    const logDate = log.date || (log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp));
    
    // Find matching day bucket
    const item = data.find(d => 
      d.dateObj.getFullYear() === logDate.getFullYear() &&
      d.dateObj.getMonth() === logDate.getMonth() &&
      d.dateObj.getDate() === logDate.getDate()
    );

    if (item) {
      item.executions += 1;
    }
  });

  return data;
}

export function formatStatusDistribution(logs) {
  let success = 0;
  let failed = 0;
  let timeout = 0;
  let running = 0;

  const now = new Date();
  const TIMEOUT_MS = 15 * 60 * 1000;

  logs.forEach(log => {
    const logDate = log.date || (log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp));
    const status = log.status || "Unknown";
    const statusLower = status.toLowerCase();

    if (["success", "successful", "completed"].includes(statusLower)) {
      success += 1;
    } else if (statusLower === "running") {
      if (now - logDate > TIMEOUT_MS) timeout += 1;
      else running += 1;
    } else if (statusLower === "timed out" || statusLower === "timeout") {
      timeout += 1;
    } else {
      // Treat anything else as failed
      failed += 1;
    }
  });

  return [
    { name: 'Successful', value: success, color: '#10b981' }, // emarald-500
    { name: 'Failed', value: failed, color: '#ef4444' }, // red-500
    { name: 'Timeout', value: timeout, color: '#f59e0b' }, // orange-500
    { name: 'Running', value: running, color: '#3b82f6' } // blue-500
  ].filter(item => item.value > 0); // Only return statuses that have counts
}

export function formatDailyStackedData(logs, days = 7) {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    data.push({
      dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateObj: new Date(d.setHours(0,0,0,0)),
      Successful: 0,
      Failed: 0,
      Timeout: 0,
      Running: 0
    });
  }

  const TIMEOUT_MS = 15 * 60 * 1000;

  logs.forEach(log => {
    if (!log.date && !log.timestamp) return;
    const logDate = log.date || (log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp));
    
    const item = data.find(d => 
      d.dateObj.getFullYear() === logDate.getFullYear() &&
      d.dateObj.getMonth() === logDate.getMonth() &&
      d.dateObj.getDate() === logDate.getDate()
    );

    if (item) {
      const statusLower = (log.status || "").toLowerCase();
      if (["success", "successful", "completed"].includes(statusLower)) {
        item.Successful += 1;
      } else if (statusLower === "running") {
        if (now - logDate > TIMEOUT_MS) item.Timeout += 1;
        else item.Running += 1;
      } else if (statusLower === "timed out" || statusLower === "timeout") {
        item.Timeout += 1;
      } else {
        item.Failed += 1;
      }
    }
  });

  return data;
}
