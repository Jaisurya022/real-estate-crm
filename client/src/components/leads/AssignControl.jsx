import { useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { leadsService } from '@/services/leads.service';

/** Admin-only owner picker. Deactivated owners still show by name until reassigned. */
export function AssignControl({ lead, onChanged }) {
  const { members } = useTeamMembers();
  const [saving, setSaving] = useState(false);
  const current = lead.assignedTo?._id ?? 'unassigned';
  const ownerMissing = lead.assignedTo && !members.some((m) => m._id === lead.assignedTo._id);

  const handleChange = async (value) => {
    setSaving(true);
    try {
      const { lead: updated } = await leadsService.assign(lead._id, value === 'unassigned' ? null : value);
      toast.success(updated.assignedTo ? `Assigned to ${updated.assignedTo.name}` : 'Moved to unassigned');
      onChanged(updated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select value={current} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger size="sm" aria-label="Assigned to">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {ownerMissing && <SelectItem value={lead.assignedTo._id}>{lead.assignedTo.name}</SelectItem>}
        {members.map((member) => (
          <SelectItem key={member._id} value={member._id}>
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
