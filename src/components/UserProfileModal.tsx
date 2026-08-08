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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbf9f5] border border-[#d6d0c0] rounded-2xl max-w-lg w-full p-6 text-stone-800 space-y-6 shadow-xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-800 bg-[#eae5d8] hover:bg-[#ded8c8] rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#3b7a57] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xs font-mono">
            {currentUser.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800 font-mono">{currentUser.name}</h2>
            <p className="text-xs text-emerald-800 font-medium">{currentUser.email}</p>
            <span className="mt-1 inline-block px-2.5 py-0.5 text-[10px] font-bold bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-full font-mono">
              ROLE: {currentUser.role}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <span className="text-stone-600 text-[10px] flex items-center gap-1">
              <Building className="w-3 h-3 text-emerald-800" />
              Department
            </span>
            <p className="font-semibold text-stone-800">{currentUser.department}</p>
          </div>

          <div className="p-3 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <span className="text-stone-600 text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-800" />
              Two-Factor Auth (2FA)
            </span>
            <p className={`font-semibold ${currentUser.isTwoFactorEnabled ? 'text-emerald-800' : 'text-amber-800'}`}>
              {currentUser.isTwoFactorEnabled ? 'TOTP Enabled' : 'Optional'}
            </p>
          </div>

          <div className="p-3 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <span className="text-stone-600 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-800" />
              Last Authenticated Session
            </span>
            <p className="font-mono text-stone-700">{currentUser.lastLogin || '2026-08-08 06:12:00 UTC'}</p>
          </div>

          <div className="p-3 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <span className="text-stone-600 text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-800" />
              Email Verification
            </span>
            <p className="font-semibold text-emerald-800">Verified & Signed</p>
          </div>

        </div>

        {/* Active Session & Token Details */}
        <div className="p-3 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] text-xs space-y-2">
          <div className="flex items-center justify-between text-stone-600 text-[11px]">
            <span className="font-mono font-bold text-stone-800">Active Security Token & AES Hash</span>
            <span className="text-emerald-800 font-bold text-[10px]">Session Active</span>
          </div>
          <div className="p-2 bg-[#fbf9f5] rounded border border-[#dcd6c8] font-mono text-[10px] text-stone-600 break-all select-all">
            mrp_jwt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.usr_{currentUser.id}.20260808_sec
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
