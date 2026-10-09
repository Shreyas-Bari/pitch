import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { conversationService } from '../../services/conversationService';
import { messageService } from '../../services/messageService';
import { useToast } from '../../hooks/useToast';

import ConversationList from './ConversationList';
import ConversationHeader from './ConversationHeader';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import ContactShareModal from './ContactShareModal';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Skeleton from '../ui/Skeleton';
import { MessageSquare, ArrowDown } from 'lucide-react';

export function ChatWorkspace({ basePath = '/messages' }) {
  const { conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { socket, isConnected } = useSocket();
  const toast = useToast();

  const currentUserId = user?._id || user?.id;
  const userRole = user?.role;

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  // Active Conversation State
  const activeConversationId = routeConversationId || null;
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Realtime typing & scroll
  const [typingUserName, setTypingUserName] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      const res = await conversationService.getConversations();
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.conversations || res?.conversations || (Array.isArray(res) ? res : []));
      setConversations(list);

      // Auto-select first conversation on desktop if none selected
      if (!routeConversationId && list.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
        navigate(`${basePath}/${list[0]._id}`, { replace: true });
      }
    } catch (err) {
      setConversationsError(err.response?.data?.message || err.message || 'Failed to load conversations.');
    } finally {
      setConversationsLoading(false);
    }
  }, [basePath, navigate, routeConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Keep active conversation object synced with list or fetch if not in list
  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      return;
    }

    const found = conversations.find((c) => c._id === activeConversationId);
    if (found) {
      setActiveConversation(found);
    } else {
      // Fetch details individually
      conversationService
        .getConversation(activeConversationId)
        .then((res) => {
          const c = res?.data?.conversation || res?.conversation || res?.data || null;
          setActiveConversation(c);
        })
        .catch(() => {
          // Handled in messagesError
        });
    }
  }, [activeConversationId, conversations]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const res = await messageService.getMessages(convId, { limit: 100 });
      const msgs = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.messages || res?.messages || (Array.isArray(res) ? res : []));
      setMessages(msgs);

      // Mark conversation as read on load
      try {
        await messageService.markAsRead(convId);
        if (socket && isConnected) {
          socket.emit('message:read', { conversationId: convId });
        }
        // Update local conversation list read state
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === convId && c.lastMessageId) {
              const currentRead = c.lastMessageId.readBy || [];
              if (!currentRead.some((r) => String(r.userId?._id || r.userId) === String(currentUserId))) {
                return {
                  ...c,
                  lastMessageId: {
                    ...c.lastMessageId,
                    readBy: [...currentRead, { userId: currentUserId, readAt: new Date() }],
                  },
                };
              }
            }
            return c;
          })
        );
      } catch {
        // Non-blocking
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setMessagesError('UNAUTHORIZED');
      } else if (status === 404) {
        setMessagesError('NOT_FOUND');
      } else {
        setMessagesError(err.response?.data?.message || err.message || 'Failed to load messages.');
      }
    } finally {
      setMessagesLoading(false);
    }
  }, [socket, isConnected, currentUserId]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
      setMessagesError(null);
    }
  }, [activeConversationId, fetchMessages]);

  // 3. Socket Room Join / Leave and Real-Time Event Handlers
  useEffect(() => {
    if (!socket || !isConnected || !activeConversationId) return;

    // Join room
    socket.emit('conversation:join', activeConversationId, (response) => {
      if (response?.error) {
        console.warn('Socket join room rejected:', response.error);
      }
    });

    // Listen for new messages
    const handleNewMessage = (newMsg) => {
      const msgConvId =
        typeof newMsg.conversationId === 'object'
          ? newMsg.conversationId?._id
          : newMsg.conversationId;

      // Update conversations list metadata and order
      setConversations((prevList) => {
        const existingIndex = prevList.findIndex((c) => c._id === msgConvId);
        if (existingIndex !== -1) {
          const updated = {
            ...prevList[existingIndex],
            lastMessageId: newMsg,
            lastMessageAt: newMsg.createdAt,
          };
          const copy = [...prevList];
          copy.splice(existingIndex, 1);
          return [updated, ...copy];
        }
        return prevList;
      });

      // If for active conversation, append message safely with deduplication
      if (msgConvId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) {
            return prev; // Duplicate prevention
          }
          return [...prev, newMsg];
        });

        // Mark as read if user is currently looking at active conversation
        const senderId =
          typeof newMsg.senderUserId === 'object'
            ? newMsg.senderUserId?._id || newMsg.senderUserId?.id
            : newMsg.senderUserId;

        if (String(senderId) !== String(currentUserId)) {
          messageService.markAsRead(activeConversationId).catch(() => {});
          socket.emit('message:read', { conversationId: activeConversationId });
        }
      }
    };

    // Listen for read receipts
    const handleMessageRead = ({ conversationId: readConvId, userId }) => {
      if (readConvId === activeConversationId && String(userId) !== String(currentUserId)) {
        setMessages((prev) =>
          prev.map((msg) => {
            const currentRead = msg.readBy || [];
            if (!currentRead.some((r) => String(r.userId?._id || r.userId) === String(userId))) {
              return {
                ...msg,
                readBy: [...currentRead, { userId, readAt: new Date() }],
              };
            }
            return msg;
          })
        );
      }
    };

    // Listen for typing indicators
    const handleTypingStart = ({ conversationId: tConvId, userId, name }) => {
      if (tConvId === activeConversationId && String(userId) !== String(currentUserId)) {
        setTypingUserName(name || 'Partner');
      }
    };

    const handleTypingStop = ({ conversationId: tConvId, userId }) => {
      if (tConvId === activeConversationId && String(userId) !== String(currentUserId)) {
        setTypingUserName(null);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.emit('conversation:leave', activeConversationId);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      setTypingUserName(null);
    };
  }, [socket, isConnected, activeConversationId, currentUserId]);

  // Reconnection reconciliation: refresh messages when connection recovers
  useEffect(() => {
    if (!socket) return;
    const handleReconnect = () => {
      if (activeConversationId) {
        socket.emit('conversation:join', activeConversationId);
        fetchMessages(activeConversationId);
      }
      fetchConversations();
    };

    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [socket, activeConversationId, fetchMessages, fetchConversations]);

  // 4. Scroll Tracking and Auto-scroll
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Initial load scroll
    if (!messagesLoading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messagesLoading, activeConversationId]);

  useEffect(() => {
    // New message scroll (only if near bottom)
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 160;

    if (isNearBottom) {
      scrollToBottom('smooth');
      setShowScrollBottom(false);
    } else {
      setShowScrollBottom(true);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 160;
    setShowScrollBottom(!isNearBottom);
  };

  // 5. Send Message Action
  const handleSendMessage = async (payload) => {
    if (!activeConversationId) return;

    try {
      setIsSending(true);
      const res = await messageService.sendMessage(activeConversationId, payload);
      const createdMessage = res?.data?.message || res?.message || res?.data;

      if (createdMessage) {
        // Reconcile and deduplicate immediately
        setMessages((prev) => {
          if (prev.some((m) => m._id === createdMessage._id)) {
            return prev;
          }
          return [...prev, createdMessage];
        });

        // Update conversation list
        setConversations((prevList) => {
          const existingIndex = prevList.findIndex((c) => c._id === activeConversationId);
          if (existingIndex !== -1) {
            const updated = {
              ...prevList[existingIndex],
              lastMessageId: createdMessage,
              lastMessageAt: createdMessage.createdAt,
            };
            const copy = [...prevList];
            copy.splice(existingIndex, 1);
            return [updated, ...copy];
          }
          return prevList;
        });

        scrollToBottom('smooth');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to send message. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  // Selection handler
  const handleSelectConversation = (id) => {
    navigate(`${basePath}/${id}`);
  };

  const handleBackToList = () => {
    navigate(basePath);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-8.5rem)] min-h-[550px] flex">
      {/* Left Column: Conversation List */}
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 flex-col shrink-0 h-full`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={conversationsLoading}
          currentUserId={currentUserId}
          userRole={userRole}
          basePath={basePath}
        />
      </div>

      {/* Right Column: Chat Workspace / Active Thread */}
      <div
        className={`${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full bg-slate-50/40 relative min-w-0`}
      >
        {activeConversationId ? (
          <>
            {/* Header */}
            <ConversationHeader
              conversation={activeConversation}
              userRole={userRole}
              isSocketConnected={isConnected}
              typingUserName={typingUserName}
              onBack={handleBackToList}
              onOpenContactModal={() => setIsContactModalOpen(true)}
            />

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 relative"
            >
              {messagesLoading ? (
                <div className="space-y-4 py-8 max-w-lg mx-auto">
                  <div className="flex items-start gap-2.5">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="rounded" width="55%" height={48} />
                  </div>
                  <div className="flex items-start justify-end gap-2.5">
                    <Skeleton variant="rounded" width="45%" height={40} />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="rounded" width="65%" height={56} />
                  </div>
                </div>
              ) : messagesError ? (
                <div className="h-full flex items-center justify-center p-6">
                  {messagesError === 'UNAUTHORIZED' ? (
                    <ErrorState
                      type="forbidden"
                      title="Access Restricted"
                      message="You are not authorized to view this sponsorship conversation."
                      backUrl={basePath}
                    />
                  ) : messagesError === 'NOT_FOUND' ? (
                    <ErrorState
                      type="notfound"
                      title="Conversation Not Found"
                      message="The conversation could not be located or may have been archived."
                      backUrl={basePath}
                    />
                  ) : (
                    <ErrorState
                      type="api"
                      title="Unable to load messages"
                      message={messagesError}
                      onRetry={() => fetchMessages(activeConversationId)}
                    />
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="Start the conversation"
                    description="Discuss sponsorship packages, campus audience requirements, and commercial deliverables directly with the organizer."
                  />
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg._id}
                      message={msg}
                      currentUserId={currentUserId}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-1" />
                </>
              )}

              {/* Scroll To Bottom Button */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom('smooth')}
                  className="fixed sm:absolute bottom-24 right-6 z-20 p-2.5 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all focus:outline-none ring-2 ring-white"
                  title="Scroll to latest messages"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Composer */}
            <MessageComposer
              conversationId={activeConversationId}
              onSendMessage={handleSendMessage}
              onOpenContactModal={() => setIsContactModalOpen(true)}
              socket={socket}
              isSending={isSending}
              disabled={messagesLoading || !!messagesError}
            />

            {/* Contact Sharing Modal */}
            <ContactShareModal
              isOpen={isContactModalOpen}
              onClose={() => setIsContactModalOpen(false)}
              conversationId={activeConversationId}
              defaultEmail={user?.email || ''}
              defaultPhone={profile?.contactPhone || profile?.phone || ''}
              onContactShared={() => {
                fetchMessages(activeConversationId);
                fetchConversations();
              }}
            />
          </>
        ) : (
          /* Empty Workspace state (when no conversation is selected) */
          <div className="h-full flex items-center justify-center p-8">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a conversation thread from the left panel to review sponsorship details, share contacts, and coordinate event partnerships."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatWorkspace;
