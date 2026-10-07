import React, { useState } from 'react';

/**
 * Create-room form (extracted from HushroomLandingPage 2026-08-23 to keep
 * that file under the 1200-line CI guard).
 *
 * `onCreateRoom` resolves to `null` on success or an error message string
 * (e.g. a backend validation message) which is shown inline under the
 * relevant field instead of only as a toast.
 */
export const NAME_HINT = 'Letters, numbers, spaces, - and _';

export const CreateRoomForm: React.FC<{
  onCreateRoom: (userName: string, roomName: string, maxParticipants: number, duration: number) => Promise<string | null | void>;
  onCancel: () => void;
}> = ({ onCreateRoom, onCancel }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim().length < 2 || userName.trim().length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const result = await onCreateRoom(userName.trim(), roomName.trim(), maxParticipants, duration);
      if (typeof result === 'string' && result) setError(result);
    } finally {
      setLoading(false);
    }
  };

  // Backend name-validation errors mention "Name"; everything else is shown
  // above the buttons as a general error.
  const nameError = error && /^name\b/i.test(error) ? error : null;
  const generalError = error && !nameError ? error : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="create-room-name-input" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name
        </label>
        <input
          id="create-room-name-input"
          type="text"
          value={userName}
          onChange={(e) => { setUserName(e.target.value); if (error) setError(null); }}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
            nameError ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Enter your name..."
          required
          minLength={2}
          maxLength={50}
          aria-invalid={!!nameError}
          aria-describedby="create-room-name-hint"
        />
        <p
          id="create-room-name-hint"
          role={nameError ? 'alert' : undefined}
          className={`text-xs mt-1 ${nameError ? 'text-red-600' : 'text-gray-400'}`}
        >
          {nameError || NAME_HINT}
        </p>
      </div>
      <div>
        <label htmlFor="create-room-roomname-input" className="block text-sm font-medium text-gray-700 mb-2">
          Room Name
        </label>
        <input
          id="create-room-roomname-input"
          type="text"
          value={roomName}
          onChange={(e) => { setRoomName(e.target.value); if (error) setError(null); }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Trip planning, Team meeting..."
          required
          minLength={2}
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Participants: {maxParticipants}
        </label>
        <input
          type="range"
          min={2}
          max={12}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          className="w-full"
          aria-label="Max participants"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>2</span>
          <span>12</span>
        </div>
      </div>

      <div>
        <label htmlFor="create-room-duration" className="block text-sm font-medium text-gray-700 mb-2">
          Duration
        </label>
        <select
          id="create-room-duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
          <option value={180}>3 hours</option>
          <option value={240}>4 hours</option>
        </select>
      </div>

      {generalError && (
        <p role="alert" className="text-sm text-red-600">{generalError}</p>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || userName.trim().length < 2 || roomName.trim().length < 2}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </form>
  );
};
