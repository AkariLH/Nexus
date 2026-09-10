import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
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
  // Marca de la ultima consulta al servidor. Es estado PRIVADO: ningun consumidor lo lee.
  // En useState re-renderizaba el proveedor -> value nuevo -> re-render de todas las tabs ->
  // sus efectos de foco volvian a llamar a checkStatus. En useRef la escritura es sincrona,
  // lo que ademas hace que revalidate() vea el cero que acaba de escribir (nexus-PERF-07).
  const cacheTimestampRef = useRef<number>(0);
  // Espejo sincrono de `isCompleted` para los callbacks. No es un valor congelado: se escribe en
  // el mismo tick que el setState. Existe para que checkStatus / checkStatusInBackground puedan
  // leer el valor vigente SIN declarar `isCompleted` como dependencia — con ella, su identidad
  // cambiaba en cada transicion, arrastraba a loadFromCache y volvia a disparar el efecto de
  // montaje, una peticion de mas por transicion (nexus-PERF-07, R1).
  const isCompletedRef = useRef<boolean | null>(null);

  const applyIsCompleted = useCallback((next: boolean | null) => {
    isCompletedRef.current = next;
    setIsCompleted(next);
  }, []);

  const saveToCache = useCallback(async (status: boolean) => {
    if (!user?.userId) return;

    const now = Date.now();
    cacheTimestampRef.current = now;

    try {
      await AsyncStorage.setItem(
        `${CACHE_KEY}_${user.userId}`,
        JSON.stringify({ status, timestamp: now })
      );
    } catch (error) {
      console.error('❌ Error guardando en caché:', error);
    }
  }, [user?.userId]);

  const checkStatus = useCallback(async (): Promise<void> => {
    if (!user?.userId) return;

    const now = Date.now();

    // Evitar verificaciones duplicadas en menos de 10 segundos
    if (now - cacheTimestampRef.current < 10000 && isCompletedRef.current !== null) {
      console.log('⚡ Usando caché en memoria reciente');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data) {
        applyIsCompleted(response.data.completed);
        await saveToCache(response.data.completed);
        console.log('✅ Estado cuestionario verificado:', response.data.completed);
      }
    } catch (error) {
      console.error('💥 Error verificando cuestionario:', error);
      // En caso de error, mantener el estado actual si existe
      if (isCompletedRef.current === null) {
        applyIsCompleted(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, applyIsCompleted, saveToCache]);

  const checkStatusInBackground = useCallback(async (): Promise<void> => {
    if (!user?.userId) return;

    try {
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data && response.data.completed !== isCompletedRef.current) {
        // Solo actualizar si cambió
        applyIsCompleted(response.data.completed);
        await saveToCache(response.data.completed);
        console.log('🔄 Estado del cuestionario actualizado en background:', response.data.completed);
      }
    } catch (error) {
      console.error('⚠️ Error verificando en background:', error);
    }
  }, [user?.userId, applyIsCompleted, saveToCache]);

  const loadFromCache = useCallback(async (): Promise<void> => {
    if (!user?.userId) return;

    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${user.userId}`);
      if (cached) {
        const { status, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Si el caché es válido (menos de 5 minutos), usarlo
        if (now - timestamp < CACHE_DURATION) {
          console.log('⚡ Usando caché persistente del cuestionario:', status);
          applyIsCompleted(status);
          cacheTimestampRef.current = timestamp;
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
  }, [user?.userId, applyIsCompleted, checkStatus, checkStatusInBackground]);

  // Cargar desde caché persistente al iniciar
  useEffect(() => {
    if (user?.userId) {
      loadFromCache();
    } else {
      applyIsCompleted(null);
      setIsLoading(false);
    }
  }, [user?.userId, applyIsCompleted, loadFromCache]);

  const revalidate = useCallback(async (): Promise<void> => {
    console.log('🔄 Revalidando estado del cuestionario (forzado)...');
    cacheTimestampRef.current = 0; // Invalidar caché — sincrono, checkStatus ya lee el cero
    await checkStatus();
  }, [checkStatus]);

  const value = useMemo<QuestionnaireContextType>(
    () => ({ isCompleted, isLoading, revalidate }),
    [isCompleted, isLoading, revalidate],
  );

  return (
    <QuestionnaireContext.Provider value={value}>
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
