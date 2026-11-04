import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { ResultModal } from '../../app/components/ResultModal';
import { gradients, palette } from '../../constants/colors';
import type { Celebration } from '../../utils/onboarding';

interface MilestoneCelebrationProps {
  visible: boolean;
  celebration: Celebration | null;
  /** Avance antes y después (0..1): la barra va de uno a otro. */
  from: number;
  to: number;
  onNext: () => void;
  onClose: () => void;
}

const PARTICLES = 8;

/**
 * [primeros-pasos] U4 · Figma N2a–N2d: festejo al cumplir un hito. Mismo lenguaje que ResultModal:
 * el ícono salta con resorte, brotan corazones y puntos de la marca y la barra avanza. Con
 * «Reducir movimiento» se muestra directo el estado final, sin brote.
 */
export function MilestoneCelebration({ visible, celebration, from, to, onNext, onClose }: MilestoneCelebrationProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      pop.setValue(1);
      burst.setValue(0);
      bar.setValue(to);
      return;
    }
    pop.setValue(0);
    burst.setValue(0);
    bar.setValue(from);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(burst, { toValue: 1, duration: celebration?.finished ? 900 : 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(bar, { toValue: to, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]),
    ]).start();
  }, [visible, reduceMotion, from, to, celebration?.finished, pop, burst, bar]);

  if (!celebration) return null;
  const count = celebration.finished ? PARTICLES * 2 : PARTICLES;

  const header = (
    <View style={styles.badgeArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!reduceMotion && Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const distance = (celebration.finished && i % 2 ? 78 : 58);
        const heart = i % 2 === 0;
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance - 12] }) },
                  { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1, 0.8] }) },
                ],
              },
            ]}
          >
            {heart ? (
              <Ionicons name="heart" size={14} color={i % 4 === 0 ? palette.primary : palette.secondary} />
            ) : (
              <View style={[styles.dot, { backgroundColor: i % 3 === 0 ? palette.secondary : palette.primary }]} />
            )}
          </Animated.View>
        );
      })}
      <Animated.View
        style={{
          opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
        }}
      >
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
          <Ionicons name={celebration.finished ? 'trophy-outline' : 'checkmark-circle-outline'} size={36} color={palette.onPrimary} />
        </LinearGradient>
      </Animated.View>
    </View>
  );

  return (
    <ResultModal
      visible={visible}
      header={header}
      title={celebration.title}
      subtitle={celebration.subtitle}
      primary={celebration.nextLabel ? { label: celebration.nextLabel, onPress: onNext } : { label: '¡Listo!', onPress: onClose }}
      secondary={celebration.nextLabel ? { label: 'Seguir en Inicio', onPress: onClose } : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.track} accessibilityLabel={celebration.subtitle}>
        <Animated.View style={[styles.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </ResultModal>
  );
}

const styles = StyleSheet.create({
  badgeArea: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceMuted, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: palette.primary },
});
