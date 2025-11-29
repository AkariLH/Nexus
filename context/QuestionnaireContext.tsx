import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import preferenceService from '../services/preference.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuestionnaireContextType {
  isCompleted: boolean | null;
  isLoading: boolean;
  revalidate: () => Promise<void>;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

const CACHE_KEY = 'questionnaire_status_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

  // Cargar desde caché persistente al iniciar
  useEffect(() => {
    if (user?.userId) {
      loadFromCache();
    } else {
      setIsCompleted(null);
      setIsLoading(false);
    }
  }, [user?.userId]);

  const loadFromCache = async () => {
    if (!user?.userId) return;

    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${user.userId}`);
      if (cached) {
        const { status, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Si el caché es válido (menos de 5 minutos), usarlo
        if (now - timestamp < CACHE_DURATION) {
          console.log('⚡ Usando caché persistente del cuestionario:', status);
          setIsCompleted(status);
          setCacheTimestamp(timestamp);
          setIsLoading(false);
          
          // Si está incompleto, verificar en segundo plano por si acaso
          if (!status) {
            checkStatusInBackground();
          }
          return;
        }
      }
      
      // Si no hay caché válido, verificar
      await checkStatus();
    } catch (error) {
      console.error('❌ Error cargando caché:', error);
      await checkStatus();
    }
  };

  const checkStatusInBackground = async () => {
    if (!user?.userId) return;
    
    try {
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data && response.data.completed !== isCompleted) {
        // Solo actualizar si cambió
        setIsCompleted(response.data.completed);
        await saveToCache(response.data.completed);
        console.log('🔄 Estado del cuestionario actualizado en background:', response.data.completed);
      }
    } catch (error) {
      console.error('⚠️ Error verificando en background:', error);
    }
  };

  const checkStatus = async () => {
    if (!user?.userId) return;

    const now = Date.now();
    
    // Evitar verificaciones duplicadas en menos de 10 segundos
    if (now - cacheTimestamp < 10000 && isCompleted !== null) {
      console.log('⚡ Usando caché en memoria reciente');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data) {
        setIsCompleted(response.data.completed);
        await saveToCache(response.data.completed);
        console.log('✅ Estado cuestionario verificado:', response.data.completed);
      }
    } catch (error) {
      console.error('💥 Error verificando cuestionario:', error);
      // En caso de error, mantener el estado actual si existe
      if (isCompleted === null) {
        setIsCompleted(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveToCache = async (status: boolean) => {
    if (!user?.userId) return;
    
    const now = Date.now();
    setCacheTimestamp(now);
    
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEY}_${user.userId}`,
        JSON.stringify({ status, timestamp: now })
      );
    } catch (error) {
      console.error('❌ Error guardando en caché:', error);
    }
  };

  const revalidate = async () => {
    console.log('🔄 Revalidando estado del cuestionario (forzado)...');
    setCacheTimestamp(0); // Invalidar caché
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
