'use client';

import { Ticket, TicketPriority, TicketStatus } from '@/lib/types';
import { Badge } from './badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, AlertCircle, MapPin } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

const priorityConfig: Record<TicketPriority, { color: string; label: string }> = {
  low: { color: 'outline', label: 'Low' },
  medium: { color: 'default', label: 'Medium' },
  high: { color: 'warning', label: 'High' },
  critical: { color: 'danger', label: 'Critical' },
};

const statusConfig: Record<TicketStatus, { color: string; label: string }> = {
  open: { color: 'primary', label: 'Open' },
  assigned: { color: 'default', label: 'Assigned' },
  in_progress: { color: 'default', label: 'In Progress' },
  resolved: { color: 'success', label: 'Resolved' },
  closed: { color: 'outline', label: 'Closed' },
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const priorityInfo = priorityConfig[ticket.priority];
  const statusInfo = statusConfig[ticket.status];
  const createdDate = format(ticket.createdAt, 'MMM dd, yyyy HH:mm');

  return (
    <div
      onClick={onClick}
      className="glass-card p-5 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <Link
          href={`/tickets/${ticket.id}`}
          className="text-base font-semibold text-foreground hover:text-primary line-clamp-2 transition"
          onClick={e => e.stopPropagation()}
        >
          {ticket.title}
        </Link>
        <span className="text-xs text-foreground/40 whitespace-nowrap font-mono bg-foreground/5 px-2 py-1 rounded-full">
          #{ticket.id.substring(0, 8)}
        </span>
      </div>

      <p className="text-sm text-foreground/70 mb-4 line-clamp-2">{ticket.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={priorityInfo.color as any}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {priorityInfo.label}
        </Badge>
        <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
        {ticket.category && <Badge variant="outline">{ticket.category}</Badge>}
      </div>

      <div className="flex items-center justify-between text-xs text-foreground/60">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {createdDate}
        </div>
        {ticket.assignedToName && (
          <div className="font-medium">
            <span className="text-foreground/60">Assigned to:</span>{' '}
            <span className="text-foreground">{ticket.assignedToName}</span>
          </div>
        )}
      </div>
      {ticket.placeName && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/60 pt-3 border-t border-border/50">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>
            {ticket.placeName}
            {ticket.placeBuilding
              ? ` · ${ticket.placeBuilding}, Floor ${ticket.placeFloor}, #${ticket.placeNumber}`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}
