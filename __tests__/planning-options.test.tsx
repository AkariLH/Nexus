/**
 * Figma B3 / B7 - Opciones para los dos: estados de coincidencia, votos, proponer y, sin mas
 * opciones guardadas, la invitacion a ajustar filtros.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OptionsView } from '../components/planning/OptionsView';
import type { PlanningOption, PlanningView } from '../services/planning.service';

jest.setTimeout(20000);

const NOW = new Date('2026-10-17T18:00:00.000Z');

const option = (id: number, title: string, myVote: PlanningOption['myVote'], partnerVote: PlanningOption['partnerVote']): PlanningOption => ({
  item: {
    id,
    activityId: id,
    title,
    category: 'SOCIAL',
    categoryLabel: 'Social',
    scope: 'HOME',
    placeName: null,
    boroughName: null,
    durationMinutes: 120,
    costPerPersonMxn: 0,
    reason: 'Un plan tranquilo.',
    reasonSource: 'CATALOG',
    startsAt: '2026-10-18T00:00:00Z',
    endsAt: '2026-10-18T02:00:00Z',
  },
  myVote,
  partnerVote,
});

const view = (hasMore: boolean): PlanningView => ({
  id: 50,
  status: 'ACTIVE',
  phase: 'OPTIONS',
  role: 'INVITER',
  me: { userId: 4, name: 'Ana', online: true, ready: false },
  partner: { userId: 13, name: 'Sam', online: true, ready: false },
  inviteExpiresAt: '2026-10-18T18:00:00Z',
  sessionExpiresAt: '2026-10-18T04:05:00Z',
  filters: null,
  activity: [],
  options: [
    option(101, 'Cine al aire libre', 'LIKE', 'LIKE'),
    option(102, 'Paseo en bici', 'LIKE', 'DISLIKE'),
    option(103, 'Noche de juegos', null, 'LIKE'),
  ],
  hasMore,
  relaxedFilters: [],
  adjustingByPartner: false,
  proposal: null,
  agreed: null,
  eventId: null,
  unreadMessages: 3,
  leftover: null,
});

function setup(hasMore: boolean) {
  const handlers = {
    onVote: jest.fn(),
    onPropose: jest.fn(),
    onMore: jest.fn(),
    onAdjust: jest.fn(),
    onOpenChat: jest.fn(),
  };
  render(<OptionsView view={view(hasMore)} now={NOW} busy={false} {...handlers} />);
  return handlers;
}

describe('Opciones para los dos', () => {
  it('muestra tiempo, chat con nuevos y los estados de coincidencia', () => {
    setup(true);

    expect(screen.getByText('Quedan 10 h 5 min para decidir')).toBeTruthy();
    expect(screen.getByText('Chat con Sam')).toBeTruthy();
    expect(screen.getByText('3 nuevos')).toBeTruthy();
    expect(screen.getByText('¡Coinciden! A los dos les gusta')).toBeTruthy();
    expect(screen.getByText('No coinciden: platíquenlo en el chat')).toBeTruthy();
    expect(screen.getByText('Tú: aún no · Sam: le gusta')).toBeTruthy();
  });

  it('votar y proponer llaman con la opcion correcta', () => {
    const h = setup(true);

    fireEvent.press(screen.getByLabelText('Me gusta Noche de juegos'));
    fireEvent.press(screen.getByLabelText('No me convence Paseo en bici'));
    fireEvent.press(screen.getAllByText('Proponer esta cita')[0]);

    expect(h.onVote).toHaveBeenCalledWith(103, 'LIKE');
    expect(h.onVote).toHaveBeenCalledWith(102, 'DISLIKE');
    expect(h.onPropose).toHaveBeenCalledWith(101);
  });

  it('con mas opciones guardadas, buscar mas las pide', () => {
    const h = setup(true);
    fireEvent.press(screen.getByText('Buscar más opciones'));
    expect(h.onMore).toHaveBeenCalled();
  });

  it('sin mas opciones invita a ajustar filtros (B7)', () => {
    const h = setup(false);

    fireEvent.press(screen.getByText('Buscar más opciones'));
    expect(h.onMore).not.toHaveBeenCalled();
    expect(screen.getByText('¿Quieren ver más opciones?')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Ajustar filtros')[1]);
    expect(h.onAdjust).toHaveBeenCalled();
  });
});
