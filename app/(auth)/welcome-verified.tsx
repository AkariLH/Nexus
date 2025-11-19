import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeVerifiedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const displayName = params.displayName as string;

  // Animaciones principales
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const checkRotateAnim = useRef(new Animated.Value(-180)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones de corazones flotantes
  const heartAnims = useRef(
    Array.from({ length: 12 }, () => ({
      y: useRef(new Animated.Value(height)).current,
      x: useRef(new Animated.Value(Math.random() * width)).current,
      opacity: useRef(new Animated.Value(0)).current,
    }))
  ).current;

  // Animaciones de sparkles
  const sparkleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      scale: useRef(new Animated.Value(0)).current,
      rotate: useRef(new Animated.Value(0)).current,
    }))
  ).current;

  useEffect(() => {
    // Redirección automática después de 8 segundos
    const redirectTimer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 5000);

    // Animación del check
    Animated.spring(checkScaleAnim, {
      toValue: 1,
      stiffness: 200,
      damping: 15,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.spring(checkRotateAnim, {
      toValue: 0,
      stiffness: 200,
      damping: 15,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Animación del texto
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación del botón
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 400,
      delay: 1500,
      useNativeDriver: true,
    }).start();

    // Animación del anillo pulsante
    Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animaciones de corazones
    heartAnims.forEach((anim, i) => {
      const delay = Math.random() * 2000;
      const duration = 3000 + Math.random() * 2000;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.y, {
              toValue: -100,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: duration * 0.2,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: duration * 0.6,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: duration * 0.2,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(anim.y, {
            toValue: height,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Animaciones de sparkles
    sparkleAnims.forEach((anim, i) => {
      const delay = Math.random() * 1000;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 750,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.rotate, {
              toValue: 360,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.rotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Cleanup del timer
    return () => clearTimeout(redirectTimer);
  }, []);

  const handleContinue = () => {
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#FF4F81", "#8A2BE2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Corazones flotantes */}
      {heartAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.heart,
            {
              transform: [
                { translateY: anim.y },
                { translateX: anim.x },
              ],
              opacity: anim.opacity,
              left: 0,
              top: 0,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={20 + Math.random() * 20}
            color="rgba(255, 255, 255, 0.3)"
          />
        </Animated.View>
      ))}

      {/* Sparkles */}
      {sparkleAnims.map((anim, i) => {
        const angle = (360 / sparkleAnims.length) * i;
        const radius = 100;
        const x = width / 2 + Math.cos(angle * Math.PI / 180) * radius;
        const y = height / 2 + Math.sin(angle * Math.PI / 180) * radius;
        
        return (
          <Animated.View
            key={`sparkle-${i}`}
            style={[
              styles.sparkle,
              {
                left: x,
                top: y,
                transform: [
                  { scale: anim.scale },
                  { rotate: anim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })}
                ],
              },
            ]}
          >
            <Ionicons name="sparkles" size={24} color="#FFF" />
          </Animated.View>
        );
      })}

      {/* Anillo pulsante */}
      <Animated.View
        style={[
          styles.pulsingRing,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Ícono de check con animación */}
        <Animated.View
          style={[
            styles.checkContainer,
            {
              transform: [
                { scale: checkScaleAnim },
                { rotate: checkRotateAnim.interpolate({
                  inputRange: [-180, 0],
                  outputRange: ['-180deg', '0deg']
                })}
              ],
            },
          ]}
        >
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#FF4F81" />
          </View>
        </Animated.View>

        {/* Texto con animación */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>¡Cuenta verificada!</Text>
          <Text style={styles.welcomeText}>
            Bienvenido a Nexus{displayName ? `, ${displayName}` : ""}
          </Text>
          <Text style={styles.subtitle}>Tu cuenta está lista para usar</Text>
        </Animated.View>

        {/* Botón Continuar */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 10,
  },
  heart: {
    position: "absolute",
  },
  sparkle: {
    position: "absolute",
  },
  pulsingRing: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 4,
    borderColor: "#FFF",
    top: height / 2 - 150,
    left: width / 2 - 150,
  },
  checkContainer: {
    marginBottom: 32,
    position: "relative",
    zIndex: 10,
  },
  checkCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    position: "relative",
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 12,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 48,
    zIndex: 10,
  },
  buttonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
