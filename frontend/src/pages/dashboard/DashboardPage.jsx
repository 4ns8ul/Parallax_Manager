import { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Users, TrendingUp, Download } from 'lucide-react';
import { reportsAPI, tasksAPI } from '../../api';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
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
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: kpis?.total_projects || 0, icon: 'folder', iconColor: 'text-emerald-700 bg-emerald-50', iconBg: 'text-primary bg-surface-container', trend: '+12%', trendIcon: 'trending_up' },
    { label: 'Tasks Pending', value: kpis?.pending_tasks || 0, icon: 'task_alt', iconColor: 'text-emerald-700 bg-emerald-50', iconBg: 'text-secondary bg-surface-container', trend: '+8.4%', trendIcon: 'trending_up' },
    { label: 'Active Users', value: kpis?.total_users || 0, icon: 'group', iconColor: 'text-rose-700 bg-rose-50', iconBg: 'text-tertiary bg-surface-container', trend: '-2.1%', trendIcon: 'trending_down' },
    { label: 'Expenses', value: kpis?.pending_expenses || 0, icon: 'receipt_long', iconColor: 'text-emerald-700 bg-emerald-50', iconBg: 'text-error bg-error-container', trend: '+4.3%', trendIcon: 'trending_up' },
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
    <div className="flex flex-col flex-1 h-full">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">Dashboard Overview</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Monitor key metrics and recent activity across your organization.</p>
        </div>
        {(isManager() || isAdmin()) && (
          <button onClick={handleDownloadReport} className="bg-primary text-on-primary py-2 px-4 rounded-full font-bold text-sm tracking-wide hover:bg-primary-container transition-colors duration-200 shadow-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        )}
      </div>

      {/* KPI Row (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between hover:shadow-sm transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-[14px] mr-1">{stat.trendIcon}</span>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">{stat.label}</p>
              <h3 className="text-3xl font-headline font-bold text-on-surface">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col hover:shadow-sm transition-shadow duration-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface font-headline">Task Completion</h3>
              <p className="text-sm text-on-surface-variant">Last 7 days performance</p>
            </div>
            <button onClick={handleDownloadReport} className="text-sm font-medium text-primary hover:text-primary-container transition-colors flex items-center gap-1">
              Export <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
          
          <div className="flex-1 min-h-[300px] w-full bg-surface-container-lowest flex items-center justify-center relative overflow-hidden group">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004ac6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e2ed" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#434655', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#434655', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e1e2ed',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#191b23'
                  }}
                  itemStyle={{ color: '#004ac6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#004ac6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col hover:shadow-sm transition-shadow duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-on-surface font-headline">Recent Tasks</h3>
            <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-sm">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {recentTasks.length === 0 ? (
              <p className="text-center text-on-surface-variant text-sm mt-8">No recent activity.</p>
            ) : (
              recentTasks.map((task, i) => (
                <div key={task.id} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      task.status === 'DONE' ? 'bg-secondary-container text-on-secondary-container' : 
                      task.status === 'IN_PROGRESS' ? 'bg-primary-container text-on-primary-container' :
                      'bg-surface-variant text-on-surface-variant border border-outline-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {task.status === 'DONE' ? 'check_circle' : 
                         task.status === 'IN_PROGRESS' ? 'autorenew' : 'assignment'}
                      </span>
                    </div>
                    {i !== recentTasks.length - 1 && (
                      <div className="w-px h-full bg-outline-variant absolute top-8 left-1/2 -translate-x-1/2 mt-1"></div>
                    )}
                  </div>
                  <div className="pb-2 flex-1">
                    <p className="text-sm text-on-surface font-medium">{task.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{task.project_name}</p>
                    <p className="text-xs text-outline mt-1">{task.assignee_name || 'Unassigned'} • {format(new Date(task.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-surface-container rounded-lg transition-colors border border-transparent hover:border-outline-variant">
            View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
