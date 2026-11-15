/**
 * [terminos-en-app] Los términos se leen antes de tener cuenta (desde Crear cuenta), así que el
 * grupo (legal) no manda a iniciar sesión.
 */
import { opensWithoutSession } from './publicRoutes';

it('entrada y legal se abren sin sesión', () => {
  expect(opensWithoutSession(['(auth)', 'register'])).toBe(true);
  expect(opensWithoutSession(['(legal)', 'terms'])).toBe(true);
  expect(opensWithoutSession(['(legal)', 'privacy'])).toBe(true);
});

it('lo demás pide sesión', () => {
  expect(opensWithoutSession(['(tabs)', 'configuraciones'])).toBe(false);
  expect(opensWithoutSession(['(link)', 'connect'])).toBe(false);
  expect(opensWithoutSession([])).toBe(false);
});
