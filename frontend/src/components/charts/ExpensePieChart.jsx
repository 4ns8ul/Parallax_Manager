import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PALETTE = ['#8b5cf6', '#10b981', '#06b6d4', '#f43f5e', '#eab308'];

export const ExpensePieChart = ({ projectId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/v1/reports/projects/${projectId}/expenses`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading expense visualization:", err);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <span>Aggregating expenditures...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }} className="p-2 flex flex-col justify-between">
      <ResponsiveContainer>
        <PieChart>
          <Pie 
            data={data} 
            cx="50%" 
            cy="45%" 
            outerRadius={90} 
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            dataKey="value"
            stroke="#1e293b"
            strokeWidth={2}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
          />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ bottom: 0 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
