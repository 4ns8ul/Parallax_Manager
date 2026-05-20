import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const BurndownChart = ({ projectId }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/v1/reports/projects/${projectId}/burndown`)
      .then(res => res.json())
      .then(data => {
        setChartData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading burndown data:", err);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <span>Calculating velocity...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }} className="p-2">
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Task Points (Hours Remaining)', angle: -90, position: 'insideLeft', fill: '#94a3b8', offset: 0 }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="idealRemaining" 
            stroke="#8b5cf6" 
            strokeDasharray="5 5" 
            name="Ideal Velocity" 
            dot={false} 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="actualRemaining" 
            stroke="#06b6d4" 
            name="Actual Remaining effort" 
            strokeWidth={3} 
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
