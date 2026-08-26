import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, SOCKET_URL } from '../services/api';
import { Conversation, Message } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadMessagesCount: number;
  isLoadingMessages: boolean;
  isChatOpen: boolean;
  openChat: (conversationId?: number) => void;
  closeChat: () => void;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  startConversationWithProduct: (productId: number, initialMessage?: string) => Promise<number | null>;
  closeActiveConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { info } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Initialize Socket.io
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Campus Chat Socket Server');
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      fetchConversations();
    });

    newSocket.on('new_message_notification', (data: any) => {
      info(`💬 Message from ${data.senderName}: "${data.content.substring(0, 30)}..."`);
      fetchConversations();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        const totalUnread = res.data.data.reduce((acc: number, c: Conversation) => acc + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnread);
      }
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 8000);
      return () => clearInterval(interval);
    }
  }, [user, fetchConversations]);

  const selectConversation = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      if (res.data.success) {
        setActiveConversation(res.data.data.conversation);
        setMessages(res.data.data.messages);

        if (socket) {
          socket.emit('join_conversation', conversationId);
        }

        // Update local unread counter
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const closeActiveConversation = () => {
    if (activeConversation && socket) {
      socket.emit('leave_conversation', activeConversation.id);
    }
    setActiveConversation(null);
    setMessages([]);
  };

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!activeConversation || !content.trim()) return false;

    try {
      const res = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
        content: content.trim(),
      });

      if (res.data.success) {
        const newMessage = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        fetchConversations();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to send message:', e);
      return false;
    }
  };

  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = (conversationId?: number) => {
    setIsChatOpen(true);
    if (conversationId) {
      selectConversation(conversationId);
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const startConversationWithProduct = async (
    productId: number,
    initialMessage?: string
  ): Promise<number | null> => {
    try {
      const res = await api.post('/chat/conversations', {
        productId,
        initialMessage,
      });

      if (res.data.success) {
        const convId = res.data.data.id;
        await fetchConversations();
        await selectConversation(convId);
        setIsChatOpen(true);
        return convId;
      }
      return null;
    } catch (e: any) {
      console.error('Failed to start conversation:', e);
      return null;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        unreadMessagesCount,
        isLoadingMessages,
        isChatOpen,
        openChat,
        closeChat,
        fetchConversations,
        selectConversation,
        sendMessage,
        startConversationWithProduct,
        closeActiveConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
