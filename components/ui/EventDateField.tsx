import { Platform, StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { WebDateInput } from "./WebDateInput";
import { palette } from "../../constants/colors";
import { toDateInput, toTimeInput, withDateInput, withTimeInput } from "../../utils/eventForm";

type Props = {
  kind: "date" | "time";
  /** Valor actual (la parte que no se edita se conserva al elegir). */
  value: Date;
  /** Si ya se eligió; si no, el campo del navegador sale vacío. */
  selected: boolean;
  /** Texto que se ve en el teléfono ("Elige la fecha", "sáb 20 nov"...). */
  label: string;
  /** Teléfono: abre el selector nativo. */
  onOpen: () => void;
  /** Web: la fecha/hora elegida en el navegador. */
  onPick: (next: Date) => void;
  /** Web: fecha mínima "2026-11-20" (solo para kind="date"). */
  min?: string;
  invalid?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  /** Lugar en la fila (flex); en la web es lo único que se aplica. */
  layoutStyle: StyleProp<ViewStyle>;
  /** Caja del campo en el teléfono (borde, fondo). */
  boxStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

/** En la web, el campo del navegador con el mismo aspecto que los de Crear evento. */
const WEB_EVENT_FIELD = {
  height: 50,
  borderRadius: 12,
  backgroundColor: palette.surface,
  textAlign: "center",
  padding: "0 8px",
};

/**
 * [fecha-web] Campo de fecha u hora de Crear / Editar evento. En el teléfono abre el selector
 * nativo como antes; en la web ese selector no existe (igual que pasaba en el registro), así que se
 * usa el campo del navegador.
 */
export function EventDateField(props: Props) {
  const { kind, value, selected, label, onOpen, onPick, min, invalid, disabled, accessibilityLabel, layoutStyle, boxStyle, textStyle } = props;
  if (Platform.OS === "web") {
    return (
      <View style={layoutStyle}>
        <WebDateInput
          type={kind}
          value={selected ? (kind === "date" ? toDateInput(value) : toTimeInput(value)) : ""}
          onChange={(raw) => {
            const next = kind === "date" ? withDateInput(value, raw) : withTimeInput(value, raw);
            if (next) onPick(next);
          }}
          min={kind === "date" ? min : undefined}
          invalid={invalid}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          inputStyle={WEB_EVENT_FIELD}
        />
      </View>
    );
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[layoutStyle, boxStyle]}
      onPress={onOpen}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
