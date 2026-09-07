'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subscribeToTickets } from '@/lib/firestore-service';
import { Ticket } from '@/lib/types';
import { TicketCard } from '@/components/ticket-card';
import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import { pageTitleClass, pageSubClass, primaryBtnClass, cardClass, statCardClass } from '@/components/app-shell';
import { orderBy, where } from 'firebase/firestore';

export default function ComplainerPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToTickets(
      [where('complainerId', '==', user.uid), orderBy('createdAt', 'desc')],
      data => {
        setTickets(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-foreground/20 border-t-foreground mx-auto" />
        <p className="mt-4 text-foreground/60 text-sm">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className={pageTitleClass}>My Tickets</h2>
          <p className={pageSubClass}>Track and manage your support requests</p>
        </div>
        <Link href="/complainer/create" className={`inline-flex items-center gap-2 ${primaryBtnClass}`}>
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className={`${cardClass} text-center`}>
          <AlertCircle className="w-10 h-10 text-foreground/30 mx-auto mb-4" />
          <p className="text-foreground/60 mb-6">You haven&apos;t created any tickets yet.</p>
          <Link href="/complainer/create" className={`inline-flex items-center gap-2 ${primaryBtnClass}`}>
            <Plus className="w-4 h-4" />
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 border-t border-border">
          {[
            { label: 'Total', value: tickets.length },
            { label: 'Open', value: tickets.filter(t => t.status === 'open').length },
            {
              label: 'Resolved',
              value: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            },
          ].map(stat => (
            <div key={stat.label} className={statCardClass}>
              <p className="text-sm text-foreground/60">{stat.label}</p>
              <p className="text-3xl font-semibold tracking-tight mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
