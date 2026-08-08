import React from 'react';
import { Cpu, ChevronLeft, ChevronRight, User, Shield, FileText, Menu, Sparkles } from 'lucide-react';
import { Role, User as UserType } from '../types/mrp';

interface HeaderProps {
  currentUser: UserType;
  onRoleChange: (newRole: Role) => void;
  currentSlide: number;
  totalSlides: number;
  slideTitle: string;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onOpenAuthModal: (mode: 'OTP' | 'PASSWORD_GEN' | 'TWO_FACTOR' | 'RECOVERY') => void;
  onOpenProfile: () => void;
  onOpenReports: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  currentSlide,
  totalSlides,
  slideTitle,
  onPrevSlide,
  onNextSlide,
  onOpenAuthModal,
  onOpenProfile,
  onOpenReports,
  onToggleSidebar,
}) => {
  const rolesList: { role: Role; label: string }[] = [
    { role: 'ADMIN', label: 'Admin (Full Access)' },
    { role: 'PLANT_MANAGER', label: 'Plant Manager' },
    { role: 'SHOP_FLOOR_OPERATOR', label: 'Shop Floor Operator' },
    { role: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
    { role: 'AUDITOR_COMPLIANCE', label: 'Compliance Auditor' },
  ];

  return (
    <header className="glass sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Toggle & Page Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-xl bg-stone-200/60 border border-stone-300/80 cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-[#e1efe6] border border-[#bcdcc7] px-2.5 py-0.5 rounded-full">
                Slide {currentSlide} / {totalSlides}
              </span>
              <h1 className="text-sm font-bold text-stone-800 tracking-tight hidden sm:block">
                {slideTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Slide Stepper Controls */}
        <div className="flex items-center gap-2 bg-[#eae5d8]/80 border border-[#d6d0c0] px-2 py-1 rounded-xl shadow-xs">
          <button
            onClick={onPrevSlide}
            disabled={currentSlide === 1}
            className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Previous Module"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 text-center min-w-[140px] sm:min-w-[180px]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block">
              Module {currentSlide} of {totalSlides}
            </span>
            <span className="text-xs font-bold text-stone-800 truncate block">
              {slideTitle}
            </span>
          </div>

          <button
            onClick={onNextSlide}
            disabled={currentSlide === totalSlides}
            className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Next Module"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Profile Drawer */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2ede2] hover:bg-[#e8e2d4] border border-[#d8d2c2] text-stone-800 text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden lg:inline">Profile</span>
          </button>

          {/* Reports Drawer */}
          <button
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2ede2] hover:bg-[#e8e2d4] border border-[#d8d2c2] text-stone-800 text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden lg:inline">Reports</span>
          </button>

          {/* 2FA Security Modal */}
          <button
            onClick={() => onOpenAuthModal('OTP')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b7a57] hover:bg-[#2e6245] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2FA Security</span>
          </button>

          {/* Role Switcher Dropdown */}
          <div className="flex items-center gap-1 bg-[#eae5d8] border border-[#d6d0c0] rounded-xl px-2.5 py-1 text-xs">
            <span className="text-stone-500 text-[10px] uppercase font-semibold hidden sm:inline">Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className="bg-transparent text-emerald-900 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {rolesList.map((r) => (
                <option key={r.role} value={r.role} className="bg-[#f7f5f0] text-stone-800">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>
    </header>
  );
};

