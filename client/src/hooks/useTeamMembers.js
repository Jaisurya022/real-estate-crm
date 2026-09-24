import { usersService } from '@/services/users.service';
import { useFetch } from './useFetch';

/** Active sales employees, for "assign to" pickers. Admin-only endpoint. */
export function useTeamMembers({ enabled = true } = {}) {
  const { data, loading } = useFetch(
    (signal) => usersService.list({ role: 'sales', active: 'true' }, signal),
    [],
    { enabled },
  );
  return { members: data?.items ?? [], loading };
}
