import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, PlayCircle, Power, PowerOff } from 'lucide-react';
import { api } from '../services/api';
import type { Alert, AlertEventType, CreateAlertRequest } from '../services/api';

const EVENT_TYPE_LABELS: Record<AlertEventType, string> = {
  'volume.spike': 'Volume Spike',
  'whale.buy': 'Whale Buy',
  'holder.surge': 'Holder Surge',
};

const EVENT_TYPE_COLORS: Record<AlertEventType, string> = {
  'volume.spike': 'text-yellow-400',
  'whale.buy': 'text-cyan-400',
  'holder.surge': 'text-green-400',
};

export function AlertsManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAlertRequest>({
    name: '',
    description: '',
    event_type: 'volume.spike',
    conditions: {
      token: 'QMINE',
      period_minutes: 60,
      threshold_percent: 150,
      min_volume: '250000',
    },
    actions: [{ type: 'webhook', event: 'alert.triggered' }],
    active: true,
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.listAlerts();
      setAlerts(data);
    } catch (error: any) {
      console.error('Failed to load alerts:', error);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createAlert(formData);
      await loadAlerts();
      setShowModal(false);
      resetForm();
      setSuccess('Alert created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to create alert:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUpdate = async () => {
    if (!editingAlert) return;
    try {
      await api.updateAlert(editingAlert.id, formData);
      await loadAlerts();
      setShowModal(false);
      setEditingAlert(null);
      resetForm();
      setSuccess('Alert updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to update alert:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      await api.deleteAlert(id);
      await loadAlerts();
      setSuccess('Alert deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to delete alert:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    try {
      await api.updateAlert(alert.id, { active: !alert.active });
      await loadAlerts();
      setSuccess(`Alert ${alert.active ? 'deactivated' : 'activated'}!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to toggle alert:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTest = async (id: number) => {
    try {
      setTestingId(id);
      const result = await api.testAlert(id);
      if (result.triggered) {
        setSuccess(`Alert triggered! Found ${result.payload?.trades?.length || 'data'}`);
      } else {
        setError(`Alert not triggered: ${result.reason || 'Conditions not met'}`);
      }
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error: any) {
      console.error('Failed to test alert:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Test failed';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setTestingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingAlert(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      description: alert.description || '',
      event_type: alert.event_type,
      conditions: alert.conditions,
      actions: alert.actions,
      active: alert.active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      event_type: 'volume.spike',
      conditions: {
        token: 'QMINE',
        period_minutes: 60,
        threshold_percent: 150,
        min_volume: '250000',
      },
      actions: [{ type: 'webhook', event: 'alert.triggered' }],
      active: true,
    });
  };

  const updateCondition = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value },
    }));
  };

  const renderConditionFields = () => {
    switch (formData.event_type) {
      case 'volume.spike':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Token</label>
              <input
                type="text"
                value={formData.conditions.token || ''}
                onChange={(e) => updateCondition('token', e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="QMINE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Period (minutes)</label>
              <input
                type="number"
                value={formData.conditions.period_minutes || 60}
                onChange={(e) => updateCondition('period_minutes', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="5"
                max="2880"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Threshold (%)</label>
              <input
                type="number"
                value={formData.conditions.threshold_percent || 150}
                onChange={(e) => updateCondition('threshold_percent', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="10"
                max="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Min Volume</label>
              <input
                type="text"
                value={formData.conditions.min_volume || '0'}
                onChange={(e) => updateCondition('min_volume', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="250000"
              />
            </div>
          </>
        );
      case 'whale.buy':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Token</label>
              <input
                type="text"
                value={formData.conditions.token || ''}
                onChange={(e) => updateCondition('token', e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="QMINE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Lookback (minutes)</label>
              <input
                type="number"
                value={formData.conditions.lookback_minutes || 60}
                onChange={(e) => updateCondition('lookback_minutes', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="5"
                max="1440"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Min Value</label>
              <input
                type="text"
                value={formData.conditions.min_value || '0'}
                onChange={(e) => updateCondition('min_value', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Limit</label>
              <input
                type="number"
                value={formData.conditions.limit || 5}
                onChange={(e) => updateCondition('limit', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="1"
                max="20"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.conditions.whales_only ?? true}
                onChange={(e) => updateCondition('whales_only', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-white/70">Whales Only</label>
            </div>
          </>
        );
      case 'holder.surge':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Token</label>
              <input
                type="text"
                value={formData.conditions.token || ''}
                onChange={(e) => updateCondition('token', e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="QMINE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Lookback (minutes)</label>
              <input
                type="number"
                value={formData.conditions.lookback_minutes || 120}
                onChange={(e) => updateCondition('lookback_minutes', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="10"
                max="2880"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Min New Holders</label>
              <input
                type="number"
                value={formData.conditions.min_new_holders || 5}
                onChange={(e) => updateCondition('min_new_holders', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="1"
                max="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Sample Size</label>
              <input
                type="number"
                value={formData.conditions.sample_size || 5}
                onChange={(e) => updateCondition('sample_size', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="1"
                max="25"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
              <Bell className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Alert Engine</h1>
              <p className="text-white/50 text-sm">Configure smart alerts and webhooks</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-violet-500/30"
          >
            <Plus className="w-5 h-5" />
            New Alert
          </button>
        </div>

        {/* Alerts Table */}
        {loading ? (
          <div className="text-center text-white/50 py-12">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No alerts configured yet</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-violet-400 hover:text-violet-300 font-medium"
            >
              Create your first alert →
            </button>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/70">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/70">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/70">Token</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/70">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/70">Triggers</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{alert.name}</p>
                        {alert.description && (
                          <p className="text-white/40 text-sm">{alert.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${EVENT_TYPE_COLORS[alert.event_type]}`}>
                        {EVENT_TYPE_LABELS[alert.event_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm font-mono">
                        {alert.conditions.token || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {alert.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs font-medium">
                          <Power className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-medium">
                          <PowerOff className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm">{alert.trigger_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTest(alert.id)}
                          disabled={testingId === alert.id}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                          title="Test Alert"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(alert)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                          title={alert.active ? 'Deactivate' : 'Activate'}
                        >
                          {alert.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(alert)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingAlert ? 'Edit Alert' : 'Create New Alert'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Alert Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g., QMINE Volume Spike"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({ ...formData, event_type: e.target.value as AlertEventType })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="volume.spike">Volume Spike</option>
                    <option value="whale.buy">Whale Buy</option>
                    <option value="holder.surge">Holder Surge</option>
                  </select>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-white font-semibold mb-4">Conditions</h3>
                  <div className="space-y-4">{renderConditionFields()}</div>
                </div>

                <div className="flex items-center pt-4">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm text-white/70">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingAlert(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAlert ? handleUpdate : handleCreate}
                  className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
