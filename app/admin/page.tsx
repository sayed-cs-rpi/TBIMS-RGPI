'use client';

import { useEffect, useState } from 'react';
import { subscribeToTickets } from '@/lib/firestore-service';
import { Ticket } from '@/lib/types';
import { Ticket as TicketIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { orderBy } from 'firebase/firestore';
import { cardClass, pageSubClass, pageTitleClass, statCardClass } from '@/components/app-shell';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTickets([orderBy('createdAt', 'desc')], allTickets => {
      setStats({
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        assigned: allTickets.filter(t => t.status === 'assigned').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        closed: allTickets.filter(t => t.status === 'closed').length,
      });
      setTickets(allTickets.slice(0, 10));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading analytics...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: TicketIcon },
    { label: 'Open', value: stats.open, icon: AlertCircle },
    { label: 'In Progress', value: stats.inProgress, icon: Clock },
    { label: 'Resolved', value: stats.resolved + stats.closed, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClass}>Dashboard</h2>
        <p className={pageSubClass}>System overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={statCardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">{card.label}</p>
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{card.value}</p>
                </div>
                <Icon className="w-7 h-7 text-primary/40" />
              </div>
            </div>
          );
        })}
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-foreground mb-6">Recent Tickets</h3>
        
        {tickets.length === 0 ? (
          <p className="text-foreground/60">No tickets found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/80">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/80">Complainer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/80">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/80">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/80">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-border hover:bg-secondary/40">
                    <td className="py-3 px-4 text-sm text-foreground">{ticket.title.substring(0, 40)}...</td>
                    <td className="py-3 px-4 text-sm text-foreground/60">{ticket.complainerName}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ticket.status === 'resolved' || ticket.status === 'closed'
                          ? 'bg-secondary text-foreground/80'
                          : ticket.status === 'open'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-secondary text-foreground/80'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ticket.priority === 'critical'
                          ? 'bg-destructive/10 text-destructive'
                          : ticket.priority === 'high'
                          ? 'bg-secondary text-foreground/70'
                          : 'bg-secondary text-foreground'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground/60">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
