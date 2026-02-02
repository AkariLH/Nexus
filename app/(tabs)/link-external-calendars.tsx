import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { calendarService, ExternalCalendar } from '../../services/calendar.service';
import { externalCalendarIntegration, LinkedCalendar } from '../../services/externalCalendar.integration.service';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../components/layout/Header';
import { ErrorModal } from '../components/ErrorModal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmModal } from '../components/ConfirmModal';

export default function LinkExternalCalendarsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deviceCalendars, setDeviceCalendars] = useState<ExternalCalendar[]>([]);
  const [linkedCalendars, setLinkedCalendars] = useState<LinkedCalendar[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({ visible: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({ visible: false, message: "", onConfirm: () => {} });

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Cargar calendarios del dispositivo
      const deviceCals = await calendarService.getAvailableCalendars();
      setDeviceCalendars(deviceCals);

      // Cargar calendarios ya vinculados
      const linkedCals = await externalCalendarIntegration.getUserLinkedCalendars(user.userId);
      setLinkedCalendars(linkedCals);
    } catch (error) {
      console.error('Error loading calendars:', error);
      setErrorModal({ visible: true, message: 'No se pudieron cargar los calendarios' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCalendar = async (calendar: ExternalCalendar) => {
    if (!user) return;

    try {
      setLoading(true);

      await externalCalendarIntegration.linkCalendar(
        user.userId,
        calendar.id,
        calendar.title,
        calendar.source.type,
        calendar.color,
        true,
        'BUSY_ONLY'
      );

      setSuccessModal({ visible: true, message: `Calendario "${calendar.title}" vinculado correctamente` });
      await loadCalendars();
    } catch (error) {
      console.error('Error vinculando calendario:', error);
      setErrorModal({ visible: true, message: 'No se pudo vincular el calendario' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCalendar = async (calendar: LinkedCalendar) => {
    if (!user) return;

    setConfirmModal({
      visible: true,
      message: `¿Deseas desvincular "${calendar.calendarName}"? Se eliminarán todos los eventos sincronizados de este calendario.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await externalCalendarIntegration.unlinkCalendar(user.userId, calendar.deviceCalendarId);
          setSuccessModal({ visible: true, message: 'Calendario desvinculado y eventos eliminados' });
          await loadCalendars();
        } catch (error) {
          console.error('Error desvinculando calendario:', error);
          setErrorModal({ visible: true, message: 'No se pudo desvincular el calendario' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleSync = async (calendar: LinkedCalendar, enabled: boolean) => {
    if (!user) return;

    try {
      await externalCalendarIntegration.updateCalendarSettings(
        user.userId,
        calendar.deviceCalendarId,
        enabled,
        undefined
      );
      await loadCalendars();
    } catch (error) {
      console.error('Error actualizando sincronización:', error);
      setErrorModal({ visible: true, message: 'No se pudo actualizar la configuración' });
    }
  };

  const handleTogglePrivacy = async (calendar: LinkedCalendar) => {
    if (!user) return;

    const newMode = calendar.privacyMode === 'FULL_DETAILS' ? 'BUSY_ONLY' : 'FULL_DETAILS';

    try {
      await externalCalendarIntegration.updateCalendarSettings(
        user.userId,
        calendar.deviceCalendarId,
        undefined,
        newMode
      );
      await loadCalendars();
    } catch (error) {
      console.error('Error toggling privacy:', error);
      setErrorModal({ visible: true, message: 'No se pudo actualizar la privacidad' });
    }
  };

  const handleSyncNow = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      await externalCalendarIntegration.performPeriodicSync(user.userId);
      setSuccessModal({ visible: true, message: 'Los calendarios han sido sincronizados' });
      await loadCalendars();
    } catch (error: any) {
      console.error('Error en sincronización:', error);
      
      // Mensaje más específico según el tipo de error
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        setErrorModal({ 
          visible: true, 
          message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://192.168.1.95:8080'
        });
      } else {
        setErrorModal({ visible: true, message: 'No se pudo sincronizar los calendarios' });
      }
    } finally {
      setSyncing(false);
    }
  };

  const isCalendarLinked = (deviceCalendarId: string) => {
    return linkedCalendars.some(cal => cal.deviceCalendarId === deviceCalendarId && cal.isActive);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando calendarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => router.back()} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Calendarios Externos</Text>
          <Text style={styles.subtitle}>
            Vincula tus calendarios para sincronizar eventos con tu pareja
          </Text>
        </View>

        {/* Calendarios vinculados */}
        {linkedCalendars.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendarios Vinculados</Text>
            {linkedCalendars.map((calendar) => (
              <View key={calendar.id} style={styles.calendarCard}>
                <View style={styles.calendarHeader}>
                  <View style={[styles.colorDot, { backgroundColor: calendar.calendarColor }]} />
                  <View style={styles.calendarInfo}>
                    <Text style={styles.calendarName}>{calendar.calendarName}</Text>
                    <Text style={styles.calendarSource}>{calendar.calendarSource}</Text>
                    {calendar.lastSync && (
                      <Text style={styles.lastSync}>
                        Última sync: {new Date(calendar.lastSync).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingLabel}>Sincronizar</Text>
                  <Switch
                    value={calendar.syncEnabled}
                    onValueChange={(value) => handleToggleSync(calendar, value)}
                    trackColor={{ false: '#E5E5E5', true: '#FF4F81' }}
                    thumbColor={calendar.syncEnabled ? '#FFFFFF' : '#F4F4F4'}
                  />
                </View>

                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={() => handleTogglePrivacy(calendar)}
                >
                  <Text style={styles.settingLabel}>Privacidad</Text>
                  <Text style={styles.privacyMode}>
                    {calendar.privacyMode === 'FULL_DETAILS' ? 'Detalles completos' : 'Solo ocupado/libre'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={() => handleUnlinkCalendar(calendar)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.unlinkButtonText}>Desvincular</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncNow}
              disabled={syncing}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF4F81', '#8A2BE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.syncButtonGradient}
              >
                {syncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.syncButtonText}>Sincronizar Ahora</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Calendarios disponibles para vincular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendarios Disponibles</Text>
          {deviceCalendars.filter(cal => cal.allowsModifications !== false).length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron calendarios en tu dispositivo</Text>
          ) : (
            deviceCalendars
              .filter(cal => cal.allowsModifications !== false)
              .map((calendar) => {
              const linked = isCalendarLinked(calendar.id);
              return (
                <View key={calendar.id} style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <View style={[styles.colorDot, { backgroundColor: calendar.color }]} />
                    <View style={styles.calendarInfo}>
                      <Text style={styles.calendarName}>{calendar.title}</Text>
                      <Text style={styles.calendarSource}>
                        {calendar.source.name} ({calendar.source.type})
                      </Text>
                      {calendar.isPrimary && (
                        <Text style={styles.primaryBadge}>📍 Principal</Text>
                      )}
                    </View>
                  </View>

                  {linked ? (
                    <View style={styles.linkedBadge}>
                      <Text style={styles.linkedBadgeText}>✅ Vinculado</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => handleLinkCalendar(calendar)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={['#FF4F81', '#8A2BE2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.linkButtonGradient}
                      >
                        <Text style={styles.linkButtonText}>Vincular</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modales */}
      <ErrorModal
        visible={errorModal.visible}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, message: "" })}
      />

      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, message: "" })}
      />

      <ConfirmModal
        visible={confirmModal.visible}
        title="Desvincular calendario"
        message={confirmModal.message}
        confirmText="Desvincular"
        cancelText="Cancelar"
        type="confirm"
        onConfirm={() => {
          setConfirmModal({ visible: false, message: "", onConfirm: () => {} });
          confirmModal.onConfirm();
        }}
        onCancel={() => setConfirmModal({ visible: false, message: "", onConfirm: () => {} })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1A1A1A99',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#1A1A1A99',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  calendarSource: {
    fontSize: 13,
    color: '#1A1A1A99',
  },
  lastSync: {
    fontSize: 12,
    color: '#1A1A1A99',
    marginTop: 4,
  },
  primaryBadge: {
    fontSize: 12,
    color: '#FF4F81',
    marginTop: 4,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  settingLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  privacyMode: {
    fontSize: 14,
    color: '#FF4F81',
    fontWeight: '600',
  },
  linkButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  linkButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  unlinkButton: {
    backgroundColor: '#EF4444',
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  unlinkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  linkedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  linkedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  syncButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  syncButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#1A1A1A99',
    padding: 24,
  },
});
