// Mapeo de imágenes de preferencias
// Slugs generados a partir del nombre normalizado. Se agregan sinónimos y variantes.
// Si una preferencia no tiene imagen mapeada en desarrollo, se mostrará un warning una sola vez.

const PREFERENCE_IMAGES: Record<string, any> = {
  // Fallback
  'placeholder': require('../assets/images/icon.png'),

  // Bienestar Físico / Actividades deportivas
  'gimnasio': require('../assets/images/preferences/gym.png'),
  'yoga': require('../assets/images/preferences/yoga.png'),
  'correr': require('../assets/images/preferences/running.png'),
  'ciclismo': require('../assets/images/preferences/cycling.png'),
  'natacion': require('../assets/images/preferences/swimming.png'),
  'baile': require('../assets/images/preferences/dance.png'),
  'futbol': require('../assets/images/preferences/soccer.png'),
  'basquetbol': require('../assets/images/preferences/basketball.png'),
  'voleibol': require('../assets/images/preferences/volleyball.png'),
  'artes-marciales': require('../assets/images/preferences/martial-arts.png'),
  'escalada': require('../assets/images/preferences/climbing.png'),
  'senderismo': require('../assets/images/preferences/hiking.png'),

  // Lenguajes del amor / Bienestar emocional
  'palabras-de-afirmacion': require('../assets/images/preferences/love_words.png'),
  'contacto-fisico': require('../assets/images/preferences/physical-touch.png'),
  'escuchar-musica': require('../assets/images/preferences/music.png'),
  'hablar-del-tema': require('../assets/images/preferences/talk.png'),
  'hacer-ejercicio': require('../assets/images/preferences/exercise.png'),
  'hacer-hobbies': require('../assets/images/preferences/hobbies.jpg'),
  'meditacion': require('../assets/images/preferences/meditation.png'),
  'regalos': require('../assets/images/preferences/gifts.png'),
  'tiempo-a-solas': require('../assets/images/preferences/alone-time.png'),
  'tiempo-de-calidad': require('../assets/images/preferences/quality-time.png'),
  'deportes': require('../assets/images/preferences/gym.png'),
  'actos-de-servicio': require('../assets/images/preferences/acts-service.png'),

  //Bienestar social
  'ir-al-cine': require('../assets/images/preferences/movies.png'),
  'cena-romantica': require('../assets/images/preferences/dinner.png'),
  'conciertos': require('../assets/images/preferences/concerts.png'),
  'visitar-museos': require('../assets/images/preferences/museums.png'),
  'paseos-en-parques-1': require('../assets/images/preferences/parks.png'),
  'quedarse-en-casa': require('../assets/images/preferences/home-date.png'),
  'parques-de-diversiones': require('../assets/images/preferences/adventure.png'),
  'juegos': require('../assets/images/preferences/games.png'),
  'restaurantes': require('../assets/images/preferences/restaurants.png'), 
  'cafeterias': require('../assets/images/preferences/cafes.png'),
  'bares-y-antros': require('../assets/images/preferences/bars.png'),
  'teatro': require('../assets/images/preferences/theaters.png'),
  'centros-comerciales': require('../assets/images/preferences/shopping.png'),

  // Bienestar Intelectual
  'tecnologia': require('../assets/images/preferences/technology.png'),
  'ciencia': require('../assets/images/preferences/science.png'),
  'arte-y-diseno': require('../assets/images/preferences/art.png'),
  'historia': require('../assets/images/preferences/history.png'),
  'politica-y-actualidad': require('../assets/images/preferences/politics.webp'),
  'musica': require('../assets/images/preferences/music.png'),
  'literatura': require('../assets/images/preferences/literature.png'),
  'filosofia': require('../assets/images/preferences/philosophy.png'),
  'leer': require('../assets/images/preferences/reading.png'),
  'escribir': require('../assets/images/preferences/writing.png'),
  'pintar-o-dibujar': require('../assets/images/preferences/painting.png'),
  'tocar-instrumento': require('../assets/images/preferences/instrument.png'),
  'fotografia': require('../assets/images/preferences/photography.png'),
  'cocinar': require('../assets/images/preferences/cooking.png'),
  'videojuegos': require('../assets/images/preferences/gaming.png'),
  'manualidades': require('../assets/images/preferences/crafts.png'),

  //bienestar profesional
  'dar-palabras-de-animo': require('../assets/images/preferences/encouragement.png'),
  'dar-consejos': require('../assets/images/preferences/advice.png'),
  'dar-espacio': require('../assets/images/preferences/space.png'),
  'celebrar-logros': require('../assets/images/preferences/celebration.png'),

  //bienestar ambiental
  'senderismo-al-aire-libre': require('../assets/images/preferences/hiking.png'),
  'paseos-en-parques': require('../assets/images/preferences/parks-nature.png'),
  'picnics': require('../assets/images/preferences/picnics.png'),
  'paseos-en-trajinera': require('../assets/images/preferences/boats.png'),
  'ciclismo-al-aire-libre': require('../assets/images/preferences/cycling-nature.png'),
  'jardines-botanicos': require('../assets/images/preferences/botanical.png'),
  'escapadas-de-fin-de-semana': require('../assets/images/preferences/daytrips.png'),
  'senderismo-en-naturaleza': require('../assets/images/preferences/hiking.png'),

  //bienestar espiritual
  'aprender-cosas-nuevas': require('../assets/images/preferences/learning.png'),
  'arte-y-creatividad': require('../assets/images/preferences/art.png'),
  'ayudar-a-otros': require('../assets/images/preferences/helping.png'),
  'conectar-con-personas': require('../assets/images/preferences/connecting.png'),
  'crear-algo-nuevo': require('../assets/images/preferences/creating.png'),
  'escribir-diario': require('../assets/images/preferences/journaling.png'),
  'explorar-la-ciudad': require('../assets/images/preferences/exploring.png'),
  'hacer-voluntariado': require('../assets/images/preferences/volunteering.png'),
  'oracion-o-reflexion': require('../assets/images/preferences/prayer.png'),
  'practicar-meditacion': require('../assets/images/preferences/meditation-practice.png'),
  'practicar-yoga': require('../assets/images/preferences/yoga-practice.png'),

};

export const getPreferenceImage = (preferenceName: string): any => {
  // Normalizar el nombre de la preferencia para hacer match con las keys
  const slug = preferenceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones

  if (!PREFERENCE_IMAGES[slug]) {
    if (__DEV__) {
      (global as any).__missingPrefImages = (global as any).__missingPrefImages || new Set<string>();
      const warned: Set<string> = (global as any).__missingPrefImages;
      if (!warned.has(slug)) {
        console.warn(`[Preferencias] Imagen no encontrada para slug: '${slug}'. Agrega una entrada en PREFERENCE_IMAGES.`);
        warned.add(slug);
      }
    }
  }
  return PREFERENCE_IMAGES[slug] || PREFERENCE_IMAGES['placeholder'];
};
