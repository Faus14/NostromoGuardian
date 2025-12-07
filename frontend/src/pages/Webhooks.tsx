import { useState, useEffect } from 'react';
import { Webhook, Trash2, Power, PowerOff, TestTube, Check, X, Copy } from 'lucide-react';

interface WebhookSubscription {
  id: number;
  url: string;
  events: string[];
  description: string;
  active: boolean;
  created_at: string;
  last_triggered: string | null;
}

const AVAILABLE_EVENTS = [
  { value: 'whale.buy', label: '🐋 Whale Buy', color: 'text-green-400' },
  { value: 'whale.sell', label: '🐋 Whale Sell', color: 'text-red-400' },
  { value: 'new_holder', label: '👤 New Holder', color: 'text-blue-400' },
  { value: 'volume.spike', label: '📈 Volume Spike', color: 'text-purple-400' },
  { value: 'price.change', label: '💰 Price Change', color: 'text-yellow-400' },
  { value: 'achievement.diamond_hand', label: '💎 Diamond Hand', color: 'text-cyan-400' },
  { value: 'leaderboard.update', label: '🏆 Leaderboard Update', color: 'text-orange-400' },
  { value: 'alert.triggered', label: '⚠️ Alert Triggered', color: 'text-violet-400' },
  { value: 'alert.failed', label: '❌ Alert Failed', color: 'text-red-400' }
];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState('');
  const [registeredSecret, setRegisteredSecret] = useState<string>('');

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/webhooks/list');
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerWebhook = async () => {
    if (!formUrl || formEvents.length === 0) {
      setError('Please fill in URL and select at least one event');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
          description: formDescription
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRegisteredSecret(data.webhook.secret);
        fetchWebhooks();
        setShowRegisterForm(false);
        // Reset form
        setFormUrl('');
        setFormEvents([]);
        setFormDescription('');
        setSuccess('Webhook registered successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to register webhook');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error: any) {
      console.error('Error registering webhook:', error);
      setError(error.message || 'Failed to register webhook');
      setTimeout(() => setError(null), 5000);
    }
  };

  const deleteWebhook = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/webhooks/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
        setSuccess('Webhook deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete webhook');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      setError(error.message || 'Failed to delete webhook');
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleWebhook = async (id: number, active: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active })
      });

      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
        setSuccess(`Webhook ${active ? 'disabled' : 'enabled'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to toggle webhook');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error: any) {
      console.error('Error toggling webhook:', error);
      setError(error.message || 'Failed to toggle webhook');
      setTimeout(() => setError(null), 5000);
    }
  };

  const testWebhook = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/webhooks/${id}/test`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Test webhook delivered successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`Test failed: ${data.message}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      setError(error.message || 'Failed to test webhook');
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleEventSelection = (event: string) => {
    setFormEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-cyan-400">Loading webhooks...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm border border-red-400 text-white px-6 py-4 rounded-lg shadow-2xl animate-fadeIn max-w-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm text-white/90">{error}</p>
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/90 backdrop-blur-sm border border-green-400 text-white px-6 py-4 rounded-lg shadow-2xl animate-fadeIn max-w-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm text-white/90">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Webhook className="w-8 h-8 text-cyan-400" />
            Webhook Management
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time push notifications for Make.com, Zapier, n8n
          </p>
        </div>
        
        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          {showRegisterForm ? 'Cancel' : '+ Register Webhook'}
        </button>
      </div>

      {/* Registration Form */}
      {showRegisterForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Register New Webhook</h2>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Webhook URL *</label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://hooks.make.com/xxxxxxxxx"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Discord whale alerts bot"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Events to Subscribe *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_EVENTS.map(event => (
                <button
                  key={event.value}
                  onClick={() => toggleEventSelection(event.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formEvents.includes(event.value)
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div className={`font-semibold ${formEvents.includes(event.value) ? 'text-white' : event.color}`}>
                    {event.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{event.value}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={registerWebhook}
            className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Register Webhook
          </button>
        </div>
      )}

      {/* Secret Display */}
      {registeredSecret && (
        <div className="bg-green-900/20 border-2 border-green-500 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Webhook Registered Successfully!
            </h3>
            <button
              onClick={() => setRegisteredSecret('')}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-300 mb-3">
            Save this secret for signature verification. You won't be able to see it again.
          </p>
          
          <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-3">
            <code className="flex-1 text-cyan-400 text-sm font-mono overflow-x-auto">
              {registeredSecret}
            </code>
            <button
              onClick={() => copyToClipboard(registeredSecret)}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          Active Webhooks ({webhooks.length})
        </h2>

        {webhooks.length === 0 ? (
          <div className="bg-gray-800/30 rounded-xl p-12 text-center">
            <Webhook className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No webhooks registered yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Register your first webhook to receive real-time notifications
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {webhook.description || 'Unnamed Webhook'}
                      </h3>
                      {webhook.active ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    
                    <code className="text-sm text-gray-400 break-all">
                      {webhook.url}
                    </code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testWebhook(webhook.id)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                      title="Test webhook"
                    >
                      <TestTube className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleWebhook(webhook.id, webhook.active)}
                      className={`p-2 rounded ${
                        webhook.active
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                      title={webhook.active ? 'Disable' : 'Enable'}
                    >
                      {webhook.active ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      title="Delete webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {webhook.events.map(event => {
                    const eventConfig = AVAILABLE_EVENTS.find(e => e.value === event);
                    return (
                      <span
                        key={event}
                        className="px-3 py-1 bg-gray-900 rounded-full text-xs text-gray-300"
                      >
                        {eventConfig?.label || event}
                      </span>
                    );
                  })}
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(webhook.created_at).toLocaleString()} • 
                  Last triggered: {webhook.last_triggered 
                    ? new Date(webhook.last_triggered).toLocaleString()
                    : 'Never'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
