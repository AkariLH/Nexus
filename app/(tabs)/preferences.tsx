import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WellnessDimension, PREFERENCE_OPTIONS } from '../../types/preferences.types';
import { DimensionQuestionnaire } from '../../components/DimensionQuestionnaire';
import { ConfirmModal } from '../components/ConfirmModal';
import preferenceService from '../../services/preference.service';
import type { PreferenceCategory, UserPreferenceRequest, UserPreference } from '../../types/preferences.api.types';
import { useAuth } from '../../context/AuthContext';
import { palette, gradients } from '../../constants/colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DIMENSIONS = [
  { id: 'physical', name: 'Bienestar Físico', icon: 'fitness', emoji: '💪', color: '#FF6B6B' },
  { id: 'emotional', name: 'Bienestar Emocional', icon: 'heart', emoji: '💖', color: '#FF8B94' },
  { id: 'social', name: 'Bienestar Social', icon: 'people', emoji: '👥', color: '#A8E6CF' },
  { id: 'intellectual', name: 'Bienestar Intelectual', icon: 'school', emoji: '🧠', color: '#87CEEB' },
  { id: 'professional', name: 'Bienestar Profesional', icon: 'briefcase', emoji: '💼', color: '#FFD3B6' },
  { id: 'environmental', name: 'Bienestar Ambiental', icon: 'leaf', emoji: '🌿', color: '#98D8C8' },
  { id: 'spiritual', name: 'Bienestar Espiritual', icon: 'sparkles', emoji: '✨', color: '#D4A5FF' },
] as const;

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedDimension, setSelectedDimension] = useState<WellnessDimension | null>(null);
  const [completedDimensions, setCompletedDimensions] = useState<Set<WellnessDimension>>(new Set());
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para modales
  const [errorModal, setErrorModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [successModal, setSuccessModal] = useState(false);

  const userId = user?.userId;

  useEffect(() => {
    if (!userId) return;
    
    loadCategories();
    loadUserProgress();
    loadUserPreferences();
  }, [userId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await preferenceService.getAllCategories();
      if (response.data) {
        setCategories(response.data);
        console.log('✅ Categorías cargadas:', response.data.length);
      } else if (response.error) {
        console.error('❌ Error cargando categorías:', response.error);
        setErrorModal({visible: true, message: 'No se pudieron cargar las categorías de preferencias'});
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    if (!userId) return;
    
    try {
      const response = await preferenceService.getUserPreferences(userId);
      if (response.data) {
        setUserPreferences(response.data);
        console.log('✅ Preferencias del usuario cargadas:', response.data.length);
      } else if (response.error) {
        console.error('❌ Error cargando preferencias del usuario:', response.error);
      }
    } catch (error) {
      console.error('💥 Error cargando preferencias del usuario:', error);
    }
  };

  const loadUserProgress = async () => {
    if (!userId) return;
    
    try {
      const response = await preferenceService.getQuestionnaireStatus(userId);
      if (response.data) {
        // Determinar qué dimensiones están completas según las preferencias guardadas
        const categoriesWithPrefs = new Set<string>();
        response.data.userPreferences.forEach(pref => {
          // Mapear categoryName a dimension id (necesitamos hacer esto manualmente)
          const dimId = mapCategoryToDimension(pref.categoryName);
          if (dimId) categoriesWithPrefs.add(dimId);
        });
        setCompletedDimensions(categoriesWithPrefs as Set<WellnessDimension>);
      }
    } catch (error) {
      console.error('💥 Error cargando progreso:', error);
    }
  };

  const mapCategoryToDimension = (categoryName: string): WellnessDimension | null => {
    const mapping: Record<string, WellnessDimension> = {
      'Bienestar Físico': 'physical',
      'Bienestar Emocional': 'emotional',
      'Bienestar Social': 'social',
      'Bienestar Intelectual': 'intellectual',
      'Bienestar Profesional': 'professional',
      'Bienestar Ambiental': 'environmental',
      'Bienestar Espiritual': 'spiritual',
    };
    return mapping[categoryName] || null;
  };

  const handleSavePreferences = async (
    dimensionId: WellnessDimension,
    preferences: UserPreferenceRequest[]
  ) => {
    if (!userId) {
      setErrorModal({visible: true, message: 'No se pudo identificar el usuario'});
      return;
    }
    
    try {
      setSaving(true);
      const response = await preferenceService.savePreferences(userId, {
        preferences,
      });

      if (response.data) {
        console.log('✅ Preferencias guardadas');
        // Marcar dimensión como completada
        const newCompleted = new Set(completedDimensions);
        newCompleted.add(dimensionId);
        setCompletedDimensions(newCompleted);
        
        // Recargar preferencias del usuario
        await loadUserPreferences();
        
        setSelectedDimension(null);
        setSuccessModal(true);
      } else if (response.error) {
        console.error('❌ Error guardando:', response.error);
        setErrorModal({visible: true, message: 'No se pudieron guardar las preferencias. Intenta de nuevo.'});
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setErrorModal({visible: true, message: 'Ocurrió un error inesperado'});
    } finally {
      setSaving(false);
    }
  };

  const progress = (completedDimensions.size / DIMENSIONS.length) * 100;

  // Vista de cuestionario para una dimensión específica
  if (selectedDimension) {
    const currentDimension = DIMENSIONS.find(d => d.id === selectedDimension);
    const currentCategory = categories.find(cat => 
      cat.name === currentDimension?.name
    );

    if (loading) {
      return (
        <SafeAreaView edges={["left", "right"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Cargando preferencias...</Text>
          </View>
        </SafeAreaView>
      );
    }

    if (!currentDimension || !currentCategory) {
      return (
        <SafeAreaView edges={["left", "right"]} style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={palette.error} />
            <Text style={styles.errorText}>No se pudieron cargar las preferencias</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setSelectedDimension(null)}
            >
              <Text style={styles.retryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // Cargar datos existentes para esta dimensión
    const existingPrefsForDimension = userPreferences.filter(
      up => up.categoryName === currentCategory.name
    );

    const initialData = {
      selectedPreferences: new Set(existingPrefsForDimension.map(up => up.preferenceId)),
      levels: existingPrefsForDimension.reduce((acc, up) => {
        acc[up.preferenceId] = up.level;
        return acc;
      }, {} as Record<number, number>),
      notes: existingPrefsForDimension.reduce((acc, up) => {
        if (up.notes) {
          acc[up.preferenceId] = up.notes;
        }
        return acc;
      }, {} as Record<number, string>),
    };

    return (
      <DimensionQuestionnaire
        dimension={currentDimension}
        preferences={currentCategory.preferences.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
        }))}
        onBack={() => setSelectedDimension(null)}
        onSave={(prefs) => handleSavePreferences(selectedDimension, prefs)}
        initialData={initialData}
      />
    );
  }

  // Vista principal: mostrar todas las dimensiones
  if (loading) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.secondary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allCompleted = completedDimensions.size === DIMENSIONS.length;

  if (!selectedDimension) {
    // Vista principal: mostrar todas las dimensiones
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.container}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.headerTitle}>Cuestionario de Preferencias</Text>
          <Text style={styles.headerSubtitle}>
            Ayúdanos a conocerte mejor para personalizar tu experiencia
          </Text>
          
          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedDimensions.size} de {DIMENSIONS.length} completadas
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Basado en las 7 Dimensiones del Bienestar</Text>
          <Text style={styles.sectionSubtitle}>
            Toca cada dimensión para comenzar. Puedes completarlas en cualquier orden.
          </Text>

          <View style={styles.dimensionsGrid}>
            {DIMENSIONS.map((dimension) => {
              const isCompleted = completedDimensions.has(dimension.id);
              
              return (
                <TouchableOpacity
                  key={dimension.id}
                  style={[
                    styles.dimensionCard,
                    isCompleted && styles.dimensionCardCompleted,
                  ]}
                  onPress={() => setSelectedDimension(dimension.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dimensionIconContainer}>
                    <Text style={styles.dimensionEmoji}>{dimension.emoji}</Text>
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={palette.success} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.dimensionName}>{dimension.name}</Text>
                  <View style={[styles.dimensionIndicator, { backgroundColor: dimension.color }]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={palette.secondary} />
            <Text style={styles.infoText}>
              Este cuestionario nos ayudará a sugerirte actividades, eventos y contenido personalizado para tu relación.
            </Text>
          </View>

          {/* Mensaje de completación */}
          {allCompleted && (
            <View style={styles.completionCard}>
              <Ionicons name="checkmark-circle" size={48} color={palette.success} />
              <Text style={styles.completionTitle}>¡Cuestionario Completado! 🎉</Text>
              <Text style={styles.completionText}>
                Has completado todas las dimensiones. Ahora podemos personalizar tu experiencia
                en Nexus según tus preferencias.
              </Text>
              <Text style={styles.completionSubtext}>
                Puedes volver a editar tus preferencias en cualquier momento desde Configuración.
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Modales */}
        <ConfirmModal
          visible={errorModal.visible}
          type="error"
          title="Error"
          message={errorModal.message}
          confirmText="Entendido"
          showCancel={false}
          onConfirm={() => setErrorModal({visible: false, message: ""})}
        />
        
        <ConfirmModal
          visible={successModal}
          type="success"
          title="¡Éxito!"
          message="Tus preferencias han sido guardadas"
          confirmText="Continuar"
          showCancel={false}
          onConfirm={() => setSuccessModal(false)}
        />
      </SafeAreaView>
    );
  }

  // Vista de cuestionario para una dimensión específica
  const currentDimension = DIMENSIONS.find(d => d.id === selectedDimension);
  
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <View style={styles.questionnaireHeader}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Regresar" hitSlop={10} 
          style={styles.backButton}
          onPress={() => setSelectedDimension(null)}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.dimensionEmoji}>{currentDimension?.emoji}</Text>
          <Text style={styles.dimensionTitle}>{currentDimension?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.questionnaireContent}>
        <Text style={styles.comingSoon}>
          Cuestionario de {currentDimension?.name} próximamente...
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.onPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: palette.onPrimarySoft,
    lineHeight: 22,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.onPrimaryFaint,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.surface,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: palette.onPrimarySoft,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  dimensionCard: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dimensionCardCompleted: {
    borderWidth: 2,
    borderColor: palette.success,
  },
  dimensionIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  dimensionEmoji: {
    fontSize: 48,
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: palette.surface,
    borderRadius: 12,
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  dimensionIndicator: {
    width: 40,
    height: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: palette.secondarySoft,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: palette.secondary,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
    shadowColor: palette.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: palette.text,
    lineHeight: 20,
  },
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dimensionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.text,
  },
  questionnaireContent: {
    flex: 1,
    padding: 20,
  },
  comingSoon: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: palette.surfaceMuted,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: palette.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: palette.primary,
    borderRadius: 24,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: palette.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  completionCard: {
    backgroundColor: palette.successSoft,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: palette.success,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.success,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtext: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
