import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const FEEDBACK_TYPES = [
  { value: 'missing_feature', label: 'Missing feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'confusing_ux', label: 'Confusing UX' },
  { value: 'love_it', label: 'Love it' },
  { value: 'other', label: 'Other' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onToast }) => {
  const [type, setType] = useState('missing_feature');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text: text.trim() }),
      });

      if (response.ok) {
        onToast('Feedback submitted, thank you!', 'success');
        onClose();
      } else {
        const data = await response.json();
        onToast(data.error || 'Failed to submit feedback', 'error');
      }
    } catch {
      onToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Give Feedback</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {FEEDBACK_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details ({text.length}/1000)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
              placeholder="Tell us what you think..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50 font-medium"
            >
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
