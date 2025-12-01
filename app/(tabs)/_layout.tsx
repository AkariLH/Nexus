import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useQuestionnaire } from "../../context/QuestionnaireContext";

export default function TabLayout() {
  const { isCompleted, isLoading } = useQuestionnaire();

  // Mostrar loading mientras verifica
  if (isLoading || isCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF4F81" />
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF4F81",
        tabBarInactiveTintColor: "#000000ff",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
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
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'perfil'),
        }}
      />
      <Tabs.Screen
        name="link"
        options={{
          title: "Vinculo",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "link" : "link-outline"} color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'link'),
        }}
      />
      <Tabs.Screen
        name="configuraciones"
        options={{
          title: "Configuraciones",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={24} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'configuraciones'),
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
        }}
      />
      <Tabs.Screen
        name="link-external-calendars"
        options={{
          href: null, // No mostrar en tabs, accesible desde configuraciones
        }}
      />
    </Tabs>
  );
}
