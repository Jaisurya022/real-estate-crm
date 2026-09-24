import { api } from '@/lib/api';

export const usersService = {
  list: (params, signal) => api.get('/users', params, { signal }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
};
