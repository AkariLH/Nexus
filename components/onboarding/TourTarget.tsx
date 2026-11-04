import { ReactNode, useEffect, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useOptionalTour } from '../../context/TourContext';
import type { TargetId } from '../../utils/tours';

/**
 * [primeros-pasos] T3: marca algo que el recorrido puede resaltar. No cambia el aspecto: solo
 * envuelve en una View que se puede medir (collapsable=false para que Android no la quite).
 * Sin TourProvider (p. ej. en la prueba de una pantalla sola) solo dibuja lo de adentro.
 */
export function TourTarget({ id, children, style }: { id: TargetId; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const tour = useOptionalTour();
  const register = tour?.register;
  const unregister = tour?.unregister;
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!register || !unregister) return;
    register(id, ref);
    return () => unregister(id, ref);
  }, [id, register, unregister]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
