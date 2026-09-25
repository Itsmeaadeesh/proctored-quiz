import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (target: 'instructions' | 'admin') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { loginStudent, loginAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  
  // Student Form State
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim()) {
      setErrorMsg('Please enter your full name and college roll number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.loginStudent(rollNo.trim(), name.trim(), email.trim() || undefined);
      loginStudent(data.user, data.quizId);
      onSuccess('instructions');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.loginAdmin();
      loginAdmin(data.user);
      onSuccess('admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Coordinator access failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoStudent = () => {
    setName('Aman Verma');
    setRollNo('0208CS221001');
    setEmail('aman.verma@ggits.ac.in');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-redhat-gray-light">
      <div className="max-w-md w-full bg-white border border-redhat-gray-border shadow-xl rounded-sm p-6 sm:p-8">
        
        {/* GGITS Logo above form title (Per branding spec) */}
        <div className="flex justify-center mb-5 pb-4 border-b border-redhat-gray-border">
          <img
            src="/assets/ggits-logo.png"
            alt="Gyan Ganga Institute of Technology & Sciences"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Form Title & Event Tag */}
        <div className="text-center mb-6">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-redhat-red bg-red-50 px-2.5 py-0.5 rounded-xs border border-redhat-red/30 mb-2">
            RHA DAY 26 &bull; Online Examination
          </span>
          <h1 className="text-2xl font-black text-redhat-black font-display tracking-tight">
            Proctored Assessment Portal
          </h1>
          <p className="text-xs text-redhat-gray-text mt-1">
            Red Hat Academy Certification Challenge &bull; GGITS
          </p>
        </div>

        {/* Tab Toggle: Student vs Admin */}
        <div className="flex border-b border-redhat-gray-border mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'student'
                ? 'border-redhat-red text-redhat-red'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Student Candidate
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'admin'
                ? 'border-redhat-red text-redhat-red'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Coordinator / Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-redhat-red/40 text-redhat-red px-3.5 py-2.5 rounded-sm text-xs font-medium mb-5 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STUDENT FORM */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
                College Roll Number <span className="text-redhat-red">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. 0208CS221001"
                className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
                Full Name <span className="text-redhat-red">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman Verma"
                className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
                College Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@ggits.ac.in"
                className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white"
              />
            </div>

            {/* Red Hat Red Primary CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-redhat-red hover:bg-redhat-red-dark active:bg-redhat-red-darker text-white font-bold text-sm tracking-wider uppercase rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md mt-6 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying Student...' : 'Proceed to Instructions'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Pre-fill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleFillDemoStudent}
                className="text-[11px] text-neutral-500 hover:text-redhat-red underline font-mono cursor-pointer"
              >
                Auto-fill demo student credentials
              </button>
            </div>
          </form>
        )}

        {/* ADMIN TAB - DIRECT COORDINATOR ACCESS */}
        {activeTab === 'admin' && (
          <div className="space-y-5">
            <div className="p-4 bg-redhat-gray-light border border-redhat-gray-border rounded-xs text-xs space-y-2 text-left">
              <div className="flex items-center text-redhat-red font-bold uppercase tracking-wider text-[11px]">
                <Shield className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Coordinator &amp; Proctor Console
              </div>
              <p className="text-neutral-700 leading-relaxed">
                Direct administrative access is enabled for authorized GGITS event coordinators and invigilators to manage quiz configurations, inspect candidate submissions, review proctoring violation logs, and export certification records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleAdminSubmit()}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-redhat-black hover:bg-neutral-800 text-white font-bold text-sm tracking-wider uppercase rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md mt-6 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-redhat-red" />
              <span>{isLoading ? 'Accessing Console...' : 'Enter Admin Console'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
