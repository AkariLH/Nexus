import { AccessibilityInfo, Animated } from 'react-native';

let reduceMotion = false;

AccessibilityInfo.isReduceMotionEnabled?.()
  ?.then((enabled) => {
    reduceMotion = enabled;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
  reduceMotion = enabled;
});

/**
 * Animated.loop para movimiento decorativo (flotar, latir, girar). Si la persona activo
 * "reducir movimiento" en su telefono, el ciclo no arranca y el elemento se queda quieto.
 */
export function decorativeLoop(
  animation: Animated.CompositeAnimation,
  config?: Animated.LoopAnimationConfig
): Animated.CompositeAnimation {
  const loop = Animated.loop(animation, config);
  if (!reduceMotion) return loop;
  return {
    ...loop,
    start: (callback?: Animated.EndCallback) => callback?.({ finished: true }),
  };
}
