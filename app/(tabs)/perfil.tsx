import { Image, StyleSheet, Text, View } from "react-native";

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/react-logo.png")}
        style={styles.avatar}
      />
      <Text style={styles.name}>Tu Perfil</Text>
      <Text style={styles.desc}>Configura tu cuenta y preferencias.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  avatar: { width: 100, height: 100, marginBottom: 20 },
  name: { fontSize: 22, color: "#8A2BE2", fontWeight: "bold" },
  desc: { fontSize: 14, color: "#4A4A4A", marginTop: 5 },
});
