'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subscribeToTicket, subscribeToTicketMessages, addTicketMessage } from '@/lib/firestore-service';
import { Ticket, TicketMessage } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { cardClass, fieldClass, pageTitleClass, primaryBtnClass } from '@/components/app-shell';

export default function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user?.uid || !params?.ticketId) return;

    const unsubTicket = subscribeToTicket(params.ticketId, ticketData => {
      if (ticketData && ticketData.complainerId === user.uid) {
        setTicket(ticketData);
        setLoading(false);
      } else if (ticketData === null) {
        setTicket(null);
        setLoading(false);
      }
    });

    const unsubMessages = subscribeToTicketMessages(params.ticketId, setMessages);

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [params?.ticketId, user?.uid]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !ticket || !messageText.trim()) return;

    setSending(true);
    try {
      await addTicketMessage({
        ticketId: ticket.id,
        userId: user.uid,
        userName: user.name,
        userRole: 'complainer',
        message: messageText,
        attachments: [],
        isInternal: false,
      });

      setMessageText('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('[v0] Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`${cardClass} text-center`}>
        <p className="text-foreground/60 mb-4">Ticket not found</p>
        <Link href="/complainer" className={primaryBtnClass}>
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/complainer" className="flex items-center gap-2 text-foreground hover:opacity-70">
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      <div className={cardClass}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className={`${pageTitleClass} mb-2`}>{ticket.title}</h1>
            <p className="text-foreground/60">#{ticket.id.substring(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-border">
          <div>
            <p className="text-sm text-foreground/60 mb-1">Category</p>
            <p className="text-lg font-medium text-foreground">{ticket.category}</p>
          </div>
          <div>
            <p className="text-sm text-foreground/60 mb-1">Created</p>
            <p className="text-lg font-medium text-foreground">{format(ticket.createdAt, 'MMM dd, yyyy HH:mm')}</p>
          </div>
          {ticket.assignedToName && (
            <div>
              <p className="text-sm text-foreground/60 mb-1">Assigned To</p>
              <p className="text-lg font-medium text-foreground">{ticket.assignedToName}</p>
            </div>
          )}
          {ticket.roomName && (
            <div>
              <p className="text-sm text-foreground/60 mb-1">Room</p>
              <p className="text-lg font-medium text-foreground">{ticket.roomName}</p>
              <p className="text-sm text-foreground/60">
                {ticket.roomBuilding} · Floor {ticket.roomFloor} · #{ticket.roomNumber}
              </p>
            </div>
          )}
          {ticket.resolvedAt && (
            <div>
              <p className="text-sm text-foreground/60 mb-1">Resolved</p>
              <p className="text-lg font-medium text-foreground">{format(ticket.resolvedAt, 'MMM dd, yyyy HH:mm')}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
          <p className="text-foreground/60 whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-foreground mb-6">Messages ({messages.length})</h3>

        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map(message => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.userId === user?.uid
                  ? 'bg-secondary/40 border border-border ml-8'
                  : 'bg-secondary/40 border border-border mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{message.userName}</p>
                <p className="text-xs text-foreground/60">{format(message.createdAt, 'MMM dd, HH:mm')}</p>
              </div>
              <p className="text-foreground/80">{message.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 ${fieldClass}`}
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className={`${primaryBtnClass} flex items-center gap-2 disabled:opacity-50`}
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
