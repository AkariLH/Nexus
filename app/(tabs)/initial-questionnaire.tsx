import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DimensionQuestionnaire } from '../../components/DimensionQuestionnaire';
import preferenceService from '../../services/preference.service';
import type { PreferenceCategory, UserPreferenceRequest } from '../../types/preferences.api.types';
import { useAuth } from '../../context/AuthContext';
import { ErrorModal } from '../components/ErrorModal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useQuestionnaire } from '../../context/QuestionnaireContext';
import { palette, gradients } from '../../constants/colors';

const DIMENSIONS = [
  { id: 'physical', name: 'Bienestar Físico', icon: 'fitness', emoji: '💪', color: '#FF6B6B' },
  { id: 'emotional', name: 'Bienestar Emocional', icon: 'heart', emoji: '💖', color: '#FF8B94' },
  { id: 'social', name: 'Bienestar Social', icon: 'people', emoji: '👥', color: '#A8E6CF' },
  { id: 'intellectual', name: 'Bienestar Intelectual', icon: 'school', emoji: '🧠', color: '#87CEEB' },
  { id: 'professional', name: 'Bienestar Profesional', icon: 'briefcase', emoji: '💼', color: '#FFD3B6' },
  { id: 'environmental', name: 'Bienestar Ambiental', icon: 'leaf', emoji: '🌿', color: '#98D8C8' },
  { id: 'spiritual', name: 'Bienestar Espiritual', icon: 'sparkles', emoji: '✨', color: '#D4A5FF' },
] as const;

type WellnessDimension = typeof DIMENSIONS[number]['id'];

export default function InitialQuestionnaireScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { revalidate } = useQuestionnaire();
  const [selectedDimension, setSelectedDimension] = useState<WellnessDimension | null>(null);
  const [completedDimensions, setCompletedDimensions] = useState<Set<WellnessDimension>>(new Set());
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para modales
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ 
    visible: false, 
    title: '',
    message: '', 
    confirmText: 'Aceptar',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Redirigir si no hay usuario (solo después de cargar)
  useEffect(() => {
    if (isLoading) return; // Esperar a que termine de cargar
    
    if (!user?.userId) {
      console.log('❌ No hay usuario autenticado, redirigiendo a login');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user?.userId) return;
    
    loadCategories();
    loadUserProgress();
    
    // Bloquear el botón físico de retroceso en Android (RN-14) SOLO si no está completo
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Si ya completó todas las dimensiones, permitir navegación
      if (completedDimensions.size === DIMENSIONS.length) {
        return false; // Permitir comportamiento por defecto
      }
      handleBlockedNavigation();
      return true; // Prevenir comportamiento por defecto
    });

    return () => backHandler.remove();
  }, [user?.userId, completedDimensions]);

  const handleBlockedNavigation = () => {
    setErrorModal({
      visible: true,
      title: 'Cuestionario obligatorio',
      message: 'Debes completar todas las dimensiones del cuestionario antes de continuar. Es necesario para personalizar tu experiencia en Nexus.',
    });
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await preferenceService.getAllCategories();
      if (response.data) {
        setCategories(response.data);
      } else if (response.error) {
        setErrorModal({
          visible: true,
          title: 'Error',
          message: 'No se pudieron cargar las categorías de preferencias',
        });
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user?.userId) return;
    
    try {
      console.log('📊 Cargando progreso del usuario:', user.userId);
      const response = await preferenceService.getQuestionnaireStatus(user.userId);
      if (response.data) {
        console.log('📋 Respuesta del servidor:', JSON.stringify(response.data, null, 2));
        
        // Mapear las categorías completadas a dimensiones
        const completedCategoryNames = new Set(
          response.data.userPreferences.map(up => up.categoryName)
        );
        
        console.log('✅ Categorías con preferencias:', Array.from(completedCategoryNames));
        
        const completedDims = new Set<WellnessDimension>();
        DIMENSIONS.forEach(dim => {
          if (completedCategoryNames.has(dim.name)) {
            completedDims.add(dim.id);
          }
        });
        
        setCompletedDimensions(completedDims);
        console.log('✅ Dimensiones completadas:', Array.from(completedDims));
        console.log('📊 Estado completed:', response.data.completed);
        
        // Si ya completó todas, redirigir al home automáticamente
        if (completedDims.size === DIMENSIONS.length && response.data.completed) {
          console.log('🎉 Todas las dimensiones completadas, redirigiendo a home');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        }
      }
    } catch (error) {
      console.error('💥 Error cargando progreso:', error);
    }
  };

  const handleSavePreferences = async (
    dimensionId: WellnessDimension,
    preferences: UserPreferenceRequest[]
  ) => {
    // FA02 - Validar que se haya seleccionado al menos una preferencia
    if (preferences.length === 0) {
      setErrorModal({
        visible: true,
        title: 'Selección requerida',
        message: 'Debes seleccionar al menos una actividad o preferencia en esta dimensión.',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await preferenceService.savePreferences(user!.userId, {
        preferences,
      });

      if (response.data) {
        const newCompleted = new Set(completedDimensions);
        newCompleted.add(dimensionId);
        setCompletedDimensions(newCompleted);
        setSelectedDimension(null);

        // Verificar si completó todas las dimensiones
        if (newCompleted.size === DIMENSIONS.length) {
          // Revalidar el contexto para actualizar el caché
          await revalidate();
          
          // Mostrar modal de éxito y redirigir
          setSuccessModal({
            visible: true,
            title: '¡Cuestionario completado! 🎉',
            message: 'Has completado todas las dimensiones. Ya puedes acceder a todas las funciones de Nexus.',
          });
          
          // Redirigir después de un momento para que vea el modal
          setTimeout(() => {
            setSuccessModal({ visible: false, title: '', message: '' });
            router.replace('/(tabs)');
          }, 2000);
        } else {
          setSuccessModal({
            visible: true,
            title: 'Dimensión guardada',
            message: `Has completado ${newCompleted.size} de ${DIMENSIONS.length} dimensiones. Continúa con las siguientes.`,
          });
        }
      } else if (response.error) {
        // FA03 - Error al guardar
        setErrorModal({
          visible: true,
          title: 'Error al guardar',
          message: 'No se pudieron guardar tus preferencias. Por favor, intenta nuevamente más tarde.',
        });
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'Ocurrió un error inesperado',
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = (completedDimensions.size / DIMENSIONS.length) * 100;

  // Vista de cuestionario para una dimensión específica
  if (selectedDimension) {
    const currentDimension = DIMENSIONS.find(d => d.id === selectedDimension);
    const currentCategory = categories.find(cat => cat.name === currentDimension?.name);

    if (!currentDimension || !currentCategory) {
      return (
        <SafeAreaView style={styles.container}>
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
      />
    );
  }

  // Vista principal: cuestionario obligatorio
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerBadge}>
          <Ionicons name="clipboard" size={32} color={palette.primary} />
        </View>
        <Text style={styles.headerTitle}>Cuestionario de Preferencias</Text>
        <Text style={styles.headerSubtitle}>
          Obligatorio para continuar
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
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={palette.secondary} />
          <Text style={styles.infoText}>
            Para personalizar tu experiencia en Nexus, necesitamos conocer tus preferencias en estas 7 dimensiones del bienestar. 
            Debes completar todas antes de acceder a la aplicación.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Las 7 Dimensiones del Bienestar</Text>

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
                {!isCompleted && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pendiente</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mensaje de recordatorio */}
        <View style={styles.reminderCard}>
          <Ionicons name="alert-circle-outline" size={20} color={palette.primary} />
          <Text style={styles.reminderText}>
            Recuerda: No podrás acceder a las funciones de la app hasta completar todas las dimensiones.
          </Text>
        </View>
      </ScrollView>

      {/* Modales */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />

      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ ...successModal, visible: false })}
      />

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />
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
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: palette.onPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.onPrimarySoft,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: palette.secondarySoft,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: palette.secondary,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: 16,
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
  pendingBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: palette.primarySoft,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 11,
    color: palette.textAccent,
    fontWeight: '600',
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: palette.primarySoft,
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
    alignItems: 'center',
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
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
});
