import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gradients, palette } from '../../constants/colors';

interface TermsConsentProps {
  checked: boolean;
  onToggle: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

/**
 * [terminos-en-app] Figma O1: casilla de Crear cuenta. «términos» y «aviso de privacidad» abren su
 * texto; la casilla y el resto del renglón la marcan.
 */
export function TermsConsent({ checked, onToggle, onOpenTerms, onOpenPrivacy }: TermsConsentProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel="Acepto los términos y el aviso de privacidad"
        hitSlop={8}
      >
        {checked ? (
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkbox}>
            <Ionicons name="checkmark" size={16} color={palette.onPrimary} />
          </LinearGradient>
        ) : (
          <View style={[styles.checkbox, styles.checkboxEmpty]} />
        )}
      </TouchableOpacity>
      <Text style={styles.text} onPress={onToggle}>
        Acepto los{' '}
        <Text style={styles.link} onPress={onOpenTerms} accessibilityRole="link">
          términos
        </Text>{' '}
        y el{' '}
        <Text style={styles.link} onPress={onOpenPrivacy} accessibilityRole="link">
          aviso de privacidad
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxEmpty: { borderWidth: 2, borderColor: palette.border, backgroundColor: palette.surface },
  text: { flex: 1, fontSize: 14, color: palette.text },
  link: { color: palette.textAccent, fontWeight: '500', textDecorationLine: 'underline' },
});
