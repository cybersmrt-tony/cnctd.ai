import { Avatar } from '../types';

interface AvatarCardProps {
  avatar: Avatar;
  onClick: () => void;
}

export function AvatarCard({ avatar, onClick }: AvatarCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
    >
      <div className="h-64 bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
        <span className="text-6xl">👤</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{avatar.name}</h3>
          {avatar.tier !== 'free' && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {avatar.tier}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-3">{avatar.tagline}</p>
        <div className="text-xs text-gray-500">
          <p>{avatar.age} • {avatar.occupation}</p>
        </div>
      </div>
    </div>
  );
}
