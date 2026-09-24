import { api } from '@/lib/api';

export const dashboardService = {
  get: (signal) => api.get('/dashboard', undefined, { signal }),
};
