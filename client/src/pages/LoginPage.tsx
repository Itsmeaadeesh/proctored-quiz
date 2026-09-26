import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertCircle, ArrowRight, Lock, Hourglass, ShieldCheck } from 'lucide-react';

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
  const [isQuizClosed, setIsQuizClosed] = useState(false);
  const [isCheckingQuiz, setIsCheckingQuiz] = useState(true);

  useEffect(() => {
    api
      .getActiveQuiz()
      .then((data) => {
        if (data.quiz && data.quiz.is_active === false) {
          setIsQuizClosed(true);
        }
      })
      .catch((err) => {
        console.error('Error fetching quiz status:', err);
      })
      .finally(() => {
        setIsCheckingQuiz(false);
      });
  }, []);

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

  if (isCheckingQuiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-redhat-gray-light min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-redhat-red border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-redhat-black font-display uppercase tracking-wider">
          Connecting to Examination Server...
        </p>
      </div>
    );
  }

  if (isQuizClosed) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-redhat-gray-light animate-in fade-in-50 duration-200">
        <div className="max-w-xl w-full bg-white border-2 border-redhat-black shadow-2xl rounded-sm overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-redhat-black text-white p-6 sm:p-8 border-b-4 border-b-redhat-red text-center">
            {/* GGITS Institutional Logo */}
            <div className="flex justify-center mb-4 pb-3 border-b border-neutral-800">
              <img
                src="/assets/ggits-logo.png"
                alt="Gyan Ganga Institute of Technology & Sciences"
                className="h-14 w-auto object-contain brightness-0 invert"
              />
            </div>

            <div className="inline-flex items-center space-x-2 bg-red-950/80 text-red-400 border border-red-800/80 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-redhat-red" />
              <span>Examination Window Closed</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              RHA DAY 26 Examination Has Concluded
            </h1>
            <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto">
              Gyan Ganga Institute of Technology &amp; Sciences &bull; Department of Computer Science
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Status Notice */}
            <div className="bg-red-50 border-l-4 border-l-redhat-red p-4 rounded-xs text-xs text-red-950 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-redhat-red shrink-0 mt-0.5" />
              <div>
                <div className="font-black uppercase tracking-wider text-[11px] text-red-900 mb-1">
                  Submissions Officially Sealed
                </div>
                <p className="leading-relaxed">
                  The scheduled examination period has officially ended. In accordance with institutional examination rules, no further attempts, late starts, or new registrations are accepted.
                </p>
              </div>
            </div>

            {/* Results Timeline Banner */}
            <div className="bg-gradient-to-br from-neutral-900 via-redhat-black to-neutral-950 text-white p-5 rounded-xs border border-neutral-800 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider font-mono">
                <Hourglass className="w-4 h-4 animate-pulse" />
                <span>Results Announcement</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Official Results &amp; Merit List Coming Soon
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Telemetry and question responses from all examinees are being compiled and verified. The official leaderboard rankings, scores, and prize winners will be declared shortly by the Red Hat Academy Coordinators.
              </p>
            </div>

            {/* Bottom Status Footer */}
            <div className="pt-2 text-center border-t border-neutral-100">
              <p className="text-[11px] text-neutral-400 font-mono tracking-wide uppercase">
                RHA DAY 26 &bull; Examination Session Terminated &bull; GGITS
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  }

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
