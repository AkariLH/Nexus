import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { palette } from '../../constants/colors';
import { useTour } from '../../context/TourContext';
import { GradientButton } from '../../app/components/ui/GradientButton';

type Box = { x: number; y: number; width: number; height: number };

const PAD = 6;
const GAP = 14;
const POLL_MS = 250;
const GIVE_UP_MS = 3000;

/**
 * [primeros-pasos] T4 · Figma N5: capa del recorrido. Va en la misma ventana que la app (no en un
 * Modal): las cuatro sombras se quedan con los toques y el hueco deja pasar el dedo a lo resaltado.
 * Mide cada 250 ms para seguir a lo resaltado si la pantalla se mueve; si no aparece en 3 s, se
 * detiene (R11). En pausa (modal abierto) no se dibuja ni cuenta el tiempo (R13).
 */
export function TourOverlay() {
  const { active, paused, next, stop, target } = useTour();
  const { width: winW, height: winH } = useWindowDimensions();
  const [box, setBox] = useState<Box | null>(null);
  const targetId = active?.step.target;
  const stepKey = active ? `${active.tour}:${active.index}` : null;

  useEffect(() => {
    setBox(null);
    if (!stepKey || !targetId || paused) return;
    let waited = 0;
    let found = false;
    const tick = () => {
      const node = target(targetId)?.current;
      if (node) {
        node.measureInWindow((x, y, width, height) => {
          const valid = [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
            && y >= 0 && y + height <= winH;
          if (valid) {
            found = true;
            setBox(prev => (prev && prev.x === x && prev.y === y && prev.width === width && prev.height === height
              ? prev : { x, y, width, height }));
          }
        });
      }
      waited += POLL_MS;
      if (!found && waited >= GIVE_UP_MS) stop();
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [stepKey, targetId, paused, target, stop, winH]);

  if (!active || paused || !box) return null;
  const { step, index, total } = active;
  const last = index === total - 1;
  const hole = { x: box.x - PAD, y: box.y - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 };
  const below = hole.y + hole.height + 170 < winH;
  const tipLeft = Math.min(Math.max(hole.x + hole.width / 2 - 8, 32), winW - 48);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.shade, { top: 0, left: 0, right: 0, height: Math.max(hole.y, 0) }]} />
      <View style={[styles.shade, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.shade, { top: hole.y, left: 0, width: Math.max(hole.x, 0), height: hole.height }]} />
      <View style={[styles.shade, { top: hole.y, left: hole.x + hole.width, right: 0, height: hole.height }]} />
      <View pointerEvents="none" style={[styles.ring, { top: hole.y, left: hole.x, width: hole.width, height: hole.height }]} />
      <View
        pointerEvents="none"
        style={[styles.tip, below ? { top: hole.y + hole.height + GAP - 7 } : { top: hole.y - GAP - 9 }, { left: tipLeft }]}
      />
      <View
        style={[styles.bubble, below ? { top: hole.y + hole.height + GAP } : { bottom: winH - hole.y + GAP }]}
        accessibilityViewIsModal={false}
      >
        <Text style={styles.title} accessibilityRole="header">{step.title}</Text>
        <Text style={styles.text}>{step.text}</Text>
        <View style={styles.footer}>
          <Text style={styles.count}>{`${index + 1} de ${total}`}</Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={stop} accessibilityRole="button" hitSlop={12} style={styles.exit}>
            <Text style={styles.exitText}>Salir</Text>
          </TouchableOpacity>
          {step.advance === 'next' && (
            <GradientButton title={last ? 'Entendido' : 'Siguiente'} onPress={next} style={styles.next} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  ring: { position: 'absolute', borderRadius: 18, borderWidth: 2, borderColor: palette.primary },
  tip: { position: 'absolute', width: 16, height: 16, backgroundColor: palette.surface, transform: [{ rotate: '45deg' }] },
  bubble: {
    position: 'absolute',
    left: 24,
    right: 24,
    padding: 16,
    gap: 8,
    borderRadius: 16,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: palette.text },
  text: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, minHeight: 44 },
  count: { fontSize: 13, color: palette.textMuted },
  spacer: { flex: 1 },
  exit: { minHeight: 44, justifyContent: 'center' },
  exitText: { fontSize: 14, fontWeight: '600', color: palette.textAccent },
  next: { minWidth: 120 },
});
