import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Inbox, Mail, MailOpen, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { cn, timeAgo } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Tab = 'inbox' | 'compose';

export default function AdminMessagesPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('inbox');
  const [form, setForm] = useState({ recipientId: '', subject: '', body: '' });
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [viewMessage, setViewMessage] = useState<any>(null);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'contact'>('all');
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/messages').then(r => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users', ''],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
  });

  const sendMessage = useMutation({
    mutationFn: (data: any) => api.post('/messages', data),
    onSuccess: () => { toast.success('Message sent'); qc.invalidateQueries({ queryKey: ['admin-messages'] }); setTab('inbox'); setForm({ recipientId: '', subject: '', body: '' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const broadcastMessage = useMutation({
    mutationFn: (data: any) => api.post('/messages/broadcast', data),
    onSuccess: () => { toast.success('Broadcast sent'); setTab('inbox'); setForm({ recipientId: '', subject: '', body: '' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const handleSend = () => {
    if (!form.subject.trim() || !form.body.trim()) { toast.error('Subject and body required'); return; }
    if (isBroadcast) broadcastMessage.mutate({ subject: form.subject, body: form.body });
    else {
      if (!form.recipientId) { toast.error('Select a recipient'); return; }
      sendMessage.mutate(form);
    }
  };

  const unreadCount = messages?.filter((m: any) => !m.isRead).length || 0;
  const contactMessages = messages?.filter((m: any) => m.subject?.startsWith('[Contact Us]')) || [];
  const regularMessages = messages?.filter((m: any) => !m.subject?.startsWith('[Contact Us]')) || [];
  const displayedMessages = inboxFilter === 'contact' ? contactMessages : regularMessages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>Messages</h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          {unreadCount} unread messages
        </p>
      </div>

      <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
        <button onClick={() => setTab('inbox')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'inbox' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
          <Inbox className="w-4 h-4" /> Inbox
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab('compose')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'compose' ? 'bg-green-700 text-white shadow' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'))}>
          <Send className="w-4 h-4" /> Compose
        </button>
      </div>

      {tab === 'inbox' && (
        <>
          {/* Message detail view */}
          {viewMessage && (
            <Card className="p-6">
              <button onClick={() => setViewMessage(null)}
                className={cn('flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors',
                  isDark ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-600')}>
                <ArrowLeft className="w-4 h-4" /> Back to inbox
              </button>
              <div className="flex items-start gap-3 mb-4">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')}>
                  {viewMessage.sender?.firstName?.[0]}{viewMessage.sender?.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>{viewMessage.subject}</h3>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      From: {viewMessage.sender?.firstName} {viewMessage.sender?.lastName}
                    </span>
                    <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>·</span>
                    <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>{timeAgo(viewMessage.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className={cn('whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-xl',
                isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-gray-700')}>
                {viewMessage.body}
              </div>
            </Card>
          )}

          {/* Message list */}
          {!viewMessage && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setInboxFilter('all')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    inboxFilter === 'all'
                      ? 'bg-green-700 text-white'
                      : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
                  <Inbox className="w-3.5 h-3.5" /> Regular ({regularMessages.length})
                </button>
                <button onClick={() => setInboxFilter('contact')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    inboxFilter === 'contact'
                      ? 'bg-amber-500 text-white'
                      : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'))}>
                  <MessageSquare className="w-3.5 h-3.5" /> Contact Us ({contactMessages.length})
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : !displayedMessages?.length ? (
                <Card className={cn('text-center py-16', isDark ? 'text-slate-400' : 'text-gray-400')}>
                  <Mail className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-slate-600' : 'text-gray-200')} />
                  <p className="font-medium">{inboxFilter === 'contact' ? 'No contact form messages' : 'No messages yet'}</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {displayedMessages.map((m: any) => {
                    const isContact = m.subject?.startsWith('[Contact Us]');
                    const displayName = isContact
                      ? m.body?.match(/From: (.+)/)?.[1]?.split('\n')[0] || m.sender?.firstName
                      : `${m.sender?.firstName} ${m.sender?.lastName}`;
                    const displayEmail = isContact
                      ? m.body?.match(/Email: (.+)/)?.[1]?.split('\n')[0]
                      : null;
                    const iconBg = isContact
                      ? (isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700')
                      : (isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700');
                    return (
                      <div key={m.id} className="cursor-pointer" onClick={() => { if (!m.isRead) markRead.mutate(m.id); setViewMessage(m); }}>
                        <Card className={cn('p-4 transition-colors',
                          !m.isRead && (isDark ? 'border-blue-800 bg-blue-900/10' : 'border-blue-200 bg-blue-50/50'),
                          m.isRead && (isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'))}>
                        <div className="flex items-start gap-3">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', iconBg)}>
                            {isContact ? <MessageSquare className="w-3.5 h-3.5" /> : <>{m.sender?.firstName?.[0]}{m.sender?.lastName?.[0]}</>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!m.isRead && <MailOpen className="w-3 h-3 text-blue-500" />}
                              {isContact && (
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                  isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700')}>
                                  Contact
                                </span>
                              )}
                              <h4 className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                {m.subject?.replace('[Contact Us] ', '')}
                              </h4>
                            </div>
                            <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>
                              {isContact ? `${displayName}${displayEmail ? ` (${displayEmail})` : ''}` : m.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px]">
                              <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>
                                {isContact ? `From: ${displayName}` : `From: ${m.sender?.firstName} ${m.sender?.lastName}`}
                              </span>
                              <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>·</span>
                              <span className={isDark ? 'text-slate-600' : 'text-gray-400'}>{timeAgo(m.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'compose' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} className="w-4 h-4 text-green-600 rounded" />
                <span className={cn('text-sm font-medium flex items-center gap-1', isDark ? 'text-slate-300' : 'text-gray-700')}>
                  <Users className="w-3.5 h-3.5" /> Broadcast to all users
                </span>
              </label>
            </div>
            {!isBroadcast && (
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Recipient *</label>
                <select value={form.recipientId} onChange={e => setForm(p => ({ ...p, recipientId: e.target.value }))}
                  className={cn('w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300')}>
                  <option value="">Select recipient...</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            <Input label="Subject *" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            <div>
              <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>Message *</label>
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={6}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500',
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200')} />
            </div>
            <Button leftIcon={<Send className="w-4 h-4" />} onClick={handleSend}
              isLoading={sendMessage.isPending || broadcastMessage.isPending}
              disabled={!form.subject.trim() || !form.body.trim()}>
              {isBroadcast ? 'Broadcast Message' : 'Send Message'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
