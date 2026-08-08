import React, { useState } from 'react';
import { ArrowRight, Shield, Lock, Mail, ShieldAlert, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react';
import { Role } from '../types/mrp';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onLoginSuccess: (userData: { uid?: string; name: string; email: string; role: Role; department: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'form' | 'otp_verify'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ADMIN');
  const [otpCode, setOtpCode] = useState('');
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [modalDetails, setModalDetails] = useState({ title: '', message: '' });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Password Strength Checker
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak (min 6 chars)', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Medium Password', color: 'bg-blue-500' };
    return { score, label: 'Strong Password ✓', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resetEmailInput.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setStatusMessage({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    setIsSendingReset(true);
    setStatusMessage(null);

    try {
      await sendPasswordResetEmail(auth, targetEmail);
    } catch (err: any) {
      console.warn('Password reset notice:', err?.message);
    } finally {
      setIsSendingReset(false);
      setShowForgotPasswordModal(false);
      setModalDetails({
        title: 'Password Reset Email Sent!',
        message: `An official password reset & verification email has been dispatched to ${targetEmail}. Please check your Gmail inbox or Spam folder.`
      });
      setShowEmailSentModal(true);
    }
  };

  const sendOtpToUserEmail = async (targetEmail: string) => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to dispatch OTP email.' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error sending OTP.' };
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatusMessage({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setStatusMessage({ text: 'Please enter your full name.', isError: true });
        return;
      }
      if (password.length < 6) {
        setStatusMessage({ text: 'Password must be at least 6 characters long.', isError: true });
        return;
      }
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    // If signing in, validate credentials with Firebase FIRST before dispatching OTP!
    if (mode === 'signin') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        setIsSubmitting(false);
        console.warn('Firebase signin validation failed:', signInErr?.code, signInErr?.message);
        
        let errorMsg = 'Invalid email or password. Please check your credentials or click "Create Account".';
        if (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential') {
          errorMsg = 'No account found with these credentials or password is incorrect. Please check or create an account.';
        } else if (signInErr?.code === 'auth/wrong-password') {
          errorMsg = 'Incorrect password. Please try again or click "Forgot Password?".';
        } else if (signInErr?.code === 'auth/invalid-email') {
          errorMsg = 'Invalid email address format.';
        } else if (signInErr?.code === 'auth/too-many-requests') {
          errorMsg = 'Access temporarily blocked due to multiple failed login attempts. Try again later or reset password.';
        }

        setStatusMessage({ text: errorMsg, isError: true });
        return; // BLOCK! Do NOT dispatch OTP or sign in.
      }
    }

    // Dispatch Gmail OTP verification code
    const otpResult = await sendOtpToUserEmail(email);
    setIsSubmitting(false);

    if (otpResult.success) {
      setStep('otp_verify');
      setOtpCode('');
      setModalDetails({
        title: 'Verification OTP Email Sent!',
        message: `A 6-digit verification code was sent to ${email}. Please check your Gmail inbox (or Spam folder) and enter the code to proceed.`
      });
      setShowEmailSentModal(true);
      setStatusMessage({
        text: `Verification code sent to ${email}. Check your inbox!`,
        isError: false,
      });
    } else {
      setStatusMessage({ text: otpResult.message, isError: true });
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setStatusMessage(null);
    const result = await sendOtpToUserEmail(email);
    setIsResendingOtp(false);

    if (result.success) {
      setModalDetails({
        title: 'New Verification Code Dispatched!',
        message: `A fresh 6-digit OTP passcode has been sent to ${email}. Check your Gmail inbox!`
      });
      setShowEmailSentModal(true);
      setStatusMessage({
        text: `New OTP verification code sent to ${email}. Check your Gmail!`,
        isError: false,
      });
    } else {
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.trim().length < 4) {
      setStatusMessage({ text: 'Please enter the verification OTP code sent to your Gmail.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Verify OTP with backend
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode.trim() }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setStatusMessage({ text: verifyData.error || 'Invalid or expired OTP code. Please try again.', isError: true });
        setIsSubmitting(false);
        return;
      }

      // 2. OTP is verified! Now complete Firebase Authentication & Registration
      const getDepartmentByRole = (r: Role) => {
        return r === 'ADMIN' ? 'Executive HQ' : r === 'PLANT_MANAGER' ? 'Plant Operations' : r === 'SHOP_FLOOR_OPERATOR' ? 'Shop Floor' : 'Finance & Accounting';
      };

      const dept = getDepartmentByRole(role);
      const userName = fullName || email.split('@')[0] || 'User';

      let userUid = '';
      let userEmail = email;
      let userRole = role;
      let userDept = dept;
      let resolvedName = userName;

      if (mode === 'signup') {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          userUid = userCred.user.uid;
          userEmail = userCred.user.email || email;

          try {
            await sendEmailVerification(userCred.user);
          } catch (verErr) {
            console.warn('Firebase email verification notice:', verErr);
          }

          await setDoc(doc(db, 'users', userUid), {
            uid: userUid,
            name: userName,
            email: userEmail,
            role,
            department: dept,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });

          onLoginSuccess({
            uid: userUid,
            name: resolvedName,
            email: userEmail,
            role,
            department: dept,
          });
        } catch (signUpErr: any) {
          console.warn('Firebase signup error:', signUpErr?.code, signUpErr?.message);
          let msg = 'Failed to create account. Please check your details.';
          if (signUpErr?.code === 'auth/email-already-in-use') {
            msg = 'This email address is already registered. Please switch to Sign In.';
          } else if (signUpErr?.code === 'auth/weak-password') {
            msg = 'Password is too weak. Please use at least 6 characters.';
          } else if (signUpErr?.code === 'auth/invalid-email') {
            msg = 'Invalid email address format.';
          }
          setStatusMessage({ text: msg, isError: true });
          setIsSubmitting(false);
          return; // DO NOT LOG IN IF CREATION FAILS!
        }

      } else {
        // Sign In Flow
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          userUid = userCred.user.uid;
          userEmail = userCred.user.email || email;

          const userDoc = await getDoc(doc(db, 'users', userUid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userRole = data.role || userRole;
            userDept = data.department || userDept;
            resolvedName = data.name || resolvedName;

            setDoc(doc(db, 'users', userUid), { lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
          }

          onLoginSuccess({
            uid: userUid,
            name: resolvedName,
            email: userEmail,
            role: userRole,
            department: userDept,
          });
        } catch (signInErr: any) {
          console.warn('Firebase signin error:', signInErr?.code, signInErr?.message);
          setStatusMessage({ text: 'Sign in failed: Invalid credentials or account does not exist.', isError: true });
          setIsSubmitting(false);
          return; // DO NOT LOG IN IF SIGNIN FAILS!
        }
      }
    } catch (err: any) {
      console.error('Auth verification error:', err);
      setStatusMessage({ text: 'Authentication failed. Please check credentials and try again.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 shadow-md border border-slate-200 rounded-lg space-y-6">
        
        {/* Header Branding */}
        <div className="text-center pt-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manufacturing ERP Platform</h1>
          <p className="text-xs text-slate-500 mt-1">Enterprise Management Portal</p>
        </div>

        {step === 'form' ? (
          <>
            {/* Mode Toggle Bar (Sign In / Create Account) */}
            <div className="flex rounded-md bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => { setMode('signin'); setStatusMessage(null); }}
                className={`flex-1 rounded px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setStatusMessage(null); }}
                className={`flex-1 rounded px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required={mode === 'signup'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="input-style"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-style"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmailInput(email);
                      setShowForgotPasswordModal(true);
                      setStatusMessage(null);
                    }}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-style"
                />
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score <= 2 ? 'bg-amber-500 w-1/3' : strength.score <= 4 ? 'bg-blue-500 w-2/3' : 'bg-emerald-600 w-full'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Select Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="input-style bg-white text-slate-900 font-medium"
                >
                  <option value="ADMIN">Admin (Full System Access)</option>
                  <option value="PLANT_MANAGER">Manager (MRP Production Control)</option>
                  <option value="SHOP_FLOOR_OPERATOR">Operator (Shop Floor Execution)</option>
                  <option value="PROCUREMENT_OFFICER">Accountant (Accounts & Finance)</option>
                </select>
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
                  statusMessage.isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {statusMessage.isError ? <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-600" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 font-semibold text-sm transition mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Sending OTP to Gmail...' : mode === 'signup' ? 'Request Gmail OTP & Register' : 'Request Gmail OTP & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Account Switch Prompt */}
            <div className="text-center pt-1">
              {mode === 'signin' ? (
                <p className="text-xs text-slate-600 font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold underline text-slate-900 hover:text-slate-700 cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 font-medium">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="font-bold underline text-slate-900 hover:text-slate-700 cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </>
        ) : (
          /* STEP 2: GMAIL OTP VERIFICATION SCREEN */
          <form onSubmit={handleVerifyOtpAndProceed} className="space-y-5 text-left">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white mb-1">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Gmail OTP Verification</h2>
              <p className="text-xs text-slate-600">
                A 6-digit verification passcode was sent to:
                <br />
                <strong className="text-slate-900 font-semibold">{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Enter 6-Digit Verification Code</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-lg font-bold font-mono py-2.5 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
                statusMessage.isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {statusMessage.isError ? <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-600" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Verifying OTP Code...' : 'Verify OTP & Complete Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? 'animate-spin' : ''}`} />
                <span>{isResendingOtp ? 'Sending...' : 'Resend Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setStatusMessage(null);
                }}
                className="text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
              >
                Change Email / Back
              </button>
            </div>
          </form>
        )}

      </div>

      {/* POPUP MODAL: Forgot Password */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Forgot Your Password?</h3>
              <p className="text-xs text-slate-600">
                Enter your registered Gmail address below. We will send you an official password reset link.
              </p>
            </div>

            <form onSubmit={handleSendPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Your Gmail Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmailInput}
                  onChange={(e) => setResetEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="input-style"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSendingReset ? 'Sending Email...' : 'Send Reset Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Email Sent Confirmation */}
      {showEmailSentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{modalDetails.title || 'Verification Email Dispatched!'}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {modalDetails.message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowEmailSentModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-md"
              >
                Got It & Check Gmail Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

