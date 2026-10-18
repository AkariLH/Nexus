import { EVENT_CATEGORIES, missingForEvent } from './eventForm';

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
