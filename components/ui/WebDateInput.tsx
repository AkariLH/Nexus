import { createElement } from "react";
import { palette } from "../../constants/colors";

type Props = {
  /** "2001-03-14" o "" si no hay fecha. */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
};

/**
 * Solo web: el selector de @react-native-community/datetimepicker no existe en el navegador, así
 * que se usa el campo de fecha del propio navegador con el mismo aspecto que el campo de la app.
 */
export function WebDateInput({ value, onChange, min, max, invalid, disabled, accessibilityLabel }: Props) {
  return createElement("input", {
    type: "date",
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
    },
  });
}
