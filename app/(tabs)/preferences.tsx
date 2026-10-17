import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { QuestionnaireFlow } from '../../components/questionnaire/QuestionnaireFlow';

/** Figma D (desde Perfil) - Mismo cuestionario con lo guardado ya marcado; el último paso dice "Guardar". */
export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user?.userId) return null;

  return (
    <QuestionnaireFlow userId={user.userId} mode="edit" onFinish={() => router.back()} onExit={() => router.back()} />
  );
}
