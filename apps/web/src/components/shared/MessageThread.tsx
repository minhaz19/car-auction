'use client';

import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import {
  useGetMessagesQuery,
  useSendMessageMutation,
} from '@/store/services/transactionsApi';
import type { IMessage, IUserPublic } from '@car-auction/shared';
import { Send, MessageSquare, User, Clock } from 'lucide-react';

interface MessageThreadProps {
  transactionId: string;
}

export function MessageThread({ transactionId }: MessageThreadProps) {
  const { user } = useAuth();
  const { data: initialMessages = [], refetch } = useGetMessagesQuery(transactionId);
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();

  const [realtimeMessages, setRealtimeMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine initial RTK Query messages and real-time socket pushes
  const messages = useMemo(
    () => [
      ...initialMessages,
      ...realtimeMessages.filter((rm) => !initialMessages.some((im) => String(im._id) === String(rm._id))),
    ],
    [initialMessages, realtimeMessages],
  );

  // Real-time Socket listener for transaction room
  useEffect(() => {
    const socket = getSocket();

    // Join room
    socket.emit('transaction:join' as unknown as keyof import('@car-auction/shared').ClientToServerEvents, { transactionId } as unknown as never);

    const handleNewMessage = (newMsg: IMessage) => {
      if (newMsg && String(newMsg.transactionId) === String(transactionId)) {
        setRealtimeMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
      }
    };

    socket.on('message:new' as unknown as keyof import('@car-auction/shared').ServerToClientEvents, handleNewMessage as unknown as never);

    return () => {
      socket.off('message:new' as unknown as keyof import('@car-auction/shared').ServerToClientEvents, handleNewMessage as unknown as never);
      socket.emit('transaction:leave' as unknown as keyof import('@car-auction/shared').ClientToServerEvents, { transactionId } as unknown as never);
    };
  }, [transactionId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    const messageText = text.trim();
    setText('');

    try {
      await sendMessageMutation({ transactionId, text: messageText }).unwrap();
      refetch();
    } catch {
      setText(messageText); // Restore on error
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden h-[460px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border p-4 bg-muted/20">
        <MessageSquare className="h-4 w-4 text-emerald-400" />
        <h4 className="text-sm font-extrabold text-foreground">
          Pickup & Delivery Coordination Chat
        </h4>
        <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase bg-zinc-800 px-2 py-0.5 rounded">
          Socket.io Encrypted
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3 overflow-y-auto bg-zinc-950/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground space-y-2">
            <MessageSquare className="h-8 w-8 text-zinc-700" />
            <p className="text-xs font-bold">No messages exchanged yet</p>
            <p className="text-[11px]">
              Use this direct thread to arrange pickup location, inspection date, and vehicle transport.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderObj = typeof msg.senderId === 'object' ? (msg.senderId as IUserPublic) : null;
            const senderIdStr = senderObj ? senderObj._id : String(msg.senderId);
            const isMe = user?._id === senderIdStr;
            const senderName = senderObj ? senderObj.name : isMe ? 'You' : 'Counterpart';

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground px-1">
                  <User className="h-3 w-3 text-zinc-500" />
                  <span>{senderName}</span>
                  <span>•</span>
                  <Clock className="h-2.5 w-2.5" />
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/50'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-2xl border border-input bg-zinc-950 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-500 text-black font-bold shadow hover:bg-emerald-400 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
