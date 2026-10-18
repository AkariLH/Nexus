import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import { calendarService, ExternalCalendar } from '../../services/calendar.service';
import { externalCalendarIntegration, LinkedCalendar } from '../../services/externalCalendar.integration.service';
import { useAuth } from '../../context/AuthContext';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { ErrorModal } from '../components/ErrorModal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { GradientButton } from '../components/ui/GradientButton';
import { Card, ListRow, Pill, SectionLabel, SoftIcon } from '../../components/ui/Surface';
import { palette, switchColors } from '../../constants/colors';

/** En web no hay calendario del dispositivo: se explica en vez de mostrar un error. */
const ON_WEB = Platform.OS === 'web';

/**
 * RF-19..24 - Calendarios del teléfono que se comparten con la pareja. Con el estilo de F/G
 * (encabezado, tarjetas y textos cortos); la lógica de vincular, sincronizar y privacidad no cambia.
 */
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
      if (!ON_WEB) {
        setDeviceCalendars(await calendarService.getAvailableCalendars());
      }
      setLinkedCalendars(await externalCalendarIntegration.getUserLinkedCalendars(user.userId));
    } catch (error) {
      console.error('Error loading calendars:', error);
      setErrorModal({
        visible: true,
        message: 'No pudimos leer los calendarios del teléfono. Revisa que Nexus tenga permiso de calendario en los ajustes.',
      });
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
      setSuccessModal({ visible: true, message: `"${calendar.title}" ya se comparte con tu pareja` });
      await loadCalendars();
    } catch (error) {
      console.error('Error vinculando calendario:', error);
      setErrorModal({ visible: true, message: 'No se pudo vincular el calendario. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCalendar = async (calendar: LinkedCalendar) => {
    if (!user) return;

    setConfirmModal({
      visible: true,
      message: `Tu pareja dejará de ver los horarios de "${calendar.calendarName}". Los eventos del teléfono no se borran.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await externalCalendarIntegration.unlinkCalendar(user.userId, calendar.deviceCalendarId);
          setSuccessModal({ visible: true, message: 'Calendario desvinculado' });
          await loadCalendars();
        } catch (error) {
          console.error('Error desvinculando calendario:', error);
          setErrorModal({ visible: true, message: 'No se pudo desvincular el calendario. Inténtalo de nuevo.' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleSync = async (calendar: LinkedCalendar, enabled: boolean) => {
    if (!user) return;

    try {
      await externalCalendarIntegration.updateCalendarSettings(user.userId, calendar.deviceCalendarId, enabled, undefined);
      await loadCalendars();
    } catch (error) {
      console.error('Error actualizando sincronización:', error);
      setErrorModal({ visible: true, message: 'No se pudo cambiar la sincronización. Inténtalo de nuevo.' });
    }
  };

  const handleTogglePrivacy = async (calendar: LinkedCalendar) => {
    if (!user) return;

    const newMode = calendar.privacyMode === 'FULL_DETAILS' ? 'BUSY_ONLY' : 'FULL_DETAILS';
    try {
      await externalCalendarIntegration.updateCalendarSettings(user.userId, calendar.deviceCalendarId, undefined, newMode);
      await loadCalendars();
    } catch (error) {
      console.error('Error toggling privacy:', error);
      setErrorModal({ visible: true, message: 'No se pudo cambiar lo que ve tu pareja. Inténtalo de nuevo.' });
    }
  };

  const handleSyncNow = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      await externalCalendarIntegration.performPeriodicSync(user.userId);
      setSuccessModal({ visible: true, message: 'Calendarios al día' });
      await loadCalendars();
    } catch (error: any) {
      console.error('Error en sincronización:', error);
      const offline = error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error');
      setErrorModal({
        visible: true,
        message: offline
          ? 'Sin conexión con Nexus. Revisa tu internet e inténtalo de nuevo.'
          : 'No se pudieron sincronizar los calendarios. Inténtalo de nuevo.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const isCalendarLinked = (deviceCalendarId: string) =>
    linkedCalendars.some(cal => cal.deviceCalendarId === deviceCalendarId && cal.isActive);

  const available = deviceCalendars.filter(cal => cal.allowsModifications !== false);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Calendarios externos" onBack={() => router.back()} />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>
            Tu pareja ve tus horarios ocupados. Tú decides si también ve los detalles.
          </Text>

          {linkedCalendars.length > 0 && (
            <View style={styles.section}>
              <SectionLabel>Compartidos</SectionLabel>
              {linkedCalendars.map((calendar) => (
                <Card key={calendar.id} style={styles.card}>
                  <View style={styles.calendarHeader}>
                    <View style={[styles.colorDot, { backgroundColor: calendar.calendarColor }]} />
                    <View style={styles.calendarInfo}>
                      <Text style={styles.calendarName}>{calendar.calendarName}</Text>
                      {calendar.lastSync && (
                        <Text style={styles.meta}>
                          Actualizado {new Date(calendar.lastSync).toLocaleString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <ListRow
                    icon="sync-outline"
                    title="Sincronizar"
                    trailing={
                      <Switch
                        value={calendar.syncEnabled}
                        onValueChange={(value) => handleToggleSync(calendar, value)}
                        accessibilityLabel={`Sincronizar ${calendar.calendarName}`}
                        {...switchColors}
                      />
                    }
                  />
                  <View style={styles.divider} />
                  <ListRow
                    icon="eye-outline"
                    title="Tu pareja ve"
                    subtitle="Toca para cambiar"
                    onPress={() => handleTogglePrivacy(calendar)}
                    trailing={<Pill label={calendar.privacyMode === 'FULL_DETAILS' ? 'Los detalles' : 'Solo ocupado'} />}
                  />
                  <TouchableOpacity
                    onPress={() => handleUnlinkCalendar(calendar)}
                    style={styles.unlink}
                    accessibilityRole="button"
                  >
                    <Text style={styles.unlinkText}>Dejar de compartir</Text>
                  </TouchableOpacity>
                </Card>
              ))}
              {!ON_WEB && <GradientButton title="Sincronizar ahora" onPress={handleSyncNow} loading={syncing} />}
            </View>
          )}

          <View style={styles.section}>
            <SectionLabel>En tu teléfono</SectionLabel>
            {ON_WEB ? (
              <Card style={styles.webCard}>
                <SoftIcon name="phone-portrait-outline" />
                <Text style={styles.webText}>
                  Los calendarios se vinculan desde la app en tu teléfono.
                </Text>
              </Card>
            ) : available.length === 0 ? (
              <Text style={styles.empty}>No encontramos calendarios en tu teléfono.</Text>
            ) : (
              <Card style={styles.card}>
                {available.map((calendar, index) => {
                  const linked = isCalendarLinked(calendar.id);
                  return (
                    <View key={calendar.id}>
                      {index > 0 && <View style={styles.divider} />}
                      <View style={styles.availableRow}>
                        <View style={[styles.colorDot, { backgroundColor: calendar.color }]} />
                        <View style={styles.calendarInfo}>
                          <Text style={styles.calendarName}>{calendar.title}</Text>
                          <Text style={styles.meta}>{calendar.isPrimary ? 'Principal · ' : ''}{calendar.source.name}</Text>
                        </View>
                        {linked ? (
                          <Pill label="Compartido" tone="success" icon="checkmark" />
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleLinkCalendar(calendar)}
                            style={styles.linkButton}
                            accessibilityRole="button"
                            accessibilityLabel={`Compartir ${calendar.title}`}
                          >
                            <Text style={styles.linkText}>Compartir</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </View>
        </ScrollView>
      )}

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
        title="Dejar de compartir"
        message={confirmModal.message}
        confirmText="Dejar de compartir"
        cancelText="Cancelar"
        type="confirm"
        onConfirm={() => {
          setConfirmModal({ visible: false, message: "", onConfirm: () => {} });
          confirmModal.onConfirm();
        }}
        onCancel={() => setConfirmModal({ visible: false, message: "", onConfirm: () => {} })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 24 },
  intro: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  section: { gap: 12 },
  card: { gap: 0 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  calendarInfo: { flex: 1, gap: 2 },
  calendarName: { fontSize: 15, fontWeight: '600', color: palette.text },
  meta: { fontSize: 12, color: palette.textSecondary },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 12 },
  unlink: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 4 },
  unlinkText: { fontSize: 14, fontWeight: '600', color: palette.error },
  availableRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.primarySoft,
  },
  linkText: { fontSize: 13, fontWeight: '600', color: palette.textAccent },
  webCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  webText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.text },
  empty: { fontSize: 14, color: palette.textSecondary },
});
