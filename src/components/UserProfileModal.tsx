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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 text-slate-800 space-y-6 shadow-xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg font-mono">
            {currentUser.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-600">{currentUser.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 rounded font-mono">
              ROLE: {currentUser.role}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
              <Building className="w-3 h-3 text-slate-600" />
              Department
            </span>
            <p className="font-semibold text-slate-800">{currentUser.department}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3 text-slate-600" />
              Two-Factor Auth (2FA)
            </span>
            <p className={`font-semibold ${currentUser.isTwoFactorEnabled ? 'text-emerald-700' : 'text-slate-700'}`}>
              {currentUser.isTwoFactorEnabled ? 'TOTP Enabled' : 'Optional'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-600" />
              Last Authenticated Session
            </span>
            <p className="font-mono text-slate-700">{currentUser.lastLogin || '2026-08-08 06:12:00 UTC'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-slate-600" />
              Email Verification
            </span>
            <p className="font-semibold text-emerald-700">Verified</p>
          </div>

        </div>

        {/* Active Session & Token Details */}
        <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-[11px]">
            <span className="font-mono font-semibold text-slate-800">Active Security Token & AES Hash</span>
            <span className="text-emerald-700 font-semibold text-[10px]">Session Active</span>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-600 break-all select-all">
            mrp_jwt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.usr_{currentUser.id}.20260808_sec
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-xs transition cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
