import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, MessageSquare, ShieldAlert, UserX, 
  ShoppingBag, ArrowLeft, Check, CheckCheck, Sparkles, ShieldCheck
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    selectConversation, 
    sendMessage, 
    closeActiveConversation,
    isLoadingMessages 
  } = useChat();
  const { success, error } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const sent = await sendMessage(inputMessage);
    if (sent) {
      setInputMessage('');
    }
    setIsSending(false);
  };

  const handleBlockUser = async (targetUserId: number) => {
    if (!window.confirm('Are you sure you want to block this user? They will not be able to message you.')) return;
    try {
      const res = await api.post('/chat/block-user', { targetUserId });
      if (res.data.success) {
        success(res.data.message);
        closeActiveConversation();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleReport = async (conversationId: number) => {
    const reason = window.prompt('Please enter the reason for reporting this chat:');
    if (!reason) return;
    try {
      const res = await api.post('/marketplace/reports', {
        targetType: 'CONVERSATION',
        targetId: String(conversationId),
        reason,
      });
      if (res.data.success) {
        success('Chat conversation reported to campus safety & moderation team.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Report failed');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {activeConversation ? (
            <button
              onClick={closeActiveConversation}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              {activeConversation
                ? activeConversation.otherUser?.fullName || 'Chat'
                : 'Marketplace Messenger'}
              {activeConversation && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {activeConversation ? 'Campus Verified Channel' : `${conversations.length} Active Conversations`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {activeConversation && (
            <>
              <button
                onClick={() => handleReport(activeConversation.id)}
                title="Report Conversation"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
              {activeConversation.otherUser && (
                <button
                  onClick={() => handleBlockUser(activeConversation.otherUser!.id)}
                  title="Block User"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Area */}
      {!activeConversation ? (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300">No active messages</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
                Browse listings in the Campus Marketplace and click "Message Seller" to coordinate private exchanges.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition flex items-start space-x-3.5"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                    {c.otherUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{c.otherUser?.fullName}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {c.product && (
                    <div className="flex items-center space-x-1 mt-0.5 text-[11px] text-brand-600 dark:text-brand-400 font-bold truncate">
                      <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{c.product.title} (₹{c.product.price})</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">
                    {c.lastMessage?.content || 'Started conversation'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Active Conversation Chat Window */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Product Context Banner */}
          {activeConversation.product && (
            <div className="px-5 py-3 bg-indigo-50/70 dark:bg-slate-800/60 border-b border-indigo-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-xl bg-white dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex-shrink-0 shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {activeConversation.product.title}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {activeConversation.product.price === 0 ? 'Free Giveaway' : `₹${activeConversation.product.price}`} • Status: {activeConversation.product.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingMessages ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading conversation history...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                No messages yet. Say hello and coordinate the item exchange location!
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isMine
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/60'
                      }`}
                    >
                      <p>{m.content}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-[9px] text-slate-400 mt-1 px-1 font-medium">
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && (
                        <CheckCheck className={`w-3 h-3 ${m.isRead ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center space-x-2.5">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message (Press Enter to send)..."
              className="flex-1 glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition shadow-md shadow-brand-500/25 cursor-pointer active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
