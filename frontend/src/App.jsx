import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsListPage from './pages/projects/ProjectsListPage';
import TasksListPage from './pages/tasks/TasksListPage';
import ExpensesListPage from './pages/expenses/ExpensesListPage';
import UsersPage from './pages/users/UsersPage';
import NotFoundPage from './pages/NotFoundPage';
import ForcePasswordResetPage from './pages/auth/ForcePasswordResetPage';

function ProtectedRoute({ children, roles, enforceReset = true }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password reset interception
  if (enforceReset && user?.must_change_password) {
    return <Navigate to="/force-reset-password" replace />;
  }

  if (roles && !roles.some((r) => user?.roles?.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/force-reset-password" 
          element={
            <ProtectedRoute enforceReset={false}>
              <ForcePasswordResetPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="tasks" element={<TasksListPage />} />
          <Route path="expenses" element={<ExpensesListPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
