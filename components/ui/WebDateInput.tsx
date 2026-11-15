import { createElement } from "react";
import { palette } from "../../constants/colors";

type Props = {
  /** [fecha-web] "date" (por omisión) o "time" para la hora de los eventos. */
  type?: "date" | "time";
  /** "2001-03-14" (o "18:30" si es hora), o "" si no hay valor. */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  /** [fecha-web] Ajustes de estilo para igualar el campo de la pantalla (p. ej. Crear evento). */
  inputStyle?: Record<string, string | number>;
};

/**
 * Solo web: el selector de @react-native-community/datetimepicker no existe en el navegador, así
 * que se usa el campo de fecha del propio navegador con el mismo aspecto que el campo de la app.
 */
export function WebDateInput({ type = "date", value, onChange, min, max, invalid, disabled, accessibilityLabel, inputStyle }: Props) {
  return createElement("input", {
    type,
    value,
    min,
    max,
    disabled,
    "aria-label": accessibilityLabel,
    "aria-invalid": invalid || undefined,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    style: {
      boxSizing: "border-box",
      width: "100%",
      height: 54,
      borderRadius: 14,
      border: invalid ? `2px solid ${palette.error}` : `1px solid ${palette.border}`,
      backgroundColor: palette.surfaceMuted,
      color: value ? palette.text : palette.textMuted,
      padding: "0 16px",
      fontSize: 16,
      fontFamily: "inherit",
      accentColor: palette.secondary,
      ...inputStyle,
    },
  });
}
