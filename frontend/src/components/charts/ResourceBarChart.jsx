import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ResourceBarChart = ({ projectId }) => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/v1/reports/projects/${projectId}/resources`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading resource allocation metrics:", err);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <span>Profiling resource effort...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }} className="p-2">
      <ResponsiveContainer>
        <BarChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="employee" stroke="#94a3b8" />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Effort Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="allocated" fill="#8b5cf6" name="Estimated Effort" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#10b981" name="Actual Logged Effort" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
