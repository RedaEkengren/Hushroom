import React, { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { setToken } from './jwt-wrapper';

type VerificationState = 'email-input' | 'sending' | 'code-input' | 'verifying' | 'verified' | 'error';

interface EmailVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
  planLabel?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ onVerified, onCancel, planLabel }) => {
  const [state, setState] = useState<VerificationState>('email-input');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first code input when entering code state
  useEffect(() => {
    if (state === 'code-input') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [state]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState('sending');
    setError('');

    try {
      const response = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setState('code-input');
        setCode(['', '', '', '', '', '']);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send code');
        setState('error');
      }
    } catch {
      setError('Network error');
      setState('error');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    // Focus the next empty input or last input
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();

    // Auto-submit if all 6 pasted
    if (pasted.length === 6) {
      submitCode(pasted);
    }
  };

  const submitCode = async (fullCode: string) => {
    setState('verifying');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        setState('verified');
        setTimeout(() => onVerified(), 1000);
      } else {
        setError(data.error || 'Invalid code');
        setState('code-input');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Network error');
      setState('code-input');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-8 w-full max-w-md">
        {state === 'email-input' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
                <p className="text-sm text-gray-500">Required to create an end-to-end encrypted room</p>
              </div>
            </div>
            {planLabel && (
              <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                Signing up for: {planLabel}
              </div>
            )}

            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 font-medium"
                >
                  Send code
                </button>
              </div>
            </form>

            <div className="text-xs text-gray-400 mt-4 text-center space-y-1">
              <p className="font-medium text-gray-500">Why do we need your email?</p>
              <p>Email verification prevents abuse and spam. Only room creators need to verify. Participants join anonymously.</p>
              <p>Your email is stored as a one-way hash (SHA-256) for 30 days, then automatically deleted. We never see or store your actual email address.</p>
            </div>
          </>
        )}

        {state === 'sending' && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
            <p className="text-gray-600">Sending verification code...</p>
          </div>
        )}

        {state === 'code-input' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-emerald-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter verification code</h2>
            <p className="text-gray-600 mb-6">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              ))}
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Code expires in 10 minutes
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => { setState('email-input'); setError(''); setCode(['', '', '', '', '', '']); }}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft size={16} />
                Change email
              </button>
              <button
                onClick={handleSubmitEmail as any}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {state === 'verifying' && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
            <p className="text-gray-600">Verifying...</p>
          </div>
        )}

        {state === 'verified' && (
          <div className="text-center py-8">
            <CheckCircle2 className="text-emerald-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-600">You can now create rooms.</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => { setState('email-input'); setError(''); }}
              className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
