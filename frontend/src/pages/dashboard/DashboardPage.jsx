import { useState, useEffect } from 'react';
import { reportsAPI, tasksAPI } from '../../api';
import useAuthStore from '../../stores/authStore';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isManager, isAdmin } = useAuthStore();

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, tasksRes] = await Promise.all([
          reportsAPI.dashboard(),
          tasksAPI.list({ pageSize: 100 }),
        ]);
        setKpis(kpiRes.data);
        
        const allTasks = tasksRes.data.tasks || [];
        setRecentTasks(allTasks.slice(0, 5));

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const computedChartData = last7Days.map(date => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = date.toISOString().split('T')[0];
          
          const completedCount = allTasks.filter(t => {
            const taskDate = new Date(t.updated_at || t.created_at).toISOString().split('T')[0];
            return taskDate === dateStr && t.status === 'DONE';
          }).length;

          return { name: dayName, completed: completedCount };
        });

        setChartData(computedChartData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--color-outline-variant)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '9999px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: kpis?.total_projects || 0, icon: 'folder', accent: 'oklch(0.55 0.20 260)', accentBg: 'oklch(0.92 0.03 260)', trend: '+12%', trendIcon: 'trending_up', trendColor: 'oklch(0.45 0.14 155)' },
    { label: 'Tasks Pending', value: kpis?.pending_tasks || 0, icon: 'task_alt', accent: 'oklch(0.48 0.08 260)', accentBg: 'oklch(0.92 0.03 260)', trend: '84%', trendIcon: 'trending_up', trendColor: 'oklch(0.45 0.14 155)', trendLabel: 'completion rate' },
    { label: 'Active Users', value: kpis?.total_users || 0, icon: 'group', accent: 'oklch(0.48 0.16 45)', accentBg: 'oklch(0.94 0.04 45)', trend: '-3%', trendIcon: 'trending_down', trendColor: 'oklch(0.45 0.20 25)' },
    { label: 'Pending Expenses', value: kpis?.pending_expenses || 0, icon: 'receipt_long', accent: 'oklch(0.45 0.20 25)', accentBg: 'oklch(0.94 0.04 25)', trend: '+4.3%', trendIcon: 'trending_up', trendColor: 'oklch(0.45 0.14 155)' },
  ];

  const handleDownloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      systemKPIs: kpis,
      recentTasks: recentTasks.map(t => ({
        task: t.title,
        project: t.project_name,
        status: t.status,
        assignee: t.assignee_name || 'Unassigned'
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Parallax_System_Report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--color-on-surface)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            System Overview
          </h2>
          <p
            style={{
              color: 'var(--color-on-surface-variant)',
              marginTop: '4px',
              fontSize: '13px',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Real-time enterprise metrics and performance tracking.
          </p>
        </div>
        {(isManager() || isAdmin()) && (
          <button
            onClick={handleDownloadReport}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              padding: '9px 20px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '-0.01em',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 1px 2px oklch(0.15 0.01 260 / 0.08)',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-brand-700)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export Data
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'box-shadow 0.15s ease',
              cursor: 'default',
              minHeight: '120px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px oklch(0.15 0.01 260 / 0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: stat.accentBg,
                  color: stat.accent,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{stat.icon}</span>
              </div>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: stat.trendColor === 'oklch(0.45 0.20 25)' ? 'oklch(0.94 0.04 25)' : 'oklch(0.92 0.04 155)',
                  color: stat.trendColor,
                  fontFamily: "'Public Sans', sans-serif",
                  gap: '2px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{stat.trendIcon}</span>
                {stat.trend}
              </span>
            </div>
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: '4px',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {stat.label}
              </p>
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--color-on-surface)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', flex: 1 }}>
        
        {/* Chart Section */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Task Completion Velocity
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', fontFamily: "'Public Sans', sans-serif" }}>
                Weekly throughput and milestone tracking
              </p>
            </div>
            <button
              onClick={handleDownloadReport}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Export <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            </button>
          </div>
          
          <div style={{ flex: 1, minHeight: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.37 0.18 260)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="oklch(0.37 0.18 260)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.90 0.01 260)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.38 0.03 260)', fontSize: 11, fontFamily: "'Public Sans', sans-serif" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.38 0.03 260)', fontSize: 11, fontFamily: "'Public Sans', sans-serif" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'oklch(1.00 0.00 0)',
                    borderRadius: '8px',
                    border: '1px solid oklch(0.90 0.01 260)',
                    boxShadow: '0 4px 12px oklch(0.15 0.01 260 / 0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'oklch(0.18 0.02 260)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  itemStyle={{ color: 'oklch(0.37 0.18 260)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="oklch(0.37 0.18 260)" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks Feed */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-on-surface)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              Recent Activity
            </h3>
            <button
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_horiz</span>
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {recentTasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '13px', marginTop: '32px' }}>
                No recent activity.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentTasks.map((task, i) => (
                  <div key={task.id} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          zIndex: 1,
                          backgroundColor:
                            task.status === 'DONE' ? 'oklch(0.92 0.04 155)' :
                            task.status === 'IN_PROGRESS' ? 'oklch(0.92 0.03 260)' :
                            'var(--color-surface-container-high)',
                          color:
                            task.status === 'DONE' ? 'oklch(0.35 0.12 155)' :
                            task.status === 'IN_PROGRESS' ? 'oklch(0.30 0.16 260)' :
                            'var(--color-on-surface-variant)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          {task.status === 'DONE' ? 'check_circle' : 
                           task.status === 'IN_PROGRESS' ? 'autorenew' : 'assignment'}
                        </span>
                      </div>
                      {i !== recentTasks.length - 1 && (
                        <div
                          style={{
                            width: '1px',
                            height: '100%',
                            backgroundColor: 'var(--color-outline-variant)',
                            position: 'absolute',
                            top: '28px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '4px',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: '4px', flex: 1 }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-on-surface)', fontWeight: 600 }}>{task.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>{task.project_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-outline)', marginTop: '4px', fontFamily: "'Public Sans', sans-serif" }}>
                        {task.assignee_name || 'Unassigned'} · {format(new Date(task.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--color-surface-container)';
              e.target.style.borderColor = 'var(--color-outline-variant)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'transparent';
            }}
          >
            View All Tasks
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
