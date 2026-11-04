import { TOURS, reconcile, tourAvailability, tourForMilestone } from './tours';
import type { OnboardingProgress } from '../services/onboarding.service';

const progress = (linked: boolean): OnboardingProgress => ({
  me: { questionnaire: true, linked, calendar: false, schedule: false },
  partner: null,
  couple: { firstRecommendation: false, firstRatedDate: false },
});

describe('tourAvailability (cualquier paso, en orden o no)', () => {
  it('horarios y calendario siempre tienen recorrido en el teléfono', () => {
    expect(tourAvailability('schedule', progress(false), false)).toEqual({ tour: 'schedule' });
    expect(tourAvailability('calendar', progress(true), false)).toEqual({ tour: 'calendar' });
  });

  it('en la web el calendario no tiene recorrido', () => {
    expect(tourAvailability('calendar', progress(true), true)).toEqual({ tour: null, reason: 'Hazlo desde tu teléfono' });
  });

  it('recomendación y calificación piden pareja primero', () => {
    expect(tourAvailability('recommendation', progress(false), false)).toEqual({ tour: null, reason: 'Primero vincúlate con tu pareja' });
    expect(tourAvailability('rating', progress(true), false)).toEqual({ tour: 'rating' });
  });

  it('vincular solo se enseña si todavía no hay pareja; el cuestionario no lleva recorrido', () => {
    expect(tourAvailability('link', progress(false), false)).toEqual({ tour: 'link' });
    expect(tourAvailability('link', progress(true), false)).toEqual({ tour: null });
    expect(tourAvailability('questionnaire', progress(true), false)).toEqual({ tour: null });
  });
});

describe('TOURS ([primeros-pasos] Figma N5)', () => {
  it('el del calendario va Inicio → Perfil → Configuraciones → Calendarios externos', () => {
    expect(TOURS.calendar.map(s => [s.screen, s.target, s.advance])).toEqual([
      ['/', 'tab.perfil', 'tap'],
      ['/perfil', 'perfil.settings', 'tap'],
      ['/configuraciones', 'settings.calendars', 'tap'],
      ['/link-external-calendars', 'calendars.phoneList', 'next'],
    ]);
  });

  it('cada recorrido termina en un paso de «Entendido» y los demás se avanzan tocando o con Siguiente', () => {
    for (const steps of Object.values(TOURS)) {
      expect(steps[steps.length - 1].advance).toBe('next');
      // Un paso que se toca siempre lleva a otra pantalla.
      steps.forEach((s, i) => {
        if (s.advance === 'tap') expect(steps[i + 1].screen).not.toBe(s.screen);
      });
    }
  });

  it('cada hito tiene su recorrido salvo el cuestionario (la app lo pide sola)', () => {
    expect(tourForMilestone('questionnaire')).toBeNull();
    expect(tourForMilestone('calendar')).toBe('calendar');
    expect(tourForMilestone('schedule')).toBe('schedule');
    expect(tourForMilestone('link')).toBe('link');
    expect(tourForMilestone('recommendation')).toBe('recommendation');
    expect(tourForMilestone('rating')).toBe('rating');
  });
});

describe('reconcile (la pantalla actual decide el paso)', () => {
  const steps = TOURS.calendar;

  it('en la pantalla del paso, se queda', () => {
    expect(reconcile(steps, 0, '/')).toBe(0);
  });

  it('al tocar lo resaltado y llegar a la pantalla siguiente, avanza', () => {
    expect(reconcile(steps, 0, '/perfil')).toBe(1);
    expect(reconcile(steps, 2, '/link-external-calendars')).toBe(3);
  });

  it('en otra pantalla, el recorrido se cierra (R12)', () => {
    expect(reconcile(steps, 1, '/calendario')).toBeNull();
    expect(reconcile(steps, 3, '/configuraciones')).toBeNull();
  });

  it('un paso de «Siguiente» no avanza solo por la pantalla', () => {
    const link = TOURS.link;
    expect(reconcile(link, 1, '/link')).toBe(1);
  });
});
