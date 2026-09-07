'use client';

import { useEffect, useState } from 'react';
import { subscribeToTickets } from '@/lib/firestore-service';
import { Ticket, TicketStatus, TicketPriority } from '@/lib/types';
import { TicketCard } from '@/components/ticket-card';
import Link from 'next/link';
import { orderBy } from 'firebase/firestore';
import {
  cardClass,
  emptyStateClass,
  fieldClass,
  pageSubClass,
  pageTitleClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '@/components/app-shell';

const statusFilters: TicketStatus[] = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
const priorityFilters: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToTickets([orderBy('createdAt', 'desc')], data => {
      setTickets(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.complainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.complainerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClass}>All Tickets</h2>
        <p className={pageSubClass}>Manage and monitor all support tickets</p>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <input
          type="text"
          placeholder="Search by title, complainer name, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={fieldClass}
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? primaryBtnClass : secondaryBtnClass}
          >
            All Status
          </button>
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? primaryBtnClass : secondaryBtnClass}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPriorityFilter('all')}
            className={priorityFilter === 'all' ? primaryBtnClass : secondaryBtnClass}
          >
            All Priority
          </button>
          {priorityFilters.map(priority => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={priorityFilter === priority ? primaryBtnClass : secondaryBtnClass}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className={emptyStateClass}>
          <p className="text-foreground/60 mb-2 text-lg">No tickets found</p>
          <p className="text-foreground/60">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-foreground/60">
            Showing <span className="font-semibold text-foreground">{filteredTickets.length}</span> of{' '}
            <span className="font-semibold text-foreground">{tickets.length}</span> tickets
          </p>
          {filteredTickets.map(ticket => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <TicketCard ticket={ticket} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
