import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PasswordRules } from './PasswordRules';

describe('PasswordRules', () => {
  it('sin contraseña, las 5 reglas quedan pendientes', () => {
    render(<PasswordRules password="" />);
    expect(screen.getAllByLabelText(/pendiente$/)).toHaveLength(5);
  });

  it('al escribir, marca las que cumple y las que faltan', () => {
    render(<PasswordRules password="Nexus2026" />);
    expect(screen.getAllByLabelText(/cumple$/)).toHaveLength(4);
    expect(screen.getByLabelText('Un símbolo (por ejemplo ! o #): falta')).toBeTruthy();
  });
});
