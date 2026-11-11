import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { SupportTicket } from '../../types';
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
} from 'lucide-react';

export const SupportTickets: React.FC = () => {
  const { addToast } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>(() => storage.getSupportTickets());
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    storage.addTicketReply(selectedTicket.id, {
      sender: 'Platform Super Admin',
      text: replyText.trim(),
      isAdminReply: true,
    });

    setTickets(storage.getSupportTickets());
    setReplyText('');
    addToast('success', 'Reply dispatched to shop admin');
  };

  const handleUpdateStatus = (status: SupportTicket['status']) => {
    if (!selectedTicket) return;
    const all = storage.getSupportTickets();
    const t = all.find((x) => x.id === selectedTicket.id);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
      localStorage.setItem('printflow_tickets_v1', JSON.stringify(all));
      setTickets(all);
      addToast('info', `Ticket status marked as ${status.replace('_', ' ').toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Help Desk & Shop Support Requests
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Respond to hardware spooler, printer connectivity, and billing inquiries from shop administrators
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden min-h-[500px]">
        {/* Ticket List */}
        <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
            <span>Incoming Inquiries</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {tickets.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-1.5 ${
                  selectedTicket?.id === t.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    {t.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {t.subject}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3 h-3" />
                  <span className="truncate">{t.shopName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Thread */}
        {selectedTicket ? (
          <div className="md:col-span-2 flex flex-col justify-between">
            {/* Thread Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedTicket.id}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                    {selectedTicket.shopName} ({selectedTicket.shopId})
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedTicket.subject}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('open')}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[350px]">
              {selectedTicket.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    msg.isAdminReply ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {msg.sender}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.isAdminReply
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type response as Platform Super Admin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center p-8 text-xs text-slate-400">
            Select a ticket from the left column to view message dialogue.
          </div>
        )}
      </div>
    </div>
  );
};
