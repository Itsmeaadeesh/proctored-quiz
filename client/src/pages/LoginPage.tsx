import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { loginStudent } = useAuth();
  
  // Student Form State
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('All fields are compulsory: Roll Number, Full Name, Email, and Phone Number.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid college email address.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.loginStudent(rollNo.trim(), name.trim(), email.trim(), cleanPhone);
      loginStudent(data.user, data.quizId);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-redhat-red/40 text-redhat-red px-3.5 py-2.5 rounded-sm text-xs font-medium mb-5 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CANDIDATE STUDENT REGISTRATION FORM */}
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
              placeholder="Enter college roll number"
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
              placeholder="Enter candidate full name"
              className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
              College Email Address <span className="text-redhat-red">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter college email address"
              className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-redhat-black tracking-wider mb-1">
              Phone / WhatsApp Number <span className="text-redhat-red">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="w-full px-3.5 py-2.5 border border-redhat-gray-border rounded-sm text-sm text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white font-mono"
            />
          </div>

          {/* Red Hat Red Primary CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-redhat-red hover:bg-redhat-red-dark active:bg-redhat-red-darker text-white font-bold text-sm tracking-wider uppercase rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md mt-6 cursor-pointer"
          >
            <span>{isLoading ? 'Verifying Student...' : 'Proceed to Instructions'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
