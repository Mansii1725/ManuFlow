import React, { useState } from 'react';
import { Cloud, X, RefreshCw, CheckCircle2, Lock, ShieldCheck, HardDrive, ArrowUpRight } from 'lucide-react';
import { CloudStorageConfig } from '../types/mrp';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: CloudStorageConfig;
  onTriggerSync?: (provider: CloudStorageConfig['provider']) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  config = {
    provider: 'AWS_S3',
    bucketName: 'erp-cloud-vault-archive',
    region: 'ap-south-1',
    autoSyncIntervalMinutes: 60,
    lastSyncTimestamp: new Date().toISOString(),
    isEncrypted: true
  },
  onTriggerSync
}) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudStorageConfig['provider']>(
    config?.provider || 'AWS_S3'
  );
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    if (onTriggerSync) {
      onTriggerSync(selectedProvider);
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbf9f5] border border-[#d6d0c0] rounded-2xl max-w-lg w-full p-6 text-stone-800 space-y-5 shadow-xl">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#e2ddd0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#e1efe6] text-emerald-800 border border-[#bcdcc7] rounded-lg">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 font-mono">Third-Party Cloud Storage Provider Integration</h3>
              <p className="text-xs text-stone-600">Automated E2E encrypted backup & ledger snapshot archival</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-500 hover:text-stone-800 bg-[#eae5d8] hover:bg-[#ded8c8] rounded-lg cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5">Select Primary Cloud Storage Destination</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProvider('AWS_S3')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition cursor-pointer ${
                  selectedProvider === 'AWS_S3'
                    ? 'bg-[#e1efe6] border-[#3b7a57] text-emerald-900 font-bold'
                    : 'bg-[#f0ebe0] border-[#dcd6c8] text-stone-600 hover:text-stone-800'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>AWS S3</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('GOOGLE_CLOUD_STORAGE')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition cursor-pointer ${
                  selectedProvider === 'GOOGLE_CLOUD_STORAGE'
                    ? 'bg-[#e1efe6] border-[#3b7a57] text-emerald-900 font-bold'
                    : 'bg-[#f0ebe0] border-[#dcd6c8] text-stone-600 hover:text-stone-800'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Google Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('DROPBOX')}
                className={`p-3 rounded-xl border font-mono flex flex-col items-center gap-1 transition cursor-pointer ${
                  selectedProvider === 'DROPBOX'
                    ? 'bg-[#e1efe6] border-[#3b7a57] text-emerald-900 font-bold'
                    : 'bg-[#f0ebe0] border-[#dcd6c8] text-stone-600 hover:text-stone-800'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Dropbox Vault</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#f0ebe0] border border-[#dcd6c8] rounded-xl space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-stone-600">Target Vault Bucket:</span>
              <strong className="text-stone-800">{config.bucketName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Cloud Region:</span>
              <strong className="text-emerald-800">{config.region}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">In-Transit Encryption:</span>
              <strong className="text-emerald-800">TLS 1.3 / AES-256</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#e2ddd0]">
              <span className="text-stone-600">Last Archive Timestamp:</span>
              <strong className="text-stone-800">{config.lastSyncTimestamp ? new Date(config.lastSyncTimestamp).toLocaleString() : 'Pending'}</strong>
            </div>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full py-3 bg-[#3b7a57] hover:bg-[#2d6144] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Encrypting & Uploading Snapshot...' : `Archive MRP Ledger Snapshot to ${selectedProvider}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
