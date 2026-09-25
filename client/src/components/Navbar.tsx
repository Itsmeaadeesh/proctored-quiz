import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentTab?: 'login' | 'instructions' | 'quiz' | 'result' | 'admin';
  onNavigate?: (tab: 'login' | 'instructions' | 'quiz' | 'result' | 'admin') => void;
  isExamInProgress?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'login',
  onNavigate,
  isExamInProgress = false,
}) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#151515] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Red Hat Logo + Powered By Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/redhat-logo.png"
                alt="Red Hat"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <div className="hidden sm:flex flex-col border-l border-redhat-gray-border pl-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-redhat-gray-text">
                  Powered by Red Hat Academy
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-redhat-red">
                  RHA DAY 26
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation (Only when not actively in locked exam) */}
          {!isExamInProgress && (
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className={`py-2 text-sm font-semibold tracking-wide transition-colors relative ${
                  currentTab === 'login'
                    ? 'text-redhat-black font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-redhat-red'
                    : 'text-redhat-gray-dark hover:text-redhat-black'
                }`}
              >
                Portal Home
              </button>

              {user && !isAdmin && (
                <button
                  onClick={() => onNavigate && onNavigate('instructions')}
                  className={`py-2 text-sm font-semibold tracking-wide transition-colors relative ${
                    currentTab === 'instructions' || currentTab === 'quiz'
                      ? 'text-redhat-black font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-redhat-red'
                      : 'text-redhat-gray-dark hover:text-redhat-black'
                  }`}
                >
                  Exam Room
                </button>
              )}
            </nav>
          )}

          {/* Right: User Status & GGITS Institutional Logo */}
          <div className="flex items-center space-x-4">
            {/* Active User Chip (Students only) */}
            {user && !isAdmin && (
              <div className="flex items-center space-x-2 bg-redhat-gray-light px-3 py-1.5 rounded-sm border border-redhat-gray-border">
                <UserIcon className="w-4 h-4 text-redhat-gray-text" />
                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-redhat-black">{user.name}</div>
                  <div className="text-[10px] text-redhat-gray-text font-mono">
                    {user.roll_no}
                  </div>
                </div>
                {!isExamInProgress && (
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="ml-2 text-redhat-gray-text hover:text-redhat-red transition-colors p-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* GGITS Institutional Logo */}
            <div className="flex items-center pl-2 sm:pl-4 border-l border-redhat-gray-border">
              <img
                src="/assets/ggits-logo.png"
                alt="Gyan Ganga Institute of Technology and Sciences"
                className="h-10 sm:h-12 w-auto object-contain max-w-[160px] sm:max-w-[220px]"
              />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
