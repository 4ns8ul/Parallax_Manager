import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StitchContext = createContext(null);

export const useStitch = () => {
  const context = useContext(StitchContext);
  if (!context) {
    throw new Error("useStitch must be used within a StitchProvider");
  }
  return context;
};

export const StitchProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Dynamic token profile check on start
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser({ id: data.id, email: data.email, firstName: data.first_name, lastName: data.last_name });
        setRole(data.roles[0] || 'EMPLOYEE');
        setPermissions(data.permissions || []);
        setLastActivity(Date.now());
      }
    } catch (err) {
      console.error("Session check failed:", err);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/v1/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          // Auto-select first project
          setSelectedProject(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, [user, selectedProject]);

  // Load unread alerts
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [user]);

  // Load KPI summary metrics
  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/v1/reports/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to load summary stats:", err);
    }
  }, [user]);

  // Trigger loading when user is active
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchNotifications();
      fetchSummary();
      // Setup interval to poll notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setNotifications([]);
      setSummary(null);
    }
  }, [user, fetchProjects, fetchNotifications, fetchSummary]);

  // Inactivity timeout checks (15 minutes limit)
  useEffect(() => {
    if (!user) return;
    
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime > 15 * 60 * 1000) {  // 15 minutes
        logout("Session expired due to inactivity.");
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(checkInterval);
    };
  }, [user, lastActivity]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Incorrect credentials");
      }

      const data = await res.json();
      setUser({ id: data.user_id, email: data.email });
      setRole(data.role);
      
      // Load permissions
      await checkSession();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (msg = "Logged out successfully") => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    setUser(null);
    setRole(null);
    setPermissions([]);
    alert(msg);
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  return (
    <StitchContext.Provider value={{
      user,
      role,
      permissions,
      projects,
      selectedProject,
      setSelectedProject,
      notifications,
      summary,
      loading,
      error,
      login,
      logout,
      checkSession,
      fetchProjects,
      fetchNotifications,
      fetchSummary,
      markNotificationRead
    }}>
      {children}
    </StitchContext.Provider>
  );
};
