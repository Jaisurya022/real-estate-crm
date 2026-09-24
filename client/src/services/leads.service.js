import { api } from '@/lib/api';

export const leadsService = {
  list: (params, signal) => api.get('/leads', params, { signal }),
  get: (id, signal) => api.get(`/leads/${id}`, undefined, { signal }),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  changeStage: (id, data) => api.patch(`/leads/${id}/stage`, data),
  assign: (id, assignedTo) => api.patch(`/leads/${id}/assign`, { assignedTo }),
  addNote: (id, data) => api.post(`/leads/${id}/notes`, data),
};
