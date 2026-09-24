import { api } from '@/lib/api';

export const bookingsService = {
  list: (params, signal) => api.get('/bookings', params, { signal }),
  create: (data) => api.post('/bookings', data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
};
