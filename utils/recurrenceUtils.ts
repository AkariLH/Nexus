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
  },
  startRange: Date,
  endRange: Date
): Date[] {
  console.log('\n=== expandRecurringEvent ===');
  console.log('Event start:', event.startDateTime);
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

  const occurrences: Date[] = [];
  const eventStart = new Date(event.startDateTime);
  const eventEnd = new Date(event.endDateTime);
  const duration = eventEnd.getTime() - eventStart.getTime();
  
  console.log('Event start Date:', eventStart.toISOString());
  console.log('Event start local:', eventStart.toLocaleDateString(), eventStart.toLocaleTimeString());
  console.log('FREQ:', pattern.FREQ, 'INTERVAL:', pattern.INTERVAL);
  
  // Trabajar con fechas locales para evitar problemas de zona horaria
  // Para eventos anuales/mensuales, usar el día del patrón, no el de la fecha guardada
  let year = eventStart.getFullYear();
  let month = eventStart.getMonth();
  let day = eventStart.getDate();
  let hours = eventStart.getHours();
  let minutes = eventStart.getMinutes();
  
  // Ajustar mes y día según el patrón para evitar problemas de conversión UTC
  if (pattern.FREQ === 'YEARLY' || pattern.FREQ === 'MONTHLY') {
    if (pattern.BYMONTH !== undefined) {
      month = pattern.BYMONTH - 1;
    }
    if (pattern.BYMONTHDAY !== undefined) {
      day = pattern.BYMONTHDAY;
    }
  }
  
  // Crear fecha actual usando componentes locales
  let currentDate = new Date(year, month, day, hours, minutes);
  
  console.log('Fecha inicial ajustada:', currentDate.toLocaleDateString(), currentDate.toLocaleTimeString());
  
  // Límite máximo: la fecha UNTIL del patrón o la fecha final del rango o 2 años desde hoy
  const maxDate = pattern.UNTIL || new Date(endRange);
  const absoluteMax = new Date();
  absoluteMax.setFullYear(absoluteMax.getFullYear() + 2);
  const finalLimit = maxDate < absoluteMax ? maxDate : absoluteMax;

  console.log('Final limit:', finalLimit.toISOString());

  // Límite de iteraciones para evitar bucles infinitos
  let iterations = 0;
  const maxIterations = 1000;

  while (currentDate <= finalLimit && iterations < maxIterations) {
    iterations++;

    // Validar según el tipo de frecuencia (usando componentes locales)
    let isValid = true;

    if (pattern.FREQ === 'WEEKLY' && pattern.BYDAY) {
      const dayOfWeek = currentDate.getDay();
      const allowedDays = pattern.BYDAY.map(icalDayToJsDay);
      isValid = allowedDays.includes(dayOfWeek);
      if (iterations <= 5) {
        console.log(`Iter ${iterations}: WEEKLY check - day=${dayOfWeek}, allowed=${allowedDays}, valid=${isValid}`);
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
          // Avanzar al siguiente día permitido
          let daysToAdd = 1;
          let nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          
          const allowedDays = pattern.BYDAY.map(icalDayToJsDay);
          const currentDayIndex = allowedDays.indexOf(currentDate.getDay());
          
          if (currentDayIndex === allowedDays.length - 1) {
            // Es el último día de la semana, saltar al próximo ciclo
            const daysUntilNextCycle = 7 * (pattern.INTERVAL || 1) - (currentDate.getDay() - allowedDays[0]);
            nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + daysUntilNextCycle);
          } else {
            // Avanzar al siguiente día permitido
            const nextAllowedDay = allowedDays[currentDayIndex + 1];
            daysToAdd = (nextAllowedDay - currentDate.getDay() + 7) % 7;
            nextDate.setDate(currentDate.getDate() + daysToAdd);
          }
          
          currentDate = nextDate;
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
