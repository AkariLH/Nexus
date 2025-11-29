import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useQuestionnaire } from '../context/QuestionnaireContext';

/**
 * Hook para proteger pantallas que requieren cuestionario completado
 * Optimizado para evitar loops infinitos y tráfico excesivo
 */
export const useQuestionnaireGuard = () => {
  const { isCompleted, isLoading } = useQuestionnaire();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Esperar a que termine de cargar
    if (isLoading) return;
    
    // No verificar si ya estamos en el cuestionario
    if (pathname === '/(tabs)/initial-questionnaire') {
      hasRedirected.current = false;
      return;
    }
    
    // Si no está completo y no hemos redirigido aún, redirigir
    if (isCompleted === false && !hasRedirected.current) {
      console.log('⚠️ Cuestionario incompleto, redirigiendo desde:', pathname);
      hasRedirected.current = true;
      router.replace('/(tabs)/initial-questionnaire');
    }
    
    // Resetear flag si el cuestionario está completo
    if (isCompleted === true) {
      hasRedirected.current = false;
    }
  }, [isCompleted, isLoading, pathname]);
};
