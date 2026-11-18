import { EVENT_CATEGORIES, errorTitleFor, eventStart, missingForEvent, withDateInput, withTimeInput, toDateInput, toTimeInput } from './eventForm';

describe('[recordatorio-hora] eventStart', () => {
  it('junta el día elegido con la hora elegida (antes los recordatorios usaban una hora cualquiera)', () => {
    const day = new Date(2026, 10, 17, 9, 2); // la fecha guarda la hora en que se eligió
    const time = new Date(2026, 0, 1, 18, 30);
    const start = eventStart(day, time, false);
    expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes()]).toEqual([2026, 10, 17, 18, 30]);
  });

  it('todo el día empieza a medianoche de ese día', () => {
    const start = eventStart(new Date(2026, 10, 17, 9, 2), new Date(2026, 0, 1, 18, 30), true);
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([17, 0, 0]);
  });
});

describe('[fecha-web] campos de fecha y hora del navegador', () => {
  const base = new Date(2026, 10, 20, 18, 30); // 20 nov 2026, 18:30 hora local

  it('pasa una fecha y una hora al formato de los campos del navegador', () => {
    expect(toDateInput(base)).toBe('2026-11-20');
    expect(toTimeInput(base)).toBe('18:30');
    expect(toTimeInput(new Date(2026, 0, 5, 7, 5))).toBe('07:05');
  });

  it('cambiar la fecha conserva la hora', () => {
    const next = withDateInput(base, '2026-12-01')!;
    expect([next.getFullYear(), next.getMonth(), next.getDate(), next.getHours(), next.getMinutes()]).toEqual([2026, 11, 1, 18, 30]);
  });

  it('cambiar la hora conserva la fecha', () => {
    const next = withTimeInput(base, '09:15')!;
    expect([next.getFullYear(), next.getMonth(), next.getDate(), next.getHours(), next.getMinutes()]).toEqual([2026, 10, 20, 9, 15]);
  });

  it('un campo vacío o mal escrito no cambia nada', () => {
    expect(withDateInput(base, '')).toBeNull();
    expect(withTimeInput(base, '25:99')).toBeNull();
  });
});

describe('[eventos-sin-choques] errorTitleFor', () => {
  it('un choque de horario (409) tiene título propio', () => {
    expect(errorTitleFor({ status: 409, message: 'Luis ya tiene algo a esa hora. Elige otro horario.' })).toBe(
      'Ese horario está ocupado'
    );
  });

  it('cualquier otro error sigue diciendo «Algo salió mal»', () => {
    expect(errorTitleFor({ status: 400 })).toBe('Algo salió mal');
    expect(errorTitleFor(undefined)).toBe('Algo salió mal');
  });
});

const complete = {
  title: 'Cena',
  startDateSelected: true,
  endDateSelected: true,
  startTimeSelected: true,
  endTimeSelected: true,
  isAllDay: false,
};

describe('missingForEvent', () => {
  it('dice que falta para poder crear el evento', () => {
    expect(missingForEvent({ ...complete, title: '  ' })).toBe('Falta el título.');
    expect(missingForEvent({ ...complete, startDateSelected: false })).toBe('Falta la fecha de inicio.');
    expect(missingForEvent({ ...complete, endTimeSelected: false })).toBe('Falta la hora de fin.');
  });

  it('todo el dia no pide horas; completo no dice nada', () => {
    expect(missingForEvent({ ...complete, isAllDay: true, startTimeSelected: false, endTimeSelected: false })).toBeNull();
    expect(missingForEvent(complete)).toBeNull();
  });
});

describe('EVENT_CATEGORIES', () => {
  it('son las 7 dimensiones del bienestar, como en el resto de la app', () => {
    expect(EVENT_CATEGORIES).toEqual(['Físico', 'Emocional', 'Social', 'Intelectual', 'Profesional', 'Ambiental', 'Espiritual']);
  });
});
