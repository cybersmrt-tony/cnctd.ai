import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getUser } from '../lib/auth';
import { Avatar } from '../types';
import { AvatarCard } from '../components/AvatarCard';

export function Dashboard() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const response = await api.avatars.list();
      setAvatars(response.avatars);
    } catch (error) {
      console.error('Failed to load avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = async (avatar: Avatar) => {
    try {
      const response = await api.conversations.start(avatar.id);
      navigate(`/chat/${response.conversation.id}`, {
        state: { avatar }
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-900">cnctd.ai</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
              {user?.subscription_tier}
            </span>
            <button
              onClick={() => navigate('/pricing')}
              className="text-sm text-primary-600 hover:underline"
            >
              Upgrade
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Choose Your Companion</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                onClick={() => handleAvatarClick(avatar)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
