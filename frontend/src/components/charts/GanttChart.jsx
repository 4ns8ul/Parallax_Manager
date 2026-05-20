import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export const GanttChart = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/v1/reports/projects/${projectId}/gantt`)
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Gantt metrics:", err);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <span>Calculating timelines...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }} className="p-2">
      <ResponsiveContainer>
        <BarChart data={tasks} layout="vertical" stackOffset="none" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number" 
            stroke="#94a3b8"
            label={{ value: 'Timeline Days since Project Start', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} 
          />
          <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
            cursor={{ fill: '#334155', opacity: 0.2 }}
          />
          <Bar dataKey="startOffset" stackId="a" fill="transparent" />
          <Bar dataKey="duration" stackId="a" fill="#10b981" name="Task Est. Duration (Days)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
