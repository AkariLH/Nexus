/** [reaprobar-edicion] Figma P: un plan pendiente va en ámbar, como «Pendientes» en Mis eventos. */
import { palette } from '../../constants/colors';
import type { CalendarItem } from '../../utils/calendarLayout';
import { barColor, blockTint } from './calendarColors';

const item = (over: Partial<CalendarItem>): CalendarItem => ({
  id: '1',
  title: 'Cine',
  start: new Date(2026, 10, 20, 17),
  end: new Date(2026, 10, 20, 19),
  allDay: false,
  source: 'couple',
  subtitle: '',
  color: '#3B82F6',
  readOnly: false,
  eventId: 1,
  externalId: null,
  ...over,
});

it('un plan confirmado usa su color', () => {
  expect(barColor(item({}))).toBe('#3B82F6');
});

it('un plan pendiente va en ámbar, le toque a quien le toque', () => {
  expect(barColor(item({ waiting: 'partner' }))).toBe(palette.warning);
  expect(barColor(item({ waiting: 'me' }))).toBe(palette.warning);
  expect(blockTint(item({ waiting: 'me' }))).toBe(palette.warningSoft);
});

it('el fondo de los demás es su color claro', () => {
  expect(blockTint(item({}))).toBe('#3B82F626');
});
