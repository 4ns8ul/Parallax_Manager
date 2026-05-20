import React from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Inbox
} from 'lucide-react';

export default function Notifications() {
  const { notifications, markNotificationRead } = useStitch();

  const getIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return 'border-emerald-500/20 hover:border-emerald-500/30';
      case 'WARNING':
        return 'border-amber-500/20 hover:border-amber-500/30';
      case 'ERROR':
        return 'border-rose-500/20 hover:border-rose-500/30';
      case 'INFO':
      default:
        return 'border-cyan-500/20 hover:border-cyan-500/30';
    }
  };

  const getBgColor = (type, status) => {
    const isUnread = status === 'UNREAD';
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return isUnread ? 'bg-emerald-500/10' : 'bg-slate-900/40';
      case 'WARNING':
        return isUnread ? 'bg-amber-500/10' : 'bg-slate-900/40';
      case 'ERROR':
        return isUnread ? 'bg-rose-500/10' : 'bg-slate-900/40';
      case 'INFO':
      default:
        return isUnread ? 'bg-cyan-500/10' : 'bg-slate-900/40';
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-16 pr-2">
      {/* Header card info */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <Bell className="w-5 h-5 text-violet-400 mr-2" />
            Alert Inbox & Notifications
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Stay up to date with task progress, project status updates, and expense approval workflows.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
            Total Alerts: {notifications.length}
          </span>
          <span className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
            Unread: {notifications.filter(n => n.status === 'UNREAD').length}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isUnread = notif.status === 'UNREAD';
            return (
              <div 
                key={notif.id}
                className={`glass-panel p-5 border flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 transition-all duration-350 ${getBorderColor(notif.type)} ${getBgColor(notif.type, notif.status)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className={`font-bold text-sm ${isUnread ? 'text-slate-100' : 'text-slate-400'}`}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-violet-600 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${isUnread ? 'text-slate-200' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium mt-2 inline-block">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => markNotificationRead(notif.id)}
                    className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-violet-500/40 hover:bg-violet-600/10 hover:text-violet-400 text-slate-300 text-xs font-semibold transition-all duration-200"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-16 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">Your Alert Inbox is Empty</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              No system logs, comments, or transaction triggers have occurred in your active workspace environment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
