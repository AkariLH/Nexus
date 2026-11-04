import { TOURS, reconcile, tourForMilestone } from './tours';

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
