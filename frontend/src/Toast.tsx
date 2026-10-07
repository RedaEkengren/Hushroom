import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType | string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div className={`
    fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg
    ${type === 'error' ? 'bg-red-500 text-white' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-blue-500 text-white'}
    transition-all duration-300 animate-slide-in-right
  `}>
    <div className="flex items-center gap-2">
      {type === 'error' && <AlertCircle size={16} />}
      {type === 'success' && <CheckCircle2 size={16} />}
      {type === 'info' && <Loader2 size={16} className="animate-spin" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  </div>
);
