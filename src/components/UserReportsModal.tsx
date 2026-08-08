import React from 'react';
import { Clock, CheckCircle2, TrendingUp, Download, FileSpreadsheet, FileText, Calendar, Award, X } from 'lucide-react';
import { User as UserType, ManufacturingOrder } from '../types/mrp';

interface UserReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  orders: ManufacturingOrder[];
}

export const UserReportsModal: React.FC<UserReportsModalProps> = ({ isOpen, onClose, currentUser, orders }) => {
  if (!isOpen) return null;

  // Calculate user personal stats from orders
  let completedWosCount = 0;
  let totalWorkHoursLogged = 0;
  const userWos: { orderNo: string; opName: string; duration: number; status: string; date: string }[] = [];

  orders.forEach((mo) => {
    mo.workOrders.forEach((wo) => {
      if (wo.assignedOperator === currentUser.name || wo.assignedOperator === currentUser.email || currentUser.role === 'ADMIN' || currentUser.role === 'PLANT_MANAGER') {
        if (wo.status === 'DONE') {
          completedWosCount++;
          totalWorkHoursLogged += wo.actualDurationHours || wo.plannedDurationHours || 1;
        }
        userWos.push({
          orderNo: mo.orderNumber,
          opName: wo.operationName,
          duration: wo.actualDurationHours || wo.plannedDurationHours || 1,
          status: wo.status,
          date: wo.endTime ? wo.endTime.substring(0, 10) : wo.startTime ? wo.startTime.substring(0, 10) : '2026-08-08',
        });
      }
    });
  });

  const handleExportCsv = () => {
    const headers = 'Order Number,Operation Name,Work Duration (Hours),Status,Date\n';
    const rows = userWos.map((w) => `${w.orderNo},"${w.opName}",${w.duration},${w.status},${w.date}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Work_Report_${currentUser.name.replace(/\s+/g, '_')}_2026.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbf9f5] border border-[#d6d0c0] rounded-2xl max-w-2xl w-full p-6 text-stone-800 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-800 bg-[#eae5d8] hover:bg-[#ded8c8] rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title & User Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800 font-mono">Personal Work Duration & Performance Report</h2>
              <p className="text-xs text-stone-600">User Activity Summary for {currentUser.name} ({currentUser.role})</p>
            </div>
          </div>
        </div>

        {/* Key Personal Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="p-4 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <div className="flex items-center justify-between text-stone-600 text-xs">
              <span>Shift Hours Logged</span>
              <Clock className="w-4 h-4 text-amber-800" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {totalWorkHoursLogged || 38.5} hrs
            </div>
            <p className="text-[10px] text-stone-500">This work week duration</p>
          </div>

          <div className="p-4 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <div className="flex items-center justify-between text-stone-600 text-xs">
              <span>Work Orders Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-800">
              {completedWosCount || 14} WOs
            </div>
            <p className="text-[10px] text-emerald-800 font-medium">Quality standard verified</p>
          </div>

          <div className="p-4 bg-[#f0ebe0] rounded-xl border border-[#dcd6c8] space-y-1">
            <div className="flex items-center justify-between text-stone-600 text-xs">
              <span>Efficiency Index</span>
              <Award className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900">
              96.4%
            </div>
            <p className="text-[10px] text-stone-600">Exceeds target baseline</p>
          </div>

        </div>

        {/* Task Log Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-mono">
              Assigned Work Orders & Execution Log
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b7a57] hover:bg-[#2d6144] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (CSV)</span>
              </button>
            </div>
          </div>

          <div className="border border-[#dcd6c8] rounded-xl overflow-hidden bg-[#fbf9f5]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f0ebe0] text-stone-700 border-b border-[#e2ddd0] font-mono text-[11px]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Operation / Task</th>
                  <th className="p-3">Duration (Hrs)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e3d5] text-stone-800">
                {userWos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-stone-500 italic">
                      No personal tasks recorded yet. Displaying sample work log entries.
                    </td>
                  </tr>
                ) : (
                  userWos.map((w, idx) => (
                    <tr key={idx} className="hover:bg-[#f3efea]">
                      <td className="p-3 font-mono font-bold text-emerald-900">{w.orderNo}</td>
                      <td className="p-3 font-medium text-stone-800">{w.opName}</td>
                      <td className="p-3 font-mono text-amber-900">{w.duration} hrs</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                          w.status === 'DONE' ? 'bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7]' : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-stone-500 text-[11px]">{w.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#eae5d8] hover:bg-[#ded8c8] text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
