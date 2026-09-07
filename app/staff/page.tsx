'use client';

import { TicketCard } from '@/components/ticket-card';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { subscribeToTickets, assignTicket } from '@/lib/firestore-service';
import { Ticket } from '@/lib/types';
import { orderBy, where } from 'firebase/firestore';
import {
  cardClass,
  emptyStateClass,
  pageSubClass,
  pageTitleClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '@/components/app-shell';

export default function TechnicianQueuePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTickets(
      [where('status', '==', 'open'), orderBy('createdAt', 'desc')],
      openTickets => {
        setTickets(openTickets.filter(t => !t.assignedToId));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleAssignTicket(ticket: Ticket) {
    if (!user) return;
    if (ticket.assignedToId) {
      toast.error('Ticket already assigned');
      return;
    }

    setAssigning(ticket.id);
    try {
      await assignTicket(ticket.id, user.uid, user.name);
      toast.success(`Ticket #${ticket.id.substring(0, 8)} assigned to you!`);
    } catch (error) {
      console.error('[v0] Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    } finally {
      setAssigning(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading ticket queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClass}>Ticket Queue</h2>
        <p className={pageSubClass}>Available tickets waiting for assignment</p>
      </div>

      {tickets.length === 0 ? (
        <div className={emptyStateClass}>
          <CheckCircle className="w-12 h-12 text-foreground/50 mx-auto mb-4" />
          <p className="text-foreground/60 mb-2 text-lg">No tickets in queue</p>
          <p className="text-foreground/60">All tickets are currently assigned.</p>
          <Link href="/staff/assigned" className={`inline-block mt-4 ${secondaryBtnClass}`}>
            View Your Assigned Tickets
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-foreground/60">
            Showing <span className="font-semibold text-foreground">{tickets.length}</span> unassigned tickets
          </p>

          {tickets.map(ticket => (
            <div key={ticket.id} className="space-y-3">
              <TicketCard ticket={ticket} />
              <button
                onClick={() => handleAssignTicket(ticket)}
                disabled={assigning === ticket.id}
                className={primaryBtnClass}
              >
                {assigning === ticket.id ? 'Assigning...' : 'Claim Ticket'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`${cardClass} flex gap-3 !py-4`}>
        <AlertCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Tip</p>
          <p className="text-sm text-foreground">
            Click &quot;Claim&quot; to assign a ticket to yourself. It will appear in your assigned tickets list.
          </p>
        </div>
      </div>
    </div>
  );
}
