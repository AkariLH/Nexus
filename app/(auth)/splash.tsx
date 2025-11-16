import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const scaleAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  
  // Animaciones para los puntos de carga
  const dot1Anim = new Animated.Value(0);
  const dot2Anim = new Animated.Value(0);
  const dot3Anim = new Animated.Value(0);

  // Animaciones para los corazones flotantes
  const heart1Float = new Animated.Value(0);
  const heart2Float = new Animated.Value(0);
  const heart3Float = new Animated.Value(0);

  useEffect(() => {
    // Animación del logo
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in del texto
    Animated.timing(fadeAnim, {
      toValue: 1,
      delay: 500,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Animación de los puntos de carga (pulsación continua)
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 200).start();
    createDotAnimation(dot3Anim, 400).start();

    // Animación de corazones flotantes
    const createHeartAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createHeartAnimation(heart1Float).start();
    createHeartAnimation(heart2Float).start();
    createHeartAnimation(heart3Float).start();

    // Navegación automática
    const timer = setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
  });

  return (
    <LinearGradient
      colors={["#FF4F81", "#8A2BE2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Corazones flotantes */}
      <Animated.View
        style={[
          styles.heart,
          {
            top: 80,
            left: 40,
            opacity: 0.4,
            transform: [
              {
                translateY: heart1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              {
                rotate: heart1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "10deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="heart" size={32} color="white" />
      </Animated.View>
      <Animated.View
        style={[
          styles.heart,
          {
            top: 160,
            right: 60,
            opacity: 0.5,
            transform: [
              {
                translateY: heart2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
              {
                rotate: heart2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "-10deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="heart" size={26} color="white" />
      </Animated.View>
      <Animated.View
        style={[
          styles.heart,
          {
            bottom: 120,
            left: 80,
            opacity: 0.4,
            transform: [
              {
                translateY: heart3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
              {
                scale: heart3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.15],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="heart" size={36} color="white" />
      </Animated.View>

      {/* Logo central */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <View style={styles.logoBox}>
          <Image 
            source={require("@/assets/images/icon.svg")} 
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </Animated.View>

      {/* Texto */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Nexus
      </Animated.Text>

      {/* Indicador de carga */}
      <View style={styles.loader}>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: dot1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: fadeAnim,
              marginLeft: 8,
              transform: [
                {
                  scale: dot2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: fadeAnim,
              marginLeft: 8,
              transform: [
                {
                  scale: dot3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: {
    width: 110,
    height: 110,
    backgroundColor: "white",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    marginTop: 24,
    fontSize: 44,
    fontWeight: "700",
    color: "white",
    letterSpacing: 2,
  },
  loader: {
    position: "absolute",
    bottom: 80,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: "white",
    borderRadius: 5,
  },
});
