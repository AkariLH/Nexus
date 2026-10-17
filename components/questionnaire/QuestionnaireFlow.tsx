import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../../constants/colors';
import preferenceService from '../../services/preference.service';
import type { PreferenceCategory, UserPreference } from '../../types/preferences.api.types';
import {
  QUESTIONNAIRE_STEPS,
  buildStep,
  firstPendingStep,
  savedChoices,
  toggleChoice,
  toRequest,
} from '../../utils/questionnaireSteps';
import { ScreenHeader } from '../../app/components/layout/ScreenHeader';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { OptionChip } from '../../app/components/ui/OptionChip';
import { ResultModal } from '../../app/components/ResultModal';
import { GradientIcon } from '../ui/Surface';

interface QuestionnaireFlowProps {
  userId: number;
  /** `initial`: tras registrarse (bienvenida, "Terminar"); `edit`: desde Perfil ("Guardar"). */
  mode: 'initial' | 'edit';
  onFinish: () => void;
  /** Flecha de regreso cuando no hay paso anterior (solo en `edit`). */
  onExit: () => void;
}

const WELCOME = -1;
const TOTAL = QUESTIONNAIRE_STEPS.length;

/**
 * Figma D1-D4 - Cuestionario de preferencias paso a paso (RF-12/RF-13). Cada paso se guarda al
 * avanzar, asi que si la persona sale a la mitad, al volver retoma donde se quedo.
 */
export function QuestionnaireFlow({ userId, mode, onFinish, onExit }: QuestionnaireFlowProps) {
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [saved, setSaved] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [stepIndex, setStepIndex] = useState(WELCOME);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadFailed(false);
    const [cats, mine] = await Promise.all([
      preferenceService.getAllCategories(),
      preferenceService.getUserPreferences(userId),
    ]);
    if (!cats.data) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }
    const savedPrefs = mine.data ?? [];
    setCategories(cats.data);
    setSaved(savedPrefs);
    const pending = firstPendingStep(savedPrefs.map((p) => p.categoryName));
    const start = mode === 'edit' ? 0 : savedPrefs.length === 0 ? WELCOME : Math.max(pending, 0);
    goTo(start, savedPrefs);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const goTo = (index: number, from: UserPreference[] = saved) => {
    setStepIndex(index);
    setChosen(index === WELCOME ? new Set() : savedChoices(from, QUESTIONNAIRE_STEPS[index].categoryName));
  };

  const definition = stepIndex === WELCOME ? null : QUESTIONNAIRE_STEPS[stepIndex];
  const category = definition ? categories.find((c) => c.name === definition.categoryName) : undefined;
  const step = useMemo(
    () => (definition && category ? buildStep(definition, category) : null),
    [definition, category],
  );

  const canGoBack = stepIndex > 0 || mode === 'edit';
  const goBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
    else if (mode === 'edit') onExit();
  };

  // En el registro el cuestionario es obligatorio (RN-14): el boton fisico solo regresa de paso.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) goBack();
      return true;
    });
    return () => sub.remove();
  });

  const next = async () => {
    if (!definition) return;
    setSaving(true);
    const response = await preferenceService.savePreferences(userId, { preferences: toRequest(chosen) });
    setSaving(false);
    if (!response.data) {
      setSaveFailed(true);
      return;
    }
    const others = saved.filter((p) => p.categoryName !== definition.categoryName);
    const mine = [...chosen].map((preferenceId) => ({
      preferenceId,
      preferenceName: '',
      categoryName: definition.categoryName,
      level: null,
    }));
    const updated = [...others, ...mine];
    setSaved(updated);
    if (stepIndex === TOTAL - 1) onFinish();
    else goTo(stepIndex + 1, updated);
  };

  const last = stepIndex === TOTAL - 1;
  const buttonTitle = stepIndex === WELCOME ? 'Empezar' : last ? (mode === 'edit' ? 'Guardar' : 'Terminar') : 'Siguiente';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title="Tus preferencias" onBack={goBack} backDisabled={!canGoBack} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : loadFailed ? (
        <View style={styles.center}>
          <Text style={styles.welcomeSubtitle}>No se pudieron cargar las preguntas.</Text>
          <TouchableOpacity onPress={load} accessibilityRole="button" style={styles.retry}>
            <Text style={styles.link}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      ) : stepIndex === WELCOME ? (
        <View style={styles.center}>
          <GradientIcon name="sparkles-outline" size={80} radius={40} />
          <Text style={styles.welcomeTitle}>Cuéntanos qué te gusta</Text>
          <Text style={styles.welcomeSubtitle}>Son 7 pasos cortos.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepCount}>
            Paso {stepIndex + 1} de {TOTAL}
          </Text>
          <View style={styles.segments}>
            {QUESTIONNAIRE_STEPS.map((s, i) => (
              <View key={s.categoryName} style={[styles.segment, i <= stepIndex && styles.segmentDone]} />
            ))}
          </View>

          <View style={styles.dimension}>
            <GradientIcon name={definition!.icon} size={48} radius={24} />
            <View style={styles.dimensionText}>
              <Text style={styles.dimensionTitle} accessibilityRole="header">
                {definition!.title}
              </Text>
              <Text style={styles.dimensionQuestion}>{definition!.question}</Text>
            </View>
          </View>

          {step?.groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.chips}>
                {group.options.map((option) => (
                  <OptionChip
                    key={option.id}
                    role="checkbox"
                    label={option.label}
                    selected={chosen.has(option.id)}
                    onPress={() => setChosen(toggleChoice(chosen, option.id, step.noneId))}
                  />
                ))}
              </View>
            </View>
          ))}

          {step?.noneId != null && (
            <TouchableOpacity
              onPress={() => setChosen(toggleChoice(chosen, step.noneId!, step.noneId))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: chosen.has(step.noneId) }}
              style={styles.noneButton}
            >
              <Text style={[styles.link, chosen.has(step.noneId) && styles.linkChosen]}>Nada de esto me interesa</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {!loading && !loadFailed && (
        <View style={styles.footer}>
          <GradientButton
            title={buttonTitle}
            onPress={stepIndex === WELCOME ? () => goTo(0) : next}
            disabled={stepIndex !== WELCOME && chosen.size === 0}
            loading={saving}
          />
        </View>
      )}

      <ResultModal
        visible={saveFailed}
        icon="alert-circle-outline"
        tone="warning"
        title="No se pudo guardar"
        subtitle="Revisa tu conexión e inténtalo otra vez."
        primary={{ label: 'Entendido', onPress: () => setSaveFailed(false) }}
        onRequestClose={() => setSaveFailed(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  welcomeTitle: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  retry: {
    padding: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  stepCount: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.divider,
  },
  segmentDone: {
    backgroundColor: palette.primary,
  },
  dimension: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  dimensionText: {
    flex: 1,
  },
  dimensionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  dimensionQuestion: {
    marginTop: 2,
    fontSize: 14,
    color: palette.textSecondary,
  },
  group: {
    marginTop: 24,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noneButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingVertical: 8,
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textAccent,
  },
  linkChosen: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
});
