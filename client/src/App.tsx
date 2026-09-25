import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { QuizResultPage } from './pages/QuizResultPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

type ViewMode = 'login' | 'instructions' | 'quiz' | 'result' | 'admin';

const MainAppContent: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('login');
  const [completedSubmissionId, setCompletedSubmissionId] = useState<string | null>(null);

  // Sync initial view based on auth state
  useEffect(() => {
    if (!user) {
      setCurrentView('login');
    } else if (isAdmin) {
      setCurrentView('admin');
    } else if (currentView === 'login') {
      setCurrentView('instructions');
    }
  }, [user, isAdmin]);

  const handleLoginSuccess = (target: 'instructions' | 'admin') => {
    setCurrentView(target);
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
    setCurrentView('login');
  };

  const isExamInProgress = currentView === 'quiz';

  return (
    <div className="min-h-screen flex flex-col bg-white text-redhat-black selection:bg-redhat-red selection:text-white">
      {/* Red Hat & GGITS Branded Navbar */}
      <Navbar
        currentTab={currentView}
        onNavigate={(tab) => setCurrentView(tab)}
        isExamInProgress={isExamInProgress}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'login' && (
          <LoginPage onSuccess={handleLoginSuccess} />
        )}

        {currentView === 'instructions' && (
          <InstructionsPage onStartExam={handleStartExam} />
        )}

        {currentView === 'quiz' && (
          <QuizTakingPage onExamCompleted={handleExamCompleted} />
        )}

        {currentView === 'result' && completedSubmissionId && (
          <QuizResultPage
            submissionId={completedSubmissionId}
            onRetakeOrHome={handleRetakeOrHome}
          />
        )}

        {currentView === 'admin' && <AdminDashboardPage />}
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
