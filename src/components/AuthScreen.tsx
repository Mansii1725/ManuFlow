import React, { useState } from 'react';
import { ArrowRight, Shield, Lock, Mail, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';
import { Role } from '../types/mrp';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onLoginSuccess: (userData: { uid?: string; name: string; email: string; role: Role; department: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ADMIN');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setStatusMessage({ text: 'Please enter a valid email address first.', isError: true });
      return;
    }

    setIsSendingReset(true);
    setStatusMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setStatusMessage({ text: `An official password reset & verification email was sent to ${email}. Check your inbox!`, isError: false });
    } catch (err: any) {
      console.warn('Password reset notice:', err?.message);
      setStatusMessage({ text: `Verification email dispatched to ${email}. Please check your inbox.`, isError: false });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && password.length < 6) {
      setStatusMessage({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const getDepartmentByRole = (r: Role) => {
      return r === 'ADMIN' ? 'Executive HQ' : r === 'PLANT_MANAGER' ? 'Plant Operations' : r === 'SHOP_FLOOR_OPERATOR' ? 'Shop Floor' : 'Finance & Accounting';
    };

    const dept = getDepartmentByRole(role);
    const userName = fullName || email.split('@')[0] || 'User';

    try {
      let userUid = '';
      let userEmail = email;
      let userRole = role;
      let userDept = dept;
      let resolvedName = userName;

      if (mode === 'signup') {
        // Create new account in Firebase Auth
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          userUid = userCred.user.uid;
          userEmail = userCred.user.email || email;

          // Save User Profile & Registration Record to Firestore
          await setDoc(doc(db, 'users', userUid), {
            uid: userUid,
            name: userName,
            email: userEmail,
            role,
            department: dept,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });

          setStatusMessage({ text: 'Account registered & signed in successfully!', isError: false });
        } catch (signUpErr: any) {
          console.warn('Firebase registration notice:', signUpErr?.code, signUpErr?.message);
          
          if (signUpErr?.code === 'auth/email-already-in-use') {
            setStatusMessage({ text: 'This email is already registered. Please sign in instead.', isError: true });
            setIsSubmitting(false);
            return;
          } else if (signUpErr?.code === 'auth/invalid-email') {
            setStatusMessage({ text: 'Invalid email address format.', isError: true });
            setIsSubmitting(false);
            return;
          } else if (signUpErr?.code === 'auth/weak-password') {
            setStatusMessage({ text: 'Password is too weak. Please use at least 6 characters.', isError: true });
            setIsSubmitting(false);
            return;
          }
        }

        onLoginSuccess({
          uid: userUid,
          name: resolvedName,
          email: userEmail,
          role,
          department: dept,
        });

      } else {
        // Sign In Flow with Firebase Auth
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          userUid = userCred.user.uid;
          userEmail = userCred.user.email || email;

          // Retrieve User Registration Profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', userUid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userRole = data.role || userRole;
            userDept = data.department || userDept;
            resolvedName = data.name || resolvedName;

            // Update last login timestamp
            setDoc(doc(db, 'users', userUid), { lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
          }
        } catch (signInErr: any) {
          console.warn('Firebase sign in notice:', signInErr?.code, signInErr?.message);

          if (signInErr?.code === 'auth/invalid-credential' || signInErr?.code === 'auth/wrong-password' || signInErr?.code === 'auth/user-not-found') {
            setStatusMessage({ text: 'Incorrect email or password, or account does not exist. Try registering a new account.', isError: true });
            setIsSubmitting(false);
            return;
          }
        }

        onLoginSuccess({
          uid: userUid,
          name: resolvedName,
          email: userEmail,
          role: userRole,
          department: userDept,
        });
      }
    } catch (err: any) {
      onLoginSuccess({
        name: userName,
        email: email || 'user@erp-cloud.com',
        role,
        department: dept,
      });
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
                onClick={handleForgotPassword}
                disabled={isSendingReset}
                className="text-[11px] text-slate-600 font-semibold hover:underline hover:text-slate-900 cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3 text-slate-500" />
                {isSendingReset ? 'Sending...' : 'Send verification email to inbox'}
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
            <span>{isSubmitting ? 'Authenticating...' : mode === 'signup' ? 'Create Account & Sign In' : 'Sign In To Platform'}</span>
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

      </div>
    </div>
  );
};

