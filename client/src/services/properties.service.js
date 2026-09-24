import { api } from '@/lib/api';

export const propertiesService = {
  listProjects: (signal) => api.get('/projects', undefined, { signal }),
  getProject: (id, signal) => api.get(`/projects/${id}`, undefined, { signal }),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.patch(`/projects/${id}`, data),

  createBuilding: (projectId, data) => api.post(`/projects/${projectId}/buildings`, data),
  updateBuilding: (id, data) => api.patch(`/buildings/${id}`, data),
  generateUnits: (buildingId, data) => api.post(`/buildings/${buildingId}/units/generate`, data),

  listUnits: (params, signal) => api.get('/units', params, { signal }),
  getUnit: (id, signal) => api.get(`/units/${id}`, undefined, { signal }),
  createUnit: (data) => api.post('/units', data),
  updateUnit: (id, data) => api.patch(`/units/${id}`, data),
};
