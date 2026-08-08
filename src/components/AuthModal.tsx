import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Key, Lock, Copy, Check, RefreshCw, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { generateStrongPassword, calculatePasswordEntropy } from '../utils/crypto';
import { User } from '../types/mrp';

interface AuthModalProps {
  isOpen: boolean;
  initialTab: 'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY';
  onClose: () => void;
  currentUser: User;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialTab, onClose, currentUser, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY'>(initialTab);

  // Email OTP States
  const [emailInput, setEmailInput] = useState(currentUser.email);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSentPreview, setOtpSentPreview] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // 2FA States
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpSuccess, setTotpSuccess] = useState(false);

  // Password Generator States
  const [passLength, setPassLength] = useState(18);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incNumbers, setIncNumbers] = useState(true);
  const [incSymbols, setIncSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generateStrongPassword({ length: 18, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true })
  );
  const [copied, setCopied] = useState(false);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser.email);
  const [recoverySent, setRecoverySent] = useState(false);

  if (!isOpen) return null;

  // Handle Password Regeneration
  const handleRegeneratePassword = () => {
    const newPass = generateStrongPassword({
      length: passLength,
      includeUppercase: incUpper,
      includeLowercase: incLower,
      includeNumbers: incNumbers,
      includeSymbols: incSymbols,
    });
    setGeneratedPassword(newPass);
    setCopied(false);
  };

  const entropy = calculatePasswordEntropy(generatedPassword);

  // Dispatch Email OTP API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccessMessage('');
    setIsOtpLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSentPreview(data.otpPreviewForDemo);
      setOtpSuccessMessage(`OTP code dispatched to ${emailInput}.`);
    } catch (err: any) {
      setOtpError(err.message || 'Error requesting OTP');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Verify OTP Code API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsOtpLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, code: otpCodeInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      if (data.isTwoFactorRequired) {
        setActiveTab('TWO_FACTOR');
      } else {
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Verify 2FA TOTP API
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpInput, userEmail: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA Failed');

      setTotpSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setTotpError(err.message || '2FA code invalid');
    }
  };

  // Handle Copy Password
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Identity & Security Authentication</h2>
              <p className="text-xs text-slate-400">OTP Login, 2FA Verification & Strong Password Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs">
          <button
            onClick={() => setActiveTab('OTP')}
            className={`flex-1 py-3 font-medium border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'OTP'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP Login</span>
          </button>

          <button
            onClick={() => setActiveTab('TWO_FACTOR')}
            className={`flex-1 py-3 font-medium border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'TWO_FACTOR'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>2FA Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('PASSWORD_GEN')}
            className={`flex-1 py-3 font-medium border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PASSWORD_GEN'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Password Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('RECOVERY')}
            className={`flex-1 py-3 font-medium border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'RECOVERY'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Recovery</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* TAB 1: EMAIL OTP VERIFICATION */}
          {activeTab === 'OTP' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200">
                <p className="font-semibold text-indigo-300 mb-1">State-Driven Email OTP Auth Process</p>
                <p>
                  Enter your registered factory email address to receive a secure 6-digit One-Time Password (OTP) with 5-minute expiry.
                </p>
              </div>

              {otpError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccessMessage && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl">
                  <p className="font-medium text-emerald-300">{otpSuccessMessage}</p>
                  {otpSentPreview && (
                    <div className="mt-2 p-2 bg-slate-900 border border-emerald-700/50 rounded-lg flex items-center justify-between font-mono">
                      <span className="text-slate-400 text-[11px]">Demo OTP Token:</span>
                      <strong className="text-emerald-400 text-base tracking-widest">{otpSentPreview}</strong>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      placeholder="user@factory-mrp.com"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isOtpLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      {isOtpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="pt-3 border-t border-slate-800">
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit OTP Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!otpCodeInput || isOtpLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Verify OTP & Proceed to 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: TWO-FACTOR AUTHENTICATION (2FA) */}
          {activeTab === 'TWO_FACTOR' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-300">Mandatory 2FA Security Challenge</p>
                  <p className="mt-0.5">Enter the 6-digit TOTP code from your Google Authenticator or YubiKey hardware token.</p>
                </div>
              </div>

              {totpError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{totpError}</span>
                </div>
              )}

              {totpSuccess && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Two-Factor Authentication Verified! Launching ERP Session...</span>
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">TOTP Authenticator Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpInput}
                    onChange={(e) => setTotpInput(e.target.value)}
                    placeholder="e.g. 884920"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-center text-xl font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Tip for demo: Enter any 6-digit number (e.g. 884920)</p>
                </div>

                <button
                  type="submit"
                  disabled={totpInput.length !== 6}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow transition disabled:opacity-50"
                >
                  Confirm 2FA Verification
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: STRONG PASSWORD GENERATOR */}
          {activeTab === 'PASSWORD_GEN' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Cryptographically Strong Password:</span>
                  <button
                    onClick={handleRegeneratePassword}
                    className="p-1 text-slate-400 hover:text-indigo-400 transition"
                    title="Generate New Password"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-sm text-amber-300 break-all select-all">
                  <span className="flex-1">{generatedPassword}</span>
                  <button
                    onClick={handleCopyPassword}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-sans transition flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Entropy Meter */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Entropy Score: {entropy.score}% ({entropy.bits} bits)</span>
                    <span
                      className={`font-bold ${
                        entropy.label === 'EXCELLENT'
                          ? 'text-emerald-400'
                          : entropy.label === 'STRONG'
                          ? 'text-indigo-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {entropy.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        entropy.score > 75 ? 'bg-emerald-500' : entropy.score > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${entropy.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Password Policy Customizer */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Security Policy Parameters</h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Password Length:</span>
                    <strong className="text-white">{passLength} characters</strong>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={64}
                    value={passLength}
                    onChange={(e) => {
                      setPassLength(Number(e.target.value));
                      handleRegeneratePassword();
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incUpper}
                      onChange={(e) => {
                        setIncUpper(e.target.checked);
                        handleRegeneratePassword();
                      }}
                      className="rounded accent-indigo-500"
                    />
                    <span>Uppercase (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incLower}
                      onChange={(e) => {
                        setIncLower(e.target.checked);
                        handleRegeneratePassword();
                      }}
                      className="rounded accent-indigo-500"
                    />
                    <span>Lowercase (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incNumbers}
                      onChange={(e) => {
                        setIncNumbers(e.target.checked);
                        handleRegeneratePassword();
                      }}
                      className="rounded accent-indigo-500"
                    />
                    <span>Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incSymbols}
                      onChange={(e) => {
                        setIncSymbols(e.target.checked);
                        handleRegeneratePassword();
                      }}
                      className="rounded accent-indigo-500"
                    />
                    <span>Symbols (!@#$%)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD RECOVERY */}
          {activeTab === 'RECOVERY' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">Encrypted Password Reset Workflow</p>
                <p>
                  Submit your corporate email address to receive an E2E encrypted recovery key and reset instructions.
                </p>
              </div>

              {recoverySent ? (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl">
                  Password reset link with E2E encrypted token sent to <strong>{recoveryEmail}</strong>.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRecoverySent(true);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs shadow transition"
                  >
                    Send Encrypted Recovery Token
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
