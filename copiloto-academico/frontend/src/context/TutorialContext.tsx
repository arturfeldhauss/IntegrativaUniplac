import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface TutorialContextType {
  isOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType>({
  isOpen: false,
  openTutorial: () => {},
  closeTutorial: () => {},
});

function storageKey(userId: string) {
  return `integrativa_tutorial_seen_${userId}`;
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Abre automaticamente na primeira visita do usuário
  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) setIsOpen(true);
  }, [user]);

  const openTutorial = useCallback(() => setIsOpen(true), []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    if (user) localStorage.setItem(storageKey(user.id), 'true');
  }, [user]);

  return (
    <TutorialContext.Provider value={{ isOpen, openTutorial, closeTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
