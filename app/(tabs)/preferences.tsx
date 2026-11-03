import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuestionnaireFlow } from '../../components/questionnaire/QuestionnaireFlow';
import { ResultModal } from '../components/ResultModal';

/**
 * Figma D (desde Perfil) - Mismo cuestionario con lo guardado ya marcado; el último paso dice
 * "Guardar" y confirma que se guardó antes de volver a Perfil.
 */
export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  if (!user?.userId) return null;

  const back = () => {
    setSaved(false);
    router.back();
  };

  return (
    <>
      <QuestionnaireFlow userId={user.userId} mode="edit" onFinish={() => setSaved(true)} onExit={() => router.back()} />
      <ResultModal
        visible={saved}
        icon="checkmark-circle-outline"
        animateIcon
        title="Preferencias guardadas"
        subtitle="Nexus usará tus elecciones en las próximas recomendaciones."
        primary={{ label: 'Listo', onPress: back }}
        onRequestClose={back}
      />
    </>
  );
}
