import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, AlertCircle, Lock, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToStudent: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToStudent,
}) => {
  const { loginAdmin } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Please enter the coordinator passcode.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.loginAdmin(passcode.trim());
      loginAdmin(data.user, passcode.trim());
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid coordinator passcode.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-redhat-gray-light">
      <div className="max-w-md w-full bg-white border border-redhat-gray-border shadow-xl rounded-sm p-6 sm:p-8">
        
        {/* GGITS Institutional Logo */}
        <div className="flex justify-center mb-5 pb-4 border-b border-redhat-gray-border">
          <img
            src="/assets/ggits-logo.png"
            alt="Gyan Ganga Institute of Technology & Sciences"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-redhat-red bg-red-50 px-2.5 py-0.5 rounded-xs border border-redhat-red/30 mb-2">
            Restricted Access &bull; RHA DAY 26
          </span>
          <h1 className="text-2xl font-black text-redhat-black font-display tracking-tight flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-redhat-red" />
            <span>Coordinator Console</span>
          </h1>
          <p className="text-xs text-redhat-gray-text mt-1">
            GGITS Examination Administration &amp; Integrity Audit
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-redhat-gray-light border border-redhat-gray-border rounded-xs text-xs space-y-1.5 text-left mb-5">
          <div className="flex items-center text-redhat-red font-bold uppercase tracking-wider text-[11px]">
            <Lock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Authorized Personnel Only
          </div>
          <p className="text-neutral-700 leading-relaxed text-[11px]">
            This portal is exclusively for verified GGITS event coordinators, proctors, and evaluators. Enter your secure passcode to continue.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-redhat-red/40 text-redhat-red px-3.5 py-2.5 rounded-sm text-xs font-medium mb-5 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
              Coordinator Passcode <span className="text-redhat-red">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter coordinator passcode"
                className="w-full px-3.5 py-2.5 pr-10 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white font-mono"
                autoComplete="current-password"
                autoFocus
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-redhat-black hover:bg-neutral-800 text-white font-bold text-sm tracking-wider uppercase rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md mt-6 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-redhat-red" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}</span>
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-redhat-gray-border text-center">
          <button
            type="button"
            onClick={onBackToStudent}
            className="inline-flex items-center text-xs font-bold text-neutral-500 hover:text-redhat-red transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Return to Student Examination Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
};
