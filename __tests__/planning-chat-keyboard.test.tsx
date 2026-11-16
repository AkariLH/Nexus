/**
 * [chat-teclado] Prueba con usuarios del 5-nov: en el chat el teclado tapaba lo que se escribía.
 * Con Android de pantalla completa (edgeToEdgeEnabled en app.json) la ventana ya no se encoge sola:
 * el campo tiene que subir también en Android, no solo en iOS.
 */
import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ sessionId: '5' }),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 7 } }) }));
jest.mock('../services/planning.service', () => ({ __esModule: true, default: { messages: jest.fn(), send: jest.fn() } }));

import PlanningChatScreen from '../app/(planning)/chat';

const original = Platform.OS;
afterEach(() => {
  Platform.OS = original;
});

it.each(['android', 'ios'] as const)('en %s el campo sube con el teclado', (os) => {
  Platform.OS = os;
  const { UNSAFE_getByType } = render(<PlanningChatScreen />);
  expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
});
