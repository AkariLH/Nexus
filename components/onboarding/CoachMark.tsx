import { RefObject, useCallback, useEffect, useState } from 'react';
import {
  InteractionManager,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { palette } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { GuideScreen, markSeen, wasSeen } from '../../utils/guideStore';
import { GradientButton } from '../../app/components/ui/GradientButton';

/** Lo único que la guía necesita del elemento señalado: medirse en la ventana. */
export interface Measurable {
  measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
}

export interface CoachStep {
  target: RefObject<Measurable | null>;
  title: string;
  text: string;
}

interface CoachMarkProps {
  screen: GuideScreen;
  /** Máximo 3 pasos por pantalla. */
  steps: CoachStep[];
  /** false mientras otro modal está abierto: la guía espera (R4). */
  enabled?: boolean;
}

type Box = { x: number; y: number; width: number; height: number };

const PAD = 6;
const BUBBLE_GAP = 14;

/**
 * Pasa la medida del elemento a coordenadas de la guía. En Android la guía es un Modal que cubre
 * también la barra de estado (statusBarTranslucent), pero `measureInWindow` mide desde debajo de
 * esa barra: sin esta corrección el hueco quedaba corrido hacia arriba esa altura (visto 03-nov).
 */
export function toOverlay(box: Box, os: string, statusBarHeight: number | undefined): Box {
  if (os !== 'android' || !statusBarHeight) return box;
  return { ...box, y: box.y + statusBarHeight };
}

function measure(step: CoachStep): Promise<Box | null> {
  return new Promise(resolve => {
    const node = step.target.current;
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => {
      const valid = [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0;
      resolve(valid ? { x, y, width, height } : null);
    });
  });
}

/**
 * [primeros-pasos] U5 · Figma N3: guía de primera visita. Oscurece la pantalla menos el elemento
 * señalado y muestra una burbuja con «Siguiente» y «Saltar». Se mide después de las animaciones
 * de entrada; sin una medida válida no aparece (R3). Al terminar o saltar, no vuelve a salir.
 */
export function CoachMark({ screen, steps, enabled = true }: CoachMarkProps) {
  const { user } = useAuth();
  const userId = user?.userId;
  const { width: winW, height: winH } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [active, setActive] = useState(false);
  const shown = steps.slice(0, 3);

  const showStep = useCallback(async (i: number) => {
    const measured = await measure(shown[i]);
    // Fuera de la pantalla (p. ej. debajo del pliegue) tampoco cuenta: no se adivina (R3).
    if (!measured || measured.y < 0 || measured.y + measured.height > winH) {
      setActive(false);
      return;
    }
    setIndex(i);
    setBox(toOverlay(measured, Platform.OS, StatusBar.currentHeight));
    setActive(true);
  }, [shown, winH]);

  useEffect(() => {
    if (!enabled || !userId || shown.length === 0) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(async () => {
      if (await wasSeen(userId, screen)) return;
      if (!cancelled) showStep(0);
    });
    return () => {
      cancelled = true;
      task.cancel?.();
    };
    // Al habilitarse, al cambiar de cuenta/pantalla o cuando llegan los pasos (datos cargados);
    // cada paso se mide al mostrarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, screen, shown.length]);

  const finish = useCallback(() => {
    setActive(false);
    if (userId) markSeen(userId, screen);
  }, [userId, screen]);

  if (!active || !box) return null;
  const step = shown[index];
  const last = index === shown.length - 1;
  const hole = { x: box.x - PAD, y: box.y - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 };
  const below = hole.y + hole.height + 180 < winH;
  const bubbleTop = below ? hole.y + hole.height + BUBBLE_GAP : undefined;
  const bubbleBottom = below ? undefined : winH - hole.y + BUBBLE_GAP;
  const tipLeft = Math.min(Math.max(hole.x + hole.width / 2 - 8, 32), winW - 48);

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={finish}>
      <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
        {/* Cuatro piezas oscuras alrededor del hueco: lo señalado se ve tal cual */}
        <View style={[styles.shade, { top: 0, left: 0, right: 0, height: Math.max(hole.y, 0) }]} />
        <View style={[styles.shade, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]} />
        <View style={[styles.shade, { top: hole.y, left: 0, width: Math.max(hole.x, 0), height: hole.height }]} />
        <View style={[styles.shade, { top: hole.y, left: hole.x + hole.width, right: 0, height: hole.height }]} />
        <View pointerEvents="none" style={[styles.ring, { top: hole.y, left: hole.x, width: hole.width, height: hole.height }]} />

        <View
          pointerEvents="none"
          style={[styles.tip, below ? { top: hole.y + hole.height + BUBBLE_GAP - 7 } : { top: hole.y - BUBBLE_GAP - 9 }, { left: tipLeft }]}
        />
        <View style={[styles.bubble, { top: bubbleTop, bottom: bubbleBottom }]}>
          <Text style={styles.title} accessibilityRole="header">{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>
          <View style={styles.footer}>
            <Text style={styles.count}>{`${index + 1} de ${shown.length}`}</Text>
            <View style={styles.spacer} />
            {!last && (
              <TouchableOpacity onPress={finish} accessibilityRole="button" hitSlop={12} style={styles.skip}>
                <Text style={styles.skipText}>Saltar</Text>
              </TouchableOpacity>
            )}
            <GradientButton
              title={last ? 'Entendido' : 'Siguiente'}
              onPress={() => (last ? finish() : showStep(index + 1))}
              style={styles.next}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  ring: { position: 'absolute', borderRadius: 20, borderWidth: 2, borderColor: palette.primary },
  tip: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: palette.surface,
    transform: [{ rotate: '45deg' }],
  },
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
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  count: { fontSize: 13, color: palette.textMuted },
  spacer: { flex: 1 },
  skip: { minHeight: 44, justifyContent: 'center' },
  skipText: { fontSize: 14, fontWeight: '600', color: palette.textAccent },
  next: { minWidth: 120 },
});
