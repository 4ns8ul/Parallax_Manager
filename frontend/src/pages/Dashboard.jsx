import React, { useEffect } from 'react';
import { useStitch } from '../context/StitchContext';
import { GanttChart } from '../components/charts/GanttChart';
import { BurndownChart } from '../components/charts/BurndownChart';
import { ExpensePieChart } from '../components/charts/ExpensePieChart';
import { ResourceBarChart } from '../components/charts/ResourceBarChart';
import { 
  FolderGit2, 
  CheckSquare, 
  Receipt, 
  TrendingUp, 
  FileWarning 
} from 'lucide-react';

export default function Dashboard() {
  const { summary, selectedProject, fetchSummary } = useStitch();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const kpiCards = [
    { 
      label: 'Total Projects', 
      value: summary?.total_projects ?? 0, 
      icon: FolderGit2, 
      color: 'from-violet-500 to-indigo-500' 
    },
    { 
      label: 'Open Action Tasks', 
      value: summary?.active_tasks ?? 0, 
      icon: CheckSquare, 
      color: 'from-emerald-500 to-teal-500' 
    },
    { 
      label: 'Pending Claims Count', 
      value: summary?.pending_expenses_count ?? 0, 
      icon: Receipt, 
      color: 'from-cyan-500 to-blue-500' 
    },
    { 
      label: 'Pending Expenses Value', 
      value: `$${Number(summary?.pending_expenses_amount ?? 0).toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'from-rose-500 to-pink-500' 
    },
  ];

  return (
    <div className="space-y-8 overflow-y-auto h-full pb-16 pr-2">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel p-6 flex items-center justify-between group overflow-hidden">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-100">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg shadow-slate-950/20 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Visualizations Grid */}
      {selectedProject ? (
        <div className="space-y-8">
          <div className="p-6 glass-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">
                Workspace Analytics: <span className="text-violet-400 font-semibold">{selectedProject.name}</span>
              </h3>
              <span className="px-3 py-1 text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
                Active Project
              </span>
            </div>
            <p className="text-sm text-slate-400">{selectedProject.description || 'No project description loaded.'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Task Progress Gantt Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-bold text-slate-200">Task Progress Gantt Chart</h4>
                <p className="text-xs text-slate-500">Visualizes task estimates and timelines relative to project start.</p>
              </div>
              <GanttChart projectId={selectedProject.id} />
            </div>

            {/* Chart 2: Sprint Burndown Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-bold text-slate-200">Sprint Burndown Chart</h4>
                <p className="text-xs text-slate-500">Compares ideal daily velocity against actual tasks remaining.</p>
              </div>
              <BurndownChart projectId={selectedProject.id} />
            </div>

            {/* Chart 3: Expense Distribution Pie Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-bold text-slate-200">Expense Distribution Pie Chart</h4>
                <p className="text-xs text-slate-500">Aggregates approved expenditures split by corporate cost categories.</p>
              </div>
              <ExpensePieChart projectId={selectedProject.id} />
            </div>

            {/* Chart 4: Resource Allocation Bar Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-bold text-slate-200">Resource Allocation Bar Chart</h4>
                <p className="text-xs text-slate-500">Compares total estimated allocated effort against actual logged hours.</p>
              </div>
              <ResourceBarChart projectId={selectedProject.id} />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-yellow-500">
            <FileWarning className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Active Project Workspace Available</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            There are no project workspaces assigned to your profile. Please visit the **Projects** panel to initialize a new project, or contact your administrator to assign you to an active project workspace.
          </p>
        </div>
      )}
    </div>
  );
}
