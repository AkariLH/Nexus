/**
 * [terminos-en-app] Figma O1: en Crear cuenta (2 de 2), «términos» y «aviso de privacidad» abren
 * su texto; el resto del renglón sigue marcando la casilla.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TermsConsent } from './TermsConsent';

function setup(checked = false) {
  const props = { checked, onToggle: jest.fn(), onOpenTerms: jest.fn(), onOpenPrivacy: jest.fn() };
  render(<TermsConsent {...props} />);
  return props;
}

it('tocar la casilla la marca, sin abrir nada', () => {
  const p = setup();
  fireEvent.press(screen.getByRole('checkbox'));
  expect(p.onToggle).toHaveBeenCalledTimes(1);
  expect(p.onOpenTerms).not.toHaveBeenCalled();
  expect(p.onOpenPrivacy).not.toHaveBeenCalled();
});

it('«términos» abre los términos y no marca la casilla', () => {
  const p = setup();
  fireEvent.press(screen.getByRole('link', { name: 'términos' }));
  expect(p.onOpenTerms).toHaveBeenCalledTimes(1);
  expect(p.onToggle).not.toHaveBeenCalled();
});

it('«aviso de privacidad» abre el aviso y no marca la casilla', () => {
  const p = setup();
  fireEvent.press(screen.getByRole('link', { name: 'aviso de privacidad' }));
  expect(p.onOpenPrivacy).toHaveBeenCalledTimes(1);
  expect(p.onToggle).not.toHaveBeenCalled();
});

it('la casilla dice si está marcada', () => {
  setup(true);
  expect(screen.getByRole('checkbox')).toBeChecked();
});
