import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start chatting with an avatar to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv)}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{conv.avatar_name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {conv.last_message || 'Start a conversation'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
