import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../app/components/layout/ScreenHeader';
import { Card, SoftIcon } from '../ui/Surface';
import { palette } from '../../constants/colors';
import type { LegalSection } from '../../constants/legal';

/** [terminos-en-app] Figma O2/O3: una tarjeta por párrafo, con ícono suave y título corto. */
export function LegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((s) => (
          <Card key={s.title} style={styles.card}>
            <View style={styles.head}>
              <SoftIcon name={s.icon} />
              <Text style={styles.heading}>{s.title}</Text>
            </View>
            <Text style={styles.text}>{s.text}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { flex: 1, fontSize: 16, fontWeight: '700', color: palette.text },
  text: { fontSize: 15, lineHeight: 22, color: palette.textSecondary, textAlign: 'justify' },
});
