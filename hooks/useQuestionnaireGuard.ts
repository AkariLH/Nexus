import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useQuestionnaire } from '../context/QuestionnaireContext';

/**
 * Hook para proteger pantallas que requieren cuestionario completado
 * Usa el contexto para evitar llamadas API redundantes
 */
export const useQuestionnaireGuard = () => {
  const { isCompleted, isLoading } = useQuestionnaire();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Esperar a que termine de cargar
    if (isLoading) return;
    
    // No verificar si ya estamos en el cuestionario
    if (pathname === '/(tabs)/initial-questionnaire') return;
    
    // Si no está completo, redirigir
    if (isCompleted === false) {
      console.log('⚠️ Cuestionario incompleto, redirigiendo desde:', pathname);
      router.replace('/(tabs)/initial-questionnaire');
    }
  }, [isCompleted, isLoading, pathname]);
};
