import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function StatusDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-text-secondary-light dark:text-text-secondary-dark font-medium">
        No execution data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-2 px-3 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
          <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
            {data.name}: <span className="font-normal">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-64 w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
