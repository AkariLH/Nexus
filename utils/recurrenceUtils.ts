/**
 * Utilidad para expandir eventos recurrentes según su patrón iCalendar
 */

interface RecurrencePattern {
  FREQ: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  INTERVAL: number;
  BYDAY?: string[]; // ['MO', 'WE', 'FR']
  BYMONTHDAY?: number;
  BYMONTH?: number;
  UNTIL?: Date;
}

/**
 * Parsea un patrón de recurrencia en formato iCalendar
 * Ejemplo: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;UNTIL=20251231"
 */
function parseRecurrencePattern(pattern: string): RecurrencePattern | null {
  try {
    const parts = pattern.split(';');
    const parsed: any = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');
      
      if (key === 'FREQ') {
        parsed.FREQ = value;
      } else if (key === 'INTERVAL') {
        parsed.INTERVAL = parseInt(value);
      } else if (key === 'BYDAY') {
        parsed.BYDAY = value.split(',');
      } else if (key === 'BYMONTHDAY') {
        parsed.BYMONTHDAY = parseInt(value);
      } else if (key === 'BYMONTH') {
        parsed.BYMONTH = parseInt(value);
      } else if (key === 'UNTIL') {
        // Formato: YYYYMMDD
        const year = parseInt(value.substring(0, 4));
        const month = parseInt(value.substring(4, 6)) - 1;
        const day = parseInt(value.substring(6, 8));
        parsed.UNTIL = new Date(year, month, day, 23, 59, 59);
      }
    });

    return parsed as RecurrencePattern;
  } catch (error) {
    console.error('Error parsing recurrence pattern:', error);
    return null;
  }
}

/**
 * Convierte día de la semana de iCalendar a número JS (0=Domingo, 6=Sábado)
 */
function icalDayToJsDay(icalDay: string): number {
  const mapping: { [key: string]: number } = {
    'SU': 0,
    'MO': 1,
    'TU': 2,
    'WE': 3,
    'TH': 4,
    'FR': 5,
    'SA': 6,
  };
  return mapping[icalDay] ?? 0;
}

/**
 * Expande un evento recurrente en múltiples instancias
 * @param event Evento con información de recurrencia
 * @param startRange Fecha inicial del rango a expandir
 * @param endRange Fecha final del rango a expandir
 * @returns Array de fechas donde ocurre el evento
 */
export function expandRecurringEvent(
  event: {
    startDateTime: string;
    endDateTime: string;
    isRecurring?: boolean;
    recurrencePattern?: string;
    rruleDtstartUtc?: string; // Fecha de inicio de la regla de recurrencia (DTSTART)
  },
  startRange: Date,
  endRange: Date
): Date[] {
  console.log('\n=== expandRecurringEvent ===');
  console.log('Event start:', event.startDateTime);
  console.log('RRULE DTSTART:', event.rruleDtstartUtc);
  console.log('Pattern:', event.recurrencePattern);
  console.log('Range:', startRange.toISOString(), 'to', endRange.toISOString());
  
  if (!event.isRecurring || !event.recurrencePattern) {
    console.log('No es recurrente, devolviendo fecha original');
    return [new Date(event.startDateTime)];
  }

  const pattern = parseRecurrencePattern(event.recurrencePattern);
  console.log('Pattern parseado:', JSON.stringify(pattern, null, 2));
  
  if (!pattern) {
    console.log('Pattern inválido, devolviendo fecha original');
    return [new Date(event.startDateTime)];
  }
  
  // Log detallado del patrón
  if (pattern.BYDAY) {
    console.log('🎯 BYDAY encontrado:', pattern.BYDAY);
  } else {
    console.log('⚠️ BYDAY no encontrado en el patrón');
  }

  const occurrences: Date[] = [];
  
  // Usar rruleDtstartUtc si está disponible, sino usar startDateTime
  // DTSTART es la fecha donde comienza la recurrencia según el calendario externo
  const startISO = event.rruleDtstartUtc || event.startDateTime;
  const endISO = event.endDateTime;
  
  console.log('📅 Usando DTSTART:', startISO);
  
  // Parsear fecha ISO a componentes locales directamente
  // Si la fecha es "2024-12-15T10:00:00Z", queremos que sea 15 dic a las 10:00 LOCAL
  // Soporta: 2024-12-15T10:00:00, 2024-12-15T10:00:00Z, 2024-12-15T10:00:00.000Z
  const startMatch = startISO.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!startMatch) {
    console.error('Formato de fecha inválido:', startISO);
    console.error('Intentando parse estándar...');
    // Fallback: usar parse estándar
    const fallbackDate = new Date(event.startDateTime);
    console.log('Fecha parseada (fallback):', fallbackDate.toISOString());
    return [fallbackDate];
  }
  
  let year = parseInt(startMatch[1]);
  let month = parseInt(startMatch[2]) - 1; // Month is 0-indexed
  let day = parseInt(startMatch[3]);
  let hours = parseInt(startMatch[4]);
  let minutes = parseInt(startMatch[5]);
  
  console.log('Fecha parseada (componentes locales):', { year, month: month + 1, day, hours, minutes });
  console.log('FREQ:', pattern.FREQ, 'INTERVAL:', pattern.INTERVAL);
  
  // Ajustar mes y día según el patrón para evitar problemas de conversión UTC
  if (pattern.FREQ === 'YEARLY' || pattern.FREQ === 'MONTHLY') {
    if (pattern.BYMONTH !== undefined) {
      month = pattern.BYMONTH - 1;
    }
    if (pattern.BYMONTHDAY !== undefined) {
      day = pattern.BYMONTHDAY;
    }
  }
  
  // Crear fecha del evento usando componentes locales
  const eventDate = new Date(year, month, day, hours, minutes);
  console.log('Fecha original del evento:', eventDate.toLocaleDateString(), eventDate.toLocaleTimeString());
  
  // OPTIMIZACIÓN: Comenzar desde el inicio del rango visible, no desde la fecha original
  // Esto evita iterar por años de ocurrencias pasadas
  let currentDate = new Date(eventDate);
  
  // Si el evento original es anterior al rango, avanzar al inicio del rango
  if (currentDate < startRange) {
    console.log('⚡ Evento anterior al rango, avanzando al inicio del rango...');
    currentDate = new Date(startRange);
    // Ajustar a la misma hora del evento original
    currentDate.setHours(hours, minutes, 0, 0);
    
    // Para eventos semanales, ajustar al primer día permitido
    if (pattern.FREQ === 'WEEKLY') {
      if (pattern.BYDAY && pattern.BYDAY.length > 0) {
        const allowedDays = pattern.BYDAY.map(icalDayToJsDay);
        const currentDay = currentDate.getDay();
        if (!allowedDays.includes(currentDay)) {
          // Avanzar al primer día permitido
          const nextAllowedDay = allowedDays.find(d => d >= currentDay) || allowedDays[0];
          let daysToAdd = (nextAllowedDay - currentDay + 7) % 7;
          if (daysToAdd === 0 && nextAllowedDay === allowedDays[0]) daysToAdd = 7;
          currentDate.setDate(currentDate.getDate() + daysToAdd);
        }
      }
      // Si no hay BYDAY, el evento se repite el mismo día de la semana que DTSTART
      // No necesitamos ajustar nada aquí
    }
    
    // Para eventos mensuales/anuales, ajustar al día correcto
    if (pattern.FREQ === 'MONTHLY' && pattern.BYMONTHDAY) {
      currentDate.setDate(pattern.BYMONTHDAY);
    }
    if (pattern.FREQ === 'YEARLY' && pattern.BYMONTH && pattern.BYMONTHDAY) {
      currentDate.setMonth(pattern.BYMONTH - 1, pattern.BYMONTHDAY);
    }
  }
  
  console.log('Fecha inicial de búsqueda:', currentDate.toLocaleDateString(), currentDate.toLocaleTimeString());
  
  // Límite máximo: la fecha UNTIL del patrón o la fecha final del rango o 2 años desde hoy
  const maxDate = pattern.UNTIL || new Date(endRange);
  const absoluteMax = new Date();
  absoluteMax.setFullYear(absoluteMax.getFullYear() + 2);
  const finalLimit = maxDate < absoluteMax ? maxDate : absoluteMax;

  console.log('📅 Límites de expansión:');
  console.log('   UNTIL del patrón:', pattern.UNTIL?.toLocaleDateString() || 'N/A');
  console.log('   Fin del rango visible:', endRange.toLocaleDateString());
  console.log('   Límite final usado:', finalLimit.toLocaleDateString());
  console.log('   Máximo absoluto (2 años):', absoluteMax.toLocaleDateString());

  console.log('Final limit:', finalLimit.toISOString());

  // Límite de iteraciones para evitar bucles infinitos
  let iterations = 0;
  const maxIterations = 2000; // Aumentado para eventos con muchas ocurrencias

  while (currentDate <= finalLimit && iterations < maxIterations) {
    iterations++;

    // Validar según el tipo de frecuencia (usando componentes locales)
    let isValid = true;

    if (pattern.FREQ === 'WEEKLY') {
      if (pattern.BYDAY && pattern.BYDAY.length > 0) {
        // Si hay BYDAY específico, validar que sea uno de esos días
        const dayOfWeek = currentDate.getDay();
        const allowedDays = pattern.BYDAY.map(icalDayToJsDay);
        isValid = allowedDays.includes(dayOfWeek);
        if (iterations <= 5) {
          console.log(`Iter ${iterations}: WEEKLY check - day=${dayOfWeek}, allowed=${allowedDays}, valid=${isValid}`);
        }
      } else {
        // Si no hay BYDAY, validar que sea el mismo día de la semana que el evento original
        const dayOfWeek = currentDate.getDay();
        const originalDayOfWeek = eventDate.getDay();
        isValid = dayOfWeek === originalDayOfWeek;
        if (iterations <= 5) {
          console.log(`Iter ${iterations}: WEEKLY check (sin BYDAY) - day=${dayOfWeek}, original=${originalDayOfWeek}, valid=${isValid}`);
        }
      }
    }

    if (pattern.FREQ === 'MONTHLY' && pattern.BYMONTHDAY) {
      const localDay = currentDate.getDate();
      isValid = localDay === pattern.BYMONTHDAY;
      if (iterations <= 5) {
        console.log(`Iter ${iterations}: MONTHLY check - localDay=${localDay}, required=${pattern.BYMONTHDAY}, valid=${isValid}`);
      }
    }

    if (pattern.FREQ === 'YEARLY') {
      if (pattern.BYMONTH && pattern.BYMONTHDAY) {
        const localMonth = currentDate.getMonth();
        const localDay = currentDate.getDate();
        isValid = 
          localMonth === pattern.BYMONTH - 1 && 
          localDay === pattern.BYMONTHDAY;
        if (iterations <= 5) {
          console.log(`Iter ${iterations}: YEARLY check - localMonth=${localMonth}, localDay=${localDay}, required=${pattern.BYMONTH-1}/${pattern.BYMONTHDAY}, valid=${isValid}`);
        }
      }
    }

    // Agregar ocurrencia si es válida y está en el rango visible
    if (isValid && currentDate >= startRange && currentDate <= endRange) {
      if (iterations <= 5) {
        console.log(`✓ Agregando ocurrencia: ${currentDate.toISOString()} (local: ${currentDate.toLocaleDateString()})`);
      }
      occurrences.push(new Date(currentDate));
    } else if (iterations <= 5) {
      console.log(`✗ Rechazando: valid=${isValid}, inRange=${currentDate >= startRange && currentDate <= endRange}, date=${currentDate.toLocaleDateString()}`);
    }

    // Avanzar a la siguiente ocurrencia
    switch (pattern.FREQ) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + (pattern.INTERVAL || 1));
        break;
      
      case 'WEEKLY':
        if (pattern.BYDAY && pattern.BYDAY.length > 0) {
          const allowedDays = pattern.BYDAY.map(icalDayToJsDay).sort((a, b) => a - b);
          const currentDay = currentDate.getDay();
          const interval = pattern.INTERVAL || 1;
          
          // Encontrar el siguiente día permitido
          let nextDay = allowedDays.find(d => d > currentDay);
          
          if (nextDay !== undefined) {
            // Hay un día permitido más adelante en esta semana
            const daysToAdd = nextDay - currentDay;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
          } else {
            // No hay más días permitidos en esta semana, ir a la próxima semana (con intervalo)
            const firstAllowedDay = allowedDays[0];
            const daysToNextWeek = (7 - currentDay + firstAllowedDay) + (7 * (interval - 1));
            currentDate.setDate(currentDate.getDate() + daysToNextWeek);
          }
        } else {
          currentDate.setDate(currentDate.getDate() + (7 * (pattern.INTERVAL || 1)));
        }
        break;
      
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + (pattern.INTERVAL || 1));
        // Mantener el día si es válido
        if (pattern.BYMONTHDAY) {
          currentDate.setDate(pattern.BYMONTHDAY);
        }
        break;
      
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + (pattern.INTERVAL || 1));
        // Mantener mes y día si están especificados
        if (pattern.BYMONTH) {
          currentDate.setMonth(pattern.BYMONTH - 1);
        }
        if (pattern.BYMONTHDAY) {
          currentDate.setDate(pattern.BYMONTHDAY);
        }
        break;
    }

    // Si la fecha actual ya pasó el límite, salir
    if (currentDate > finalLimit) {
      break;
    }
  }

  console.log(`Total iteraciones: ${iterations}, Ocurrencias encontradas: ${occurrences.length}`);
  if (occurrences.length > 0) {
    console.log('Primera ocurrencia:', occurrences[0].toISOString());
    console.log('Última ocurrencia:', occurrences[occurrences.length - 1].toISOString());
  } else {
    console.warn('⚠️ NO SE GENERARON OCURRENCIAS');
    console.warn('Detalles:', {
      eventStart: event.startDateTime,
      pattern: event.recurrencePattern,
      startRange: startRange.toISOString(),
      endRange: endRange.toISOString(),
      iterations,
      currentDateFinal: currentDate.toISOString()
    });
  }

  return occurrences;
}

/**
 * Formatea una fecha para mostrar en el calendario
 */
export function formatRecurrenceInfo(pattern: string): string {
  const parsed = parseRecurrencePattern(pattern);
  if (!parsed) return '';

  let info = '';
  
  switch (parsed.FREQ) {
    case 'DAILY':
      info = parsed.INTERVAL === 1 ? 'Diario' : `Cada ${parsed.INTERVAL} días`;
      break;
    case 'WEEKLY':
      info = parsed.INTERVAL === 1 ? 'Semanal' : `Cada ${parsed.INTERVAL} semanas`;
      if (parsed.BYDAY) {
        const days = parsed.BYDAY.map(d => {
          const names: { [key: string]: string } = {
            'SU': 'Dom', 'MO': 'Lun', 'TU': 'Mar', 'WE': 'Mié', 
            'TH': 'Jue', 'FR': 'Vie', 'SA': 'Sáb'
          };
          return names[d];
        });
        info += ` (${days.join(', ')})`;
      }
      break;
    case 'MONTHLY':
      info = parsed.INTERVAL === 1 ? 'Mensual' : `Cada ${parsed.INTERVAL} meses`;
      if (parsed.BYMONTHDAY) {
        info += ` (día ${parsed.BYMONTHDAY})`;
      }
      break;
    case 'YEARLY':
      info = parsed.INTERVAL === 1 ? 'Anual' : `Cada ${parsed.INTERVAL} años`;
      break;
  }

  if (parsed.UNTIL) {
    info += ` hasta ${parsed.UNTIL.toLocaleDateString('es-ES')}`;
  }

  return info;
}
