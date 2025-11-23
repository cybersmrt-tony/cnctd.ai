import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.image_url && (
          <div className="mt-2">
            <img
              src={message.image_url}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
