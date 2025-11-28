/**
 * Tipos para el sistema de preferencias basado en las 7 dimensiones del bienestar
 */

export type WellnessDimension = 
  | 'physical'
  | 'emotional'
  | 'social'
  | 'intellectual'
  | 'professional'
  | 'environmental'
  | 'spiritual';

export interface PreferenceOption {
  id: string;
  label: string;
  emoji?: string;
  category?: string;
}

// 1. BIENESTAR FÍSICO 💪
export interface PhysicalWellness {
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  preferredActivities: string[]; // ['gym', 'yoga', 'running', 'swimming', 'sports', 'dance', 'hiking', 'cycling']
  exerciseFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  sportsInterests: string[]; // ['soccer', 'basketball', 'tennis', 'volleyball', etc.]
}

// 2. BIENESTAR EMOCIONAL 💖
export interface EmotionalWellness {
  loveLanguages: string[]; // ['words', 'quality_time', 'gifts', 'acts_of_service', 'physical_touch']
  stressRelief: string[]; // ['talk', 'alone_time', 'music', 'exercise', 'meditation', 'hobbies']
  emotionalExpression: 'very_reserved' | 'reserved' | 'balanced' | 'expressive' | 'very_expressive';
  conflictStyle: 'avoid' | 'compromise' | 'collaborate' | 'compete' | 'accommodate';
}

// 3. BIENESTAR SOCIAL 👥
export interface SocialWellness {
  socialPreference: 'introvert' | 'ambivert' | 'extrovert';
  idealDateActivities: string[]; // ['movies', 'dinner', 'concerts', 'museums', 'nature', 'home', 'adventure']
  togetherTimeBalance: number; // 0-100 (0 = mucho tiempo individual, 100 = todo el tiempo juntos)
  favoriteVenues: string[]; // ['restaurants', 'cafes', 'parks', 'beach', 'mountains', 'clubs', 'theaters']
}

// 4. BIENESTAR INTELECTUAL 🧠
export interface IntellectualWellness {
  interests: string[]; // ['technology', 'science', 'art', 'history', 'politics', 'music', 'literature', 'philosophy']
  culturalActivities: string[]; // ['museums', 'concerts', 'theater', 'exhibitions', 'lectures', 'book_clubs']
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  hobbies: string[]; // ['reading', 'writing', 'painting', 'music', 'photography', 'cooking', 'gaming', 'crafts']
}

// 5. BIENESTAR PROFESIONAL 💼
export interface ProfessionalWellness {
  workLifeBalance: number; // 0-100
  careerImportance: 'low' | 'medium' | 'high' | 'very_high';
  supportStyle: string[]; // ['encouragement', 'advice', 'active_help', 'space', 'celebration']
  workValues: string[]; // ['growth', 'stability', 'creativity', 'impact', 'income', 'flexibility', 'passion']
}

// 6. BIENESTAR AMBIENTAL 🌿
export interface EnvironmentalWellness {
  environmentPreference: 'city' | 'suburbs' | 'countryside' | 'beach' | 'mountains' | 'mixed';
  outdoorActivities: string[]; // ['hiking', 'camping', 'beach', 'picnics', 'gardening', 'sports', 'photography']
  ecoConsciousness: 'low' | 'moderate' | 'high' | 'very_high';
  idealWeather: string[]; // ['sunny', 'rainy', 'cold', 'warm', 'varied']
}

// 7. BIENESTAR ESPIRITUAL ✨
export interface SpiritualWellness {
  coreValues: string[]; // ['honesty', 'loyalty', 'growth', 'adventure', 'family', 'freedom', 'kindness', 'ambition']
  mindfulnessPractices: string[]; // ['meditation', 'yoga', 'prayer', 'journaling', 'nature', 'art', 'none']
  meaningfulActivities: string[]; // ['volunteering', 'creating', 'helping', 'learning', 'connecting', 'exploring']
  lifePhilosophy: 'live_moment' | 'plan_future' | 'balanced' | 'spontaneous' | 'structured';
}

// ESTRUCTURA COMPLETA
export interface UserPreferences {
  userId: number;
  physical: PhysicalWellness;
  emotional: EmotionalWellness;
  social: SocialWellness;
  intellectual: IntellectualWellness;
  professional: ProfessionalWellness;
  environmental: EnvironmentalWellness;
  spiritual: SpiritualWellness;
  completedAt?: string;
  updatedAt: string;
}

// Para el cuestionario progresivo
export interface QuestionnaireProgress {
  currentDimension: WellnessDimension;
  completedDimensions: WellnessDimension[];
  totalProgress: number; // 0-100
}

// Opciones predefinidas para cada categoría
export const PREFERENCE_OPTIONS = {
  physical: {
    activityLevel: [
      { id: 'sedentary', label: 'Poco activo', emoji: '🛋️' },
      { id: 'light', label: 'Ligeramente activo', emoji: '🚶' },
      { id: 'moderate', label: 'Moderadamente activo', emoji: '🏃' },
      { id: 'active', label: 'Activo', emoji: '💪' },
      { id: 'very_active', label: 'Muy activo', emoji: '🏋️' },
    ],
    activities: [
      { id: 'gym', label: 'Gimnasio', emoji: '🏋️', category: 'indoor' },
      { id: 'yoga', label: 'Yoga', emoji: '🧘', category: 'indoor' },
      { id: 'running', label: 'Correr', emoji: '🏃', category: 'outdoor' },
      { id: 'swimming', label: 'Natación', emoji: '🏊', category: 'water' },
      { id: 'sports', label: 'Deportes', emoji: '⚽', category: 'team' },
      { id: 'dance', label: 'Baile', emoji: '💃', category: 'indoor' },
      { id: 'hiking', label: 'Senderismo', emoji: '🥾', category: 'outdoor' },
      { id: 'cycling', label: 'Ciclismo', emoji: '🚴', category: 'outdoor' },
    ],
  },
  emotional: {
    loveLanguages: [
      { id: 'words', label: 'Palabras de afirmación', emoji: '💬' },
      { id: 'quality_time', label: 'Tiempo de calidad', emoji: '⏰' },
      { id: 'gifts', label: 'Regalos', emoji: '🎁' },
      { id: 'acts_of_service', label: 'Actos de servicio', emoji: '🤝' },
      { id: 'physical_touch', label: 'Contacto físico', emoji: '🤗' },
    ],
    stressRelief: [
      { id: 'talk', label: 'Hablar del tema', emoji: '💬' },
      { id: 'alone_time', label: 'Tiempo a solas', emoji: '🧘' },
      { id: 'music', label: 'Escuchar música', emoji: '🎵' },
      { id: 'exercise', label: 'Hacer ejercicio', emoji: '🏃' },
      { id: 'meditation', label: 'Meditar', emoji: '🧘‍♀️' },
      { id: 'hobbies', label: 'Mis hobbies', emoji: '🎨' },
    ],
  },
  social: {
    dateActivities: [
      { id: 'movies', label: 'Cine', emoji: '🎬', category: 'indoor' },
      { id: 'dinner', label: 'Cena romántica', emoji: '🍽️', category: 'food' },
      { id: 'concerts', label: 'Conciertos', emoji: '🎵', category: 'music' },
      { id: 'museums', label: 'Museos', emoji: '🖼️', category: 'culture' },
      { id: 'nature', label: 'Naturaleza', emoji: '🌳', category: 'outdoor' },
      { id: 'home', label: 'En casa', emoji: '🏠', category: 'indoor' },
      { id: 'adventure', label: 'Aventuras', emoji: '🎢', category: 'outdoor' },
      { id: 'games', label: 'Juegos', emoji: '🎮', category: 'indoor' },
    ],
    venues: [
      { id: 'restaurants', label: 'Restaurantes', emoji: '🍽️' },
      { id: 'cafes', label: 'Cafés', emoji: '☕' },
      { id: 'parks', label: 'Parques', emoji: '🌳' },
      { id: 'beach', label: 'Playa', emoji: '🏖️' },
      { id: 'mountains', label: 'Montañas', emoji: '⛰️' },
      { id: 'clubs', label: 'Antros/Clubs', emoji: '🎉' },
      { id: 'theaters', label: 'Teatros', emoji: '🎭' },
      { id: 'malls', label: 'Centros comerciales', emoji: '🏬' },
    ],
  },
  intellectual: {
    interests: [
      { id: 'technology', label: 'Tecnología', emoji: '💻', category: 'stem' },
      { id: 'science', label: 'Ciencia', emoji: '🔬', category: 'stem' },
      { id: 'art', label: 'Arte', emoji: '🎨', category: 'arts' },
      { id: 'history', label: 'Historia', emoji: '📚', category: 'humanities' },
      { id: 'politics', label: 'Política', emoji: '🗳️', category: 'social' },
      { id: 'music', label: 'Música', emoji: '🎵', category: 'arts' },
      { id: 'literature', label: 'Literatura', emoji: '📖', category: 'humanities' },
      { id: 'philosophy', label: 'Filosofía', emoji: '🤔', category: 'humanities' },
    ],
    hobbies: [
      { id: 'reading', label: 'Leer', emoji: '📚' },
      { id: 'writing', label: 'Escribir', emoji: '✍️' },
      { id: 'painting', label: 'Pintar', emoji: '🎨' },
      { id: 'music', label: 'Tocar música', emoji: '🎸' },
      { id: 'photography', label: 'Fotografía', emoji: '📷' },
      { id: 'cooking', label: 'Cocinar', emoji: '👨‍🍳' },
      { id: 'gaming', label: 'Videojuegos', emoji: '🎮' },
      { id: 'crafts', label: 'Manualidades', emoji: '✂️' },
    ],
  },
  professional: {
    supportStyle: [
      { id: 'encouragement', label: 'Palabras de ánimo', emoji: '💪' },
      { id: 'advice', label: 'Dar consejos', emoji: '💡' },
      { id: 'active_help', label: 'Ayuda activa', emoji: '🤝' },
      { id: 'space', label: 'Dar espacio', emoji: '🌌' },
      { id: 'celebration', label: 'Celebrar logros', emoji: '🎉' },
    ],
    workValues: [
      { id: 'growth', label: 'Crecimiento', emoji: '📈' },
      { id: 'stability', label: 'Estabilidad', emoji: '⚖️' },
      { id: 'creativity', label: 'Creatividad', emoji: '🎨' },
      { id: 'impact', label: 'Impacto social', emoji: '🌍' },
      { id: 'income', label: 'Buenos ingresos', emoji: '💰' },
      { id: 'flexibility', label: 'Flexibilidad', emoji: '🕐' },
      { id: 'passion', label: 'Pasión', emoji: '❤️' },
    ],
  },
  environmental: {
    outdoorActivities: [
      { id: 'hiking', label: 'Senderismo', emoji: '🥾' },
      { id: 'camping', label: 'Acampar', emoji: '⛺' },
      { id: 'beach', label: 'Playa', emoji: '🏖️' },
      { id: 'picnics', label: 'Picnics', emoji: '🧺' },
      { id: 'gardening', label: 'Jardinería', emoji: '🌱' },
      { id: 'sports', label: 'Deportes al aire libre', emoji: '⚽' },
      { id: 'photography', label: 'Fotografía de naturaleza', emoji: '📷' },
      { id: 'stargazing', label: 'Ver estrellas', emoji: '⭐' },
    ],
  },
  spiritual: {
    coreValues: [
      { id: 'honesty', label: 'Honestidad', emoji: '🤝' },
      { id: 'loyalty', label: 'Lealtad', emoji: '💙' },
      { id: 'growth', label: 'Crecimiento', emoji: '🌱' },
      { id: 'adventure', label: 'Aventura', emoji: '🗺️' },
      { id: 'family', label: 'Familia', emoji: '👨‍👩‍👧‍👦' },
      { id: 'freedom', label: 'Libertad', emoji: '🕊️' },
      { id: 'kindness', label: 'Amabilidad', emoji: '🤗' },
      { id: 'ambition', label: 'Ambición', emoji: '🎯' },
    ],
    mindfulnessPractices: [
      { id: 'meditation', label: 'Meditación', emoji: '🧘' },
      { id: 'yoga', label: 'Yoga', emoji: '🧘‍♀️' },
      { id: 'prayer', label: 'Oración', emoji: '🙏' },
      { id: 'journaling', label: 'Escribir diario', emoji: '📔' },
      { id: 'nature', label: 'Tiempo en naturaleza', emoji: '🌿' },
      { id: 'art', label: 'Arte/creatividad', emoji: '🎨' },
      { id: 'none', label: 'Ninguna', emoji: '🚫' },
    ],
  },
};
