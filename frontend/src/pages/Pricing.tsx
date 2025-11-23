import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useState } from 'react';

export function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'standard' | 'premium') => {
    setLoading(tier);
    try {
      const response = await api.payments.createCheckout(tier);
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      features: [
        '20 messages per day',
        '5 images per day',
        'Access to free avatars',
        'Basic chat features'
      ],
      cta: 'Current Plan',
      tier: null
    },
    {
      name: 'Standard',
      price: '$20/mo',
      features: [
        '1,000 messages per day',
        '20 images per day',
        'Access to standard avatars',
        'Priority support'
      ],
      cta: 'Upgrade',
      tier: 'standard' as const
    },
    {
      name: 'Premium',
      price: '$40/mo',
      features: [
        'Unlimited messages',
        '100 images per day',
        'Access to all avatars',
        'VIP support',
        'Early access to new features'
      ],
      cta: 'Go Premium',
      tier: 'premium' as const,
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-center text-gray-600 mb-12">
          Upgrade anytime to unlock more features
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                tier.featured ? 'ring-2 ring-primary-500 transform scale-105' : ''
              }`}
            >
              {tier.featured && (
                <div className="bg-primary-500 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="text-4xl font-bold mb-6">{tier.price}</div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary-500">✓</span>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              {tier.tier && (
                <button
                  onClick={() => handleUpgrade(tier.tier!)}
                  disabled={loading === tier.tier}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    tier.featured
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {loading === tier.tier ? 'Loading...' : tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
