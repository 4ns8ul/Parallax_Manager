import React, { useEffect, useState } from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  History, 
  Search, 
  Terminal, 
  User, 
  ShieldAlert, 
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AuditLogs() {
  const { role } = useStitch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    if (role !== 'ADMIN') {
      setError("Unauthorized access. This page is reserved for administrators only.");
      setLoading(false);
      return;
    }

    const loadAuditLogs = async () => {
      try {
        const res = await fetch('/api/v1/audit');
        if (!res.ok) {
          throw new Error("Failed to load security audit trails from server.");
        }
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [role]);

  if (role !== 'ADMIN') {
    return (
      <div className="glass-panel p-12 text-center max-w-2xl mx-auto space-y-4 my-12">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Access Restricted</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          The Security Audit Trail holds highly sensitive system transaction diffs. Only administrators are authenticated to read this data.
        </p>
      </div>
    );
  }

  const getActionBadge = (action) => {
    const act = action?.toUpperCase();
    if (act?.includes('INSERT') || act?.includes('CREATE')) {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg uppercase tracking-wider">Create</span>;
    }
    if (act?.includes('UPDATE') || act?.includes('MODIFY')) {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg uppercase tracking-wider">Update</span>;
    }
    if (act?.includes('DELETE') || act?.includes('REMOVE')) {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg uppercase tracking-wider">Delete</span>;
    }
    return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-lg uppercase tracking-wider">{action}</span>;
  };

  const parseChanges = (changesString) => {
    if (!changesString) return null;
    try {
      return JSON.parse(changesString);
    } catch {
      return changesString;
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    const userEmail = log.user?.email?.toLowerCase() || '';
    const userName = `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.toLowerCase();
    const resource = log.resource?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    return userEmail.includes(term) || userName.includes(term) || resource.includes(term) || action.includes(term);
  });

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-16 pr-2">
      {/* Page Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <History className="w-5 h-5 text-emerald-400 mr-2" />
            Security Audit Trail
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Track database mutations, project status alterations, financial expense claims, and account creations.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by administrator, action, table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all text-xs"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Decrypting system-wide event streams...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 border-rose-500/20 bg-rose-500/5 text-center text-sm text-rose-400">
          {error}
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            const changes = parseChanges(log.changes);
            const userDisplay = log.user 
              ? `${log.user.first_name} ${log.user.last_name} (${log.user.email})`
              : `System (UID: ${log.user_id})`;

            return (
              <div key={log.id} className="glass-panel overflow-hidden transition-all duration-300">
                {/* Row Summary */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/25 transition-colors"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 flex items-center justify-center border border-slate-800 flex-shrink-0 text-slate-400">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-semibold text-slate-400">on</span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-slate-800 border border-slate-700 rounded text-slate-300 tracking-wider">
                          {log.resource}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          (ID: {log.resource_id})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {userDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4 self-stretch md:self-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <span className="text-[10px] text-slate-600 block mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details containing changes payload */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/30 space-y-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        Mutation Snapshot Data (JSON Diff)
                      </h5>
                      {changes ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-emerald-300 max-h-60 custom-scrollbar leading-relaxed">
                          <pre>{JSON.stringify(changes, null, 2)}</pre>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No modifications or state changes recorded with this operation.</p>
                      )}
                    </div>
                    {log.ip_address && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        Request Originating IP: <code className="text-slate-400 font-mono">{log.ip_address}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
          <div className="glass-panel p-16 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-400">No Event Records Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              No audit logs matched your query, or no operations have mutated the schema state yet.
            </p>
          </div>
        )}
    </div>
  );
}
