import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, MessageSquare, ShieldAlert, UserX, 
  ShoppingBag, ArrowLeft, Check, CheckCheck, Sparkles, ShieldCheck,
  Search, AlertCircle
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredConversations = conversations.filter((c) => {
    const name = c.otherUser?.fullName || '';
    const title = c.product?.title || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center space-x-3 min-w-0">
            {activeConversation ? (
              <button
                onClick={closeActiveConversation}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition active:scale-90"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 shadow-2xs">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {activeConversation
                  ? activeConversation.otherUser?.fullName || 'Campus Peer'
                  : 'Campus Marketplace Messages'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                {activeConversation
                  ? `${activeConversation.otherUser?.department || 'Student'} • ${activeConversation.product?.title ? `Re: ${activeConversation.product.title}` : 'Direct Chat'}`
                  : 'Verified Student-to-Student Chats'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {activeConversation && (
              <>
                <button
                  onClick={() => handleReport(activeConversation.id)}
                  className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Report Conversation"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
                {activeConversation.otherUser?.id && (
                  <button
                    onClick={() => handleBlockUser(activeConversation.otherUser!.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Block User"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View: Conversations List vs Active Message Thread */}
        {!activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search filter */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter conversations or item titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl text-xs font-medium bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Conversation items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              {filteredConversations.length === 0 ? (
                <div className="py-16 text-center text-slate-400 px-6">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active conversations</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Browse the Campus Marketplace and click "Chat with Seller" to arrange an exchange.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="w-full p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left flex items-start space-x-3 cursor-pointer group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {conv.otherUser?.fullName?.charAt(0) || 'U'}
                      </div>
                      {(conv.unreadCount || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {conv.otherUser?.fullName || 'Student Peer'}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {conv.product && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <ShoppingBag className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            {conv.product.title} (₹{conv.product.price})
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">
                        {conv.lastMessage?.content || 'Started conversation'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Product context strip */}
            {activeConversation.product && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                      {activeConversation.product.title}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      Price: {activeConversation.product.price === 0 ? 'FREE' : `₹${activeConversation.product.price}`} • {activeConversation.product.condition}
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="xs">
                  {activeConversation.product.status}
                </Badge>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {isLoadingMessages ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading message history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No messages yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Send a message below to arrange a meeting on campus.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center space-x-1 mt-1 px-1">
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <CheckCheck className="w-3 h-3 text-brand-500" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 glass-input rounded-2xl text-xs font-medium px-4 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSending}
                  disabled={!inputMessage.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
