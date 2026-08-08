import React, { useState } from 'react';
import { Cloud, X, RefreshCw, CheckCircle2, Lock, ShieldCheck, HardDrive, ArrowUpRight } from 'lucide-react';
import { CloudStorageConfig } from '../types/mrp';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudStorageConfig;
  onTriggerSync: (provider: CloudStorageConfig['provider']) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose, config, onTriggerSync }) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudStorageConfig['provider']>(config.provider);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    onTriggerSync(selectedProvider);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">Third-Party Cloud Storage Provider Integration</h3>
              <p className="text-xs text-slate-400">Automated E2E encrypted backup & ledger snapshot archival</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Select Primary Cloud Storage Destination</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProvider('AWS_S3')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition ${
                  selectedProvider === 'AWS_S3'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>AWS S3</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('GOOGLE_CLOUD_STORAGE')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition ${
                  selectedProvider === 'GOOGLE_CLOUD_STORAGE'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Google Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('DROPBOX')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition ${
                  selectedProvider === 'DROPBOX'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Dropbox Vault</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Vault Bucket:</span>
              <strong className="text-white">{config.bucketName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cloud Region:</span>
              <strong className="text-sky-400">{config.region}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">In-Transit Encryption:</span>
              <strong className="text-emerald-400">TLS 1.3 / AES-256</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Last Archive Timestamp:</span>
              <strong className="text-slate-200">{config.lastSyncTimestamp ? new Date(config.lastSyncTimestamp).toLocaleString() : 'Pending'}</strong>
            </div>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Encrypting & Uploading Snapshot...' : `Archive MRP Ledger Snapshot to ${selectedProvider}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
