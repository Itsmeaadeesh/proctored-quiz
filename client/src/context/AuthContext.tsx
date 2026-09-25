import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/quiz';

interface AuthContextType {
  user: User | null;
  activeQuizId: string | null;
  submissionId: string | null;
  setSubmissionId: (id: string | null) => void;
  loginStudent: (user: User, quizId: string) => void;
  loginAdmin: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('rha_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => {
    return localStorage.getItem('rha_quiz_id') || null;
  });

  const [submissionId, setSubmissionIdState] = useState<string | null>(() => {
    return localStorage.getItem('rha_submission_id') || null;
  });

  const setSubmissionId = (id: string | null) => {
    setSubmissionIdState(id);
    if (id) {
      localStorage.setItem('rha_submission_id', id);
    } else {
      localStorage.removeItem('rha_submission_id');
    }
  };

  const loginStudent = (userData: User, quizId: string) => {
    setUser(userData);
    setActiveQuizId(quizId);
    localStorage.setItem('rha_user', JSON.stringify(userData));
    localStorage.setItem('rha_quiz_id', quizId);
  };

  const loginAdmin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('rha_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setActiveQuizId(null);
    setSubmissionId(null);
    localStorage.removeItem('rha_user');
    localStorage.removeItem('rha_quiz_id');
    localStorage.removeItem('rha_submission_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeQuizId,
        submissionId,
        setSubmissionId,
        loginStudent,
        loginAdmin,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
