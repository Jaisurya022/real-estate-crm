import { Mail, Phone } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { formatDate, formatINR, formatPhone } from '@/lib/format';
import { AssignControl } from './AssignControl';
import { FollowUpControl } from './FollowUpControl';

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export function LeadInfoPanel({ lead, canAssign, onChanged }) {
  return (
    <div className="grid gap-4">
      <Panel title="Next follow-up">
        <FollowUpControl lead={lead} onChanged={onChanged} />
      </Panel>

      <Panel title="Details" flush bodyClassName="px-4 py-2 sm:px-5">
        <dl className="divide-y">
          <Row label="Phone">
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 tabular-nums hover:text-primary">
              <Phone className="size-3.5" />
              {formatPhone(lead.phone)}
            </a>
          </Row>
          <Row label="Email">
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="inline-flex max-w-full items-center gap-1.5 hover:text-primary">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </a>
            ) : (
              <span className="text-muted-foreground">Not added</span>
            )}
          </Row>
          <Row label="Budget">
            <span className="tabular-nums">{formatINR(lead.budget)}</span>
          </Row>
          <Row label="Looking for">{lead.preferredUnitType ?? <span className="text-muted-foreground">Not sure yet</span>}</Row>
          <Row label="Source">{lead.source}</Row>
          <Row label="Assigned to">
            {canAssign ? (
              <AssignControl lead={lead} onChanged={onChanged} />
            ) : (
              lead.assignedTo?.name ?? <span className="text-warning">Unassigned</span>
            )}
          </Row>
          <Row label="Added">
            {formatDate(lead.createdAt)}
            {lead.createdBy && <span className="text-muted-foreground"> by {lead.createdBy.name}</span>}
          </Row>
        </dl>
      </Panel>
    </div>
  );
}
