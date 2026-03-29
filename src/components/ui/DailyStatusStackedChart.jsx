import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DailyStatusStackedChart({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-3 rounded-lg shadow-lg">
          <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-2 pb-2 border-b border-border-light dark:border-border-dark">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              if (entry.value === 0) return null; // Don't show zeroes in tooltip
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{entry.name}</span>
                  </div>
                  <span className="text-text-primary-light dark:text-text-primary-dark font-bold">{entry.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <ul className="flex flex-wrap justify-end gap-x-4 mt-2 pr-6">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium cursor-pointer">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="dateStr" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.1 }} />
          <Legend content={<CustomLegend />} verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
          <Bar dataKey="Successful" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Failed" stackId="a" fill="#ef4444" />
          <Bar dataKey="Timeout" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Running" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
