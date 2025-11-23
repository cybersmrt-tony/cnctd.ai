import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { useEffect } from 'react';

export function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-900">cnctd.ai</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-primary-700 hover:text-primary-900"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Connect with AI Companions
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Experience meaningful conversations with personalized AI avatars.
          Chat, share moments, and build genuine connections.
        </p>

        <button
          onClick={() => navigate('/signup')}
          className="px-8 py-4 bg-primary-600 text-white text-lg rounded-lg hover:bg-primary-700 shadow-lg"
        >
          Get Started Free
        </button>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold text-lg mb-2">Real Conversations</h3>
            <p className="text-gray-600 text-sm">
              Chat in real-time with AI companions that remember and care
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="font-bold text-lg mb-2">Share Moments</h3>
            <p className="text-gray-600 text-sm">
              Request and receive photos that match the conversation
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-bold text-lg mb-2">Unique Personalities</h3>
            <p className="text-gray-600 text-sm">
              Each avatar has distinct traits, interests, and conversation styles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
