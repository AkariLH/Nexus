/**
 * [vinculo-pegar] Prueba con usuarios del 5-nov: «el primer código fallaba». «Copiar» en Conecta con
 * tu pareja copia `NEXUS-ABC234`; quien lo pega en cualquiera de los dos campos debe mandar `ABC234`.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() }));
jest.mock('moti',() => ({ MotiView: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 7 } }) }));
jest.mock('../services/link.service', () => ({
  __esModule: true,
  default: {
    generateCode: jest.fn(() =>
      Promise.resolve({ code: 'MIO234', expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), validityMinutes: 15, message: '' }),
    ),
    establishLink: jest.fn(() => Promise.resolve({ hasActiveLink: true, partner: { displayName: 'Sam' } })),
    getLinkStatus: jest.fn(() => Promise.resolve({ hasActiveLink: false })),
  },
}));

import linkService from '../services/link.service';
import ConnectScreen from '../app/(link)/connect';
import EnterLinkCodeScreen from '../app/(link)/enter-link-code';

const establish = linkService.establishLink as jest.Mock;
beforeEach(() => establish.mockClear());

describe('Conecta con tu pareja (H6)', () => {
  it('pegar NEXUS-ABC234 detrás del NEXUS- del campo manda ABC234', async () => {
    render(<ConnectScreen />);
    await act(async () => {});
    // El campo ya muestra «NEXUS-»; pegar al final deja las dos copias del prefijo.
    fireEvent.changeText(screen.getByLabelText('Código de tu pareja'), 'NEXUS-NEXUS-ABC234');
    await act(async () => {
      fireEvent.press(screen.getByText('Conectar'));
    });
    expect(establish).toHaveBeenCalledWith(7, 'ABC234');
  });

  it('escribir el código a mano sigue funcionando', async () => {
    render(<ConnectScreen />);
    await act(async () => {});
    fireEvent.changeText(screen.getByLabelText('Código de tu pareja'), 'NEXUS-abc234');
    await act(async () => {
      fireEvent.press(screen.getByText('Conectar'));
    });
    expect(establish).toHaveBeenCalledWith(7, 'ABC234');
  });
});

describe('Únete a tu pareja (pestaña Vínculo)', () => {
  it('pegar NEXUS-ABC234 manda ABC234', async () => {
    render(<EnterLinkCodeScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('XXXXXX'), 'NEXUS-ABC234');
    await act(async () => {
      fireEvent.press(screen.getByText('Conectar'));
    });
    expect(establish).toHaveBeenCalledWith(7, 'ABC234');
  });

  it('el campo no corta lo pegado antes de limpiarlo (maxLength)', () => {
    render(<EnterLinkCodeScreen />);
    // Con maxLength=6 el teléfono recorta el pegado a «NEXUS-» antes de que la app lo limpie.
    expect(screen.getByPlaceholderText('XXXXXX').props.maxLength ?? Infinity).toBeGreaterThanOrEqual('NEXUS-ABC234'.length);
  });
});
