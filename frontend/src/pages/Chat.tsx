import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';
import { ChatWebSocket } from '../lib/websocket';
import { Message } from '../types';
import { ChatMessage } from '../components/ChatMessage';

export function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState<ChatWebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();
  const avatar = location.state?.avatar;

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();
    connectWebSocket();

    return () => {
      ws?.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await api.conversations.getMessages(conversationId!);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const connectWebSocket = () => {
    if (!conversationId || !user || !avatar) return;

    const chatWs = new ChatWebSocket(conversationId, user.id, avatar.id);

    chatWs.connect().then(() => {
      chatWs.onMessage((data) => {
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: data.data.role,
            content: data.data.content,
            image_url: data.data.imageUrl,
            conversation_id: conversationId,
            created_at: new Date().toISOString()
          }]);
          setIsTyping(false);
        } else if (data.type === 'typing') {
          setIsTyping(true);
        } else if (data.type === 'error') {
          setError(data.error);
          setIsTyping(false);
        } else if (data.type === 'rate_limit') {
          setError(data.error);
          setIsTyping(false);
        }
      });

      setWs(chatWs);
    }).catch(console.error);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ws) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      image_url: null,
      conversation_id: conversationId!,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    ws.sendMessage(inputMessage);
    setInputMessage('');
    setError('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h2 className="font-semibold">{avatar?.name || 'Chat'}</h2>
            <p className="text-xs text-gray-500">{avatar?.tagline}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      <div className="bg-white border-t px-4 py-4">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
