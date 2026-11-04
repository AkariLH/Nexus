import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useQuestionnaire } from "../../context/QuestionnaireContext";
import { palette } from "../../constants/colors";
import { PlatformPressable } from "@react-navigation/elements";
import { TourTarget } from "../../components/onboarding/TourTarget";

// Pantallas que se abren desde Perfil: llevan encabezado con regreso y no son de ninguna pestaña,
// asi que no se muestra la barra (antes aparecia sin ninguna pestaña marcada).
const SUBSCREEN = { display: "none" as const };

export default function TabLayout() {
  const { isCompleted, isLoading } = useQuestionnaire();

  // Mostrar loading mientras verifica
  if (isLoading || isCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.surface }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  // Listener para cambios en las tabs cuando el cuestionario no está completo
  const handleTabPress = (e: any, routeName: string) => {
    if (!isCompleted && routeName !== 'initial-questionnaire') {
      e.preventDefault();
    }
  };

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.textAccent,
        tabBarInactiveTintColor: palette.textSecondary,
        // [ux-ajustes] D5: etiquetas a 12 px (la letra por defecto es de 10).
        // lineHeight 12 deja la barra del mismo alto: con el interlineado por defecto se cortaba abajo.
        tabBarLabelStyle: { fontSize: 12, lineHeight: 12 },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 0,
          elevation: 5,
          display: isCompleted ? 'flex' : 'none', // Mostrar tabs solo si completó
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'index'),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'calendario'),
        }}
      />
      <Tabs.Screen
        name="link"
        options={{
          title: "Vínculo",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "link" : "link-outline"} color={color} size={24} />
          ),
          // [primeros-pasos] T3: el recorrido puede resaltar esta pestaña; mismo botón de siempre.
          tabBarButton: (props) => (
            <TourTarget id="tab.link" style={{ flex: 1 }}>
              <PlatformPressable {...props} />
            </TourTarget>
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'link'),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
          tabBarButton: (props) => (
            <TourTarget id="tab.perfil" style={{ flex: 1 }}>
              <PlatformPressable {...props} />
            </TourTarget>
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'perfil'),
        }}
      />
      
      <Tabs.Screen
        name="configuraciones"
        options={{
          href: null, // No mostrar en tabs, accesible desde perfil
          tabBarStyle: SUBSCREEN,
        }}
      />
      {/* Ocultar del tabBar pero mantener accesible programáticamente */}
      <Tabs.Screen
        name="initial-questionnaire"
        options={{
          href: null, // No mostrar en tabs
        }}
      />
      <Tabs.Screen
        name="preferences"
        options={{
          href: null, // No mostrar en tabs, accesible desde perfil
          tabBarStyle: SUBSCREEN,
        }}
      />
      <Tabs.Screen
        name="link-external-calendars"
        options={{
          href: null, // No mostrar en tabs, accesible desde configuraciones
          tabBarStyle: SUBSCREEN,
        }}
      />
    </Tabs>
  );
}
