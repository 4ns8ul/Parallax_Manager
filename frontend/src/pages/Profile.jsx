import React, { useState } from 'react';
import { useStitch } from '../context/StitchContext';
import { 
  User, 
  KeyRound, 
  CheckCircle, 
  XCircle,
  Shield,
  Mail,
  Edit2
} from 'lucide-react';

export default function Profile() {
  const { user, role, checkSession } = useStitch();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (password && password !== confirmPassword) {
      setErrorMsg("New passwords do not match. Please verify.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update profile settings.");
      }

      setSuccessMsg("Profile updated successfully!");
      setPassword('');
      setConfirmPassword('');
      
      // Reload context state
      if (checkSession) {
        await checkSession();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-16 pr-2 max-w-4xl">
      {/* Page Header banner */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center">
          <User className="w-5 h-5 text-violet-400 mr-2" />
          My Profile & Settings
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Review your account clearance boundaries, status flags, and update credentials.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Summary Card */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-emerald-500 border border-slate-700 flex items-center justify-center font-bold text-slate-100 text-3xl mx-auto shadow-xl shadow-violet-500/10">
              {user?.firstName?.slice(0, 1) || 'U'}
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-200 text-base">{user?.firstName} {user?.lastName}</h4>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Clearance Level</span>
              <span className="px-2 py-0.5 font-bold uppercase rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 tracking-wider">
                {role}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Session Safe state</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Account Settings Form */}
        <div className="glass-panel p-6 md:col-span-2">
          <h4 className="font-bold text-slate-200 text-sm mb-6 flex items-center">
            <Edit2 className="w-4 h-4 text-emerald-400 mr-2" />
            General Account Credentials
          </h4>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Apex"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-xs"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="User"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-xs"
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Email Address (Non-mutable)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 outline-none text-xs cursor-not-allowed"
              />
            </div>

            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h5 className="font-bold text-slate-200 text-xs flex items-center">
                <KeyRound className="w-3.5 h-3.5 text-violet-400 mr-2" />
                Change Password (Leave blank to keep existing)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-xs"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white font-semibold text-xs hover:from-violet-500 hover:to-emerald-400 transition-all duration-300 shadow-md shadow-violet-600/5 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Committing Changes...' : 'Save Profile Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
