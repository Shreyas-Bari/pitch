import React, { useState, useRef, useEffect } from 'react';
import { Send, Share2, Sparkles, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

export function MessageComposer({
  conversationId,
  onSendMessage,
  onOpenContactModal,
  socket,
  disabled = false,
  isSending = false,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Clean up typing indicator on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && socket && conversationId) {
        socket.emit('typing:stop', { conversationId });
        isTypingRef.current = false;
      }
    };
  }, [conversationId, socket]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Emit typing indicator if socket is active
    if (socket && conversationId && val.trim().length > 0) {
      if (!isTypingRef.current) {
        socket.emit('typing:start', { conversationId });
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && conversationId) {
          socket.emit('typing:stop', { conversationId });
        }
        isTypingRef.current = false;
      }, 1500);
    } else if (isTypingRef.current && (!val || val.trim().length === 0)) {
      if (socket && conversationId) {
        socket.emit('typing:stop', { conversationId });
      }
      isTypingRef.current = false;
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isSending || disabled) return;

    const trimmedText = text.trim();
    setText('');

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket && conversationId) {
      socket.emit('typing:stop', { conversationId });
      isTypingRef.current = false;
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage({
      type: 'TEXT',
      text: trimmedText,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
      <div className="flex flex-col gap-2">
        {/* Actions bar above composer input */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            {onOpenContactModal && (
              <button
                type="button"
                onClick={onOpenContactModal}
                disabled={disabled || isSending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50/80 hover:bg-primary-100 border border-primary-200/80 transition-colors disabled:opacity-50"
                title="Share email, phone, or WhatsApp details"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Contact</span>
              </button>
            )}
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>
        </div>

        {/* Input box and Send button */}
        <div className="flex items-end gap-2.5">
          <div className="flex-1 relative rounded-2xl border border-slate-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 bg-slate-50/50 transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={disabled || isSending}
              placeholder="Type your message..."
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none max-h-32 leading-relaxed"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={!text.trim() || disabled || isSending}
            isLoading={isSending}
            className="rounded-2xl px-4 py-2.5 h-auto shrink-0 shadow-sm"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MessageComposer;
