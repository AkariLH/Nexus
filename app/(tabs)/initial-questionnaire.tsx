import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useQuestionnaire } from '../../context/QuestionnaireContext';
import { QuestionnaireFlow } from '../../components/questionnaire/QuestionnaireFlow';

/**
 * Figma D1-D5 - Cuestionario obligatorio tras registrarse (RN-14). Al terminar vuelve a Inicio,
 * que muestra el modal "¡Listo!".
 */
export default function InitialQuestionnaireScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { revalidate } = useQuestionnaire();

  useEffect(() => {
    if (!isLoading && !user?.userId) router.replace('/(auth)/login');
  }, [user, isLoading]);

  if (!user?.userId) return null;

  const finish = async () => {
    await revalidate();
    router.replace({ pathname: '/(tabs)', params: { questionnaire: 'done' } });
  };

  return <QuestionnaireFlow userId={user.userId} mode="initial" onFinish={finish} onExit={() => {}} />;
}
