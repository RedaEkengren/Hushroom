import React, { useState, useRef, useEffect } from 'react';
import { Flag } from 'lucide-react';

interface ReportButtonProps {
  roomId: string;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const REPORT_TYPES = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'illegal', label: 'Illegal content' },
  { value: 'other', label: 'Other' },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]['value'];

/**
 * POST /api/report. Requires the room-bound JWT (added by jwt-wrapper's fetch
 * interceptor) — guests have one as soon as they've joined via /api/join-room,
 * so any participant can report. Shared by ReportButton (desktop) and the
 * mobile "…" menu in RoomView.
 */
export async function submitReport(
  roomId: string,
  type: ReportType,
  onToast: (message: string, type: 'success' | 'error' | 'info') => void,
): Promise<void> {
  try {
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, type }),
    });

    if (response.ok) {
      onToast('Report submitted, thank you', 'success');
    } else {
      const data = await response.json().catch(() => ({}));
      onToast(data.error || 'Failed to submit report', 'error');
    }
  } catch {
    onToast('Network error', 'error');
  }
}

export const ReportButton: React.FC<ReportButtonProps> = ({ roomId, onToast }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleReport = async (type: ReportType) => {
    setSubmitting(true);
    try {
      await submitReport(roomId, type, onToast);
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Report abuse"
        aria-label="Report abuse"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={submitting}
      >
        <Flag size={14} />
        <span className="hidden sm:inline">Report</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
          <p className="px-3 py-1 text-xs text-gray-400 font-medium">Report as:</p>
          {REPORT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleReport(value)}
              disabled={submitting}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
