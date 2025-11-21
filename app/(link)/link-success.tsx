import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LinkSuccessScreen() {
  const router = useRouter();
  const { partnerName } = useLocalSearchParams<{ partnerName: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#FF4F81', '#8A2BE2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating hearts animation */}
      {[...Array(12)].map((_, i) => (
        <FloatingHeart key={i} delay={Math.random() * 2000} />
      ))}

      {/* Sparkles - Solo en esquina inferior derecha */}
      {[...Array(5)].map((_, i) => (
        <SparkleAnimation 
          key={`sparkle-${i}`} 
          delay={Math.random() * 1000}
          index={i}
        />
      ))}

      {/* Main content */}
      <HeartAnimation />

      {/* Text content */}
      <TextContent partnerName={partnerName || "tu pareja"} />

      {/* Pulsing ring effect */}
      <PulsingRing />

      {/* Continue button */}
      <ContinueButton onPress={handleContinue} />
    </LinearGradient>
  );
}

function FloatingHeart({ delay }: { delay: number }) {
  const translateY = useSharedValue(height);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0);
  const size = 20 + Math.random() * 20;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.linear,
        }),
        -1
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(
          Math.random() * width + (Math.random() - 0.5) * 100,
          {
            duration: 3000 + Math.random() * 2000,
            easing: Easing.linear,
          }
        ),
        -1
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 500 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingHeart, animatedStyle]}>
      <MaterialCommunityIcons name="heart" size={size} color="rgba(255, 255, 255, 0.3)" />
    </Animated.View>
  );
}

function SparkleAnimation({ delay, index }: { delay: number; index: number }) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Posicionar en esquina inferior derecha
  const positions = [
    { right: 30 + index * 20, bottom: 100 + index * 25 },
    { right: 60 + index * 15, bottom: 120 + index * 20 },
    { right: 40 + index * 18, bottom: 140 + index * 15 },
    { right: 70 + index * 12, bottom: 90 + index * 22 },
    { right: 50 + index * 16, bottom: 110 + index * 18 },
  ];

  return (
    <Animated.View
      style={[
        styles.sparkle,
        positions[index % 5],
        animatedStyle,
      ]}
    >
      <Ionicons name="sparkles" size={20 + Math.random() * 10} color="#fff" />
    </Animated.View>
  );
}

function HeartAnimation() {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-180);

  useEffect(() => {
    scale.value = withDelay(
      200,
      withSpring(1, {
        stiffness: 200,
        damping: 15,
      })
    );

    rotate.value = withDelay(
      200,
      withSpring(0, {
        stiffness: 200,
        damping: 15,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.heartContainer, animatedStyle]}>
      <View style={styles.heartCircle}>
        <MaterialCommunityIcons
          name="heart"
          size={80}
          color="#FF4F81"
        />
      </View>
    </Animated.View>
  );
}

function TextContent({ partnerName }: { partnerName: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.textContainer, animatedStyle]}>
      <Text style={styles.title}>¡Ya están vinculados!</Text>
      <Text style={styles.subtitle}>
        Ahora tú y {partnerName} pueden compartir su vida juntos
      </Text>
    </Animated.View>
  );
}

function PulsingRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1
    );

    opacity.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingRing, animatedStyle]}>
      <View style={styles.ring} />
    </Animated.View>
  );
}

function ContinueButton({ onPress }: { onPress: () => void }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(1500, withTiming(1, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  floatingHeart: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
  heartContainer: {
    zIndex: 10,
    marginBottom: 32,
  },
  heartCircle: {
    width: 128,
    height: 128,
    backgroundColor: '#fff',
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    zIndex: 10,
  },
  buttonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
  pulsingRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: height / 2 - 150,
    left: width / 2 - 150,
  },
  ring: {
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 150,
  },
});
