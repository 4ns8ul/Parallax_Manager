import apiClient from './client';

export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh'),
  getMe: () => apiClient.get('/users/me'),
  changePassword: (temp_password, new_password) => apiClient.post('/auth/change-password', { temp_password, new_password }),
};

export const usersAPI = {
  list: (page = 1, pageSize = 20) => apiClient.get(`/users?page=${page}&page_size=${pageSize}`),
  get: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  updateRoles: (id, roleIds) => apiClient.put(`/users/${id}/roles`, { role_ids: roleIds }),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

export const projectsAPI = {
  list: (page = 1, pageSize = 20) => apiClient.get(`/projects?page=${page}&page_size=${pageSize}`),
  get: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects', data),
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  addMembers: (id, userIds) => apiClient.post(`/projects/${id}/members`, { user_ids: userIds }),
};

export const tasksAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.pageSize) query.set('page_size', params.pageSize);
    if (params.status) query.set('status', params.status);
    if (params.projectId) query.set('project_id', params.projectId);
    return apiClient.get(`/tasks?${query.toString()}`);
  },
  get: (id) => apiClient.get(`/tasks/${id}`),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/tasks/${id}/status`, data),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
};

export const expensesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.pageSize) query.set('page_size', params.pageSize);
    if (params.status) query.set('status', params.status);
    return apiClient.get(`/expenses?${query.toString()}`);
  },
  get: (id) => apiClient.get(`/expenses/${id}`),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  approve: (id, data) => apiClient.patch(`/expenses/${id}/approve`, data),
  uploadBill: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/expenses/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => apiClient.delete(`/expenses/${id}`),
};

export const notificationsAPI = {
  list: () => apiClient.get('/notifications'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
  clearAll: () => apiClient.delete('/notifications/clear'),
};

export const reportsAPI = {
  dashboard: () => apiClient.get('/reports/dashboard'),
  tasksSummary: () => apiClient.get('/reports/tasks-summary'),
  expenseCategories: () => apiClient.get('/reports/expense-categories'),
  resourceUtilization: (projectId) => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return apiClient.get(`/reports/resource-utilization${query}`);
  },
  burnRate: (projectId) => apiClient.get(`/reports/burn-rate/${projectId}`),
};
