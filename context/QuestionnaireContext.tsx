import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import preferenceService from '../services/preference.service';

interface QuestionnaireContextType {
  isCompleted: boolean | null;
  isLoading: boolean;
  revalidate: () => Promise<void>;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(0);

  // Verificar al montar y cuando cambia el usuario
  useEffect(() => {
    if (user?.userId) {
      checkStatus();
    } else {
      setIsCompleted(null);
      setIsLoading(false);
    }
  }, [user?.userId]);

  const checkStatus = async () => {
    if (!user?.userId) return;

    // Evitar verificaciones duplicadas en menos de 2 segundos
    const now = Date.now();
    if (now - lastCheck < 2000 && isCompleted !== null) {
      console.log('⚡ Usando caché del cuestionario');
      return;
    }

    setIsLoading(true);
    try {
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data) {
        setIsCompleted(response.data.completed);
        setLastCheck(now);
        console.log('📋 Estado cuestionario cacheado:', response.data.completed);
      }
    } catch (error) {
      console.error('💥 Error verificando cuestionario:', error);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const revalidate = async () => {
    console.log('🔄 Revalidando estado del cuestionario...');
    setLastCheck(0); // Forzar nueva verificación
    await checkStatus();
  };

  return (
    <QuestionnaireContext.Provider value={{ isCompleted, isLoading, revalidate }}>
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
  }
  return context;
}
