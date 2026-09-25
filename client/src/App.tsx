import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { QuizResultPage } from './pages/QuizResultPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

type ViewMode = 'login' | 'instructions' | 'quiz' | 'result' | 'admin';

const getInitialView = (): ViewMode => {
  if (typeof window === 'undefined') return 'login';
  const path = window.location.pathname.toLowerCase();
  if (path === '/admin' || path.startsWith('/admin') || window.location.hash === '#admin') {
    return 'admin';
  }
  return 'login';
};

const MainAppContent: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(getInitialView);
  const [completedSubmissionId, setCompletedSubmissionId] = useState<string | null>(null);

  // Sync view when auth state changes or on initial load
  useEffect(() => {
    const isAtAdminUrl =
      window.location.pathname.toLowerCase() === '/admin' ||
      window.location.pathname.toLowerCase().startsWith('/admin') ||
      window.location.hash === '#admin';

    if (isAtAdminUrl) {
      setCurrentView('admin');
    } else if (!user) {
      setCurrentView('login');
    } else if (isAdmin) {
      setCurrentView('admin');
    } else if (currentView === 'login') {
      setCurrentView('instructions');
    }
  }, [user, isAdmin]);

  // Listen to browser popstate (forward / back buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const isAtAdminUrl =
        window.location.pathname.toLowerCase() === '/admin' ||
        window.location.pathname.toLowerCase().startsWith('/admin') ||
        window.location.hash === '#admin';

      if (isAtAdminUrl) {
        setCurrentView('admin');
      } else if (currentView === 'admin' && !isAdmin) {
        setCurrentView('login');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentView, isAdmin]);

  const handleNavigate = (tab: ViewMode) => {
    if (tab === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else if (tab === 'login') {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
    setCurrentView(tab);
  };

  const handleStudentLoginSuccess = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setCurrentView('instructions');
  };

  const handleAdminLoginSuccess = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setCurrentView('admin');
  };

  const handleBackToStudentPortal = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('login');
  };

  const handleStartExam = () => {
    setCurrentView('quiz');
  };

  const handleExamCompleted = (submissionId: string) => {
    setCompletedSubmissionId(submissionId);
    setCurrentView('result');
  };

  const handleRetakeOrHome = () => {
    logout();
    setCompletedSubmissionId(null);
    window.history.pushState({}, '', '/');
    setCurrentView('login');
  };

  const isExamInProgress = currentView === 'quiz';

  return (
    <div className="min-h-screen flex flex-col bg-white text-redhat-black selection:bg-redhat-red selection:text-white">
      {/* Red Hat & GGITS Branded Navbar */}
      <Navbar
        currentTab={currentView}
        onNavigate={handleNavigate}
        isExamInProgress={isExamInProgress}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {/* Student Login (Only on / or root) */}
        {currentView === 'login' && (
          <LoginPage onSuccess={handleStudentLoginSuccess} />
        )}

        {/* Instructions Page */}
        {currentView === 'instructions' && (
          <InstructionsPage onStartExam={handleStartExam} />
        )}

        {/* Locked Exam taking page */}
        {currentView === 'quiz' && (
          <QuizTakingPage onExamCompleted={handleExamCompleted} />
        )}

        {/* Result & Scorecard Page */}
        {currentView === 'result' && completedSubmissionId && (
          <QuizResultPage
            submissionId={completedSubmissionId}
            onRetakeOrHome={handleRetakeOrHome}
          />
        )}

        {/* Admin Route (/admin) */}
        {currentView === 'admin' && (
          isAdmin && user ? (
            <AdminDashboardPage />
          ) : (
            <AdminLoginPage
              onSuccess={handleAdminLoginSuccess}
              onBackToStudent={handleBackToStudentPortal}
            />
          )
        )}
      </main>

      {/* Black #151515 Footer */}
      {!isExamInProgress && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
