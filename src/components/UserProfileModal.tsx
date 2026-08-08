import React from 'react';
import { User, ShieldCheck, Mail, Building, Key, Clock, Lock, X } from 'lucide-react';
import { User as UserType } from '../types/mrp';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white space-y-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 font-mono">
            {currentUser.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">{currentUser.name}</h2>
            <p className="text-xs text-indigo-400 font-medium">{currentUser.email}</p>
            <span className="mt-1 inline-block px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono">
              ROLE: {currentUser.role}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Building className="w-3 h-3 text-indigo-400" />
              Department
            </span>
            <p className="font-semibold text-slate-200">{currentUser.department}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Two-Factor Auth (2FA)
            </span>
            <p className={`font-semibold ${currentUser.isTwoFactorEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentUser.isTwoFactorEnabled ? 'TOTP Enabled' : 'Optional'}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              Last Authenticated Session
            </span>
            <p className="font-mono text-slate-300">{currentUser.lastLogin || '2026-08-08 06:12:00 UTC'}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Email Verification
            </span>
            <p className="font-semibold text-emerald-400">Verified & Signed</p>
          </div>

        </div>

        {/* Active Session & Token Details */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono font-bold text-slate-300">Active Security Token & AES Hash</span>
            <span className="text-emerald-400 text-[10px]">Session Active</span>
          </div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-400 break-all select-all">
            mrp_jwt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.usr_{currentUser.id}.20260808_sec
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
