import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "../../constants/colors";
import type { PlaceDetail } from "../../utils/recommendationFormat";

const open = (url: string) => {
  Linking.openURL(url).catch((error) => console.warn("No se pudo abrir", url, error));
};

const LinkButton = ({ icon, label, url }: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }) => (
  <TouchableOpacity style={styles.link} onPress={() => open(url)} accessibilityRole="link" accessibilityLabel={label}>
    <Ionicons name={icon} size={14} color={palette.textAccent} />
    <Text style={styles.linkText}>{label}</Text>
  </TouchableOpacity>
);

/**
 * [kb-lugares] U8 - Figma "Bloque lugar": nombre · alcaldia, direccion y colonia, y botones
 * "Cómo llegar" (siempre), "Sitio web" y "Llamar" (solo si el lugar tiene el dato). Lo usan la
 * tarjeta individual y la conjunta; en casa no se muestra.
 */
export function PlaceBlock({ detail }: { detail: PlaceDetail }) {
  return (
    <View style={styles.block}>
      <View style={styles.nameRow}>
        <Ionicons name="location-outline" size={16} color={palette.icon} />
        <Text style={styles.name}>{detail.name}</Text>
      </View>
      {detail.address ? <Text style={styles.address}>{detail.address}</Text> : null}
      <View style={styles.links}>
        <LinkButton icon="map-outline" label="Cómo llegar" url={detail.mapsUrl} />
        {detail.websiteUrl ? <LinkButton icon="globe-outline" label="Sitio web" url={detail.websiteUrl} /> : null}
        {detail.phoneUrl ? <LinkButton icon="call-outline" label="Llamar" url={detail.phoneUrl} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: palette.text,
  },
  address: {
    marginLeft: 20,
    fontSize: 12,
    color: palette.textSecondary,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 2,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textAccent,
  },
});
