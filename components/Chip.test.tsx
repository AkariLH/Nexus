import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from './Chip';

/**
 * Test de humo del arnés de componentes (nexus-TEST-01, T-05).
 *
 * No prueba una regla de negocio: prueba que el arnés monta un componente real, consulta el
 * árbol renderizado y despacha eventos. Si esto se pone rojo, lo que está roto es el arnés
 * —`jest-expo`, `@testing-library/react-native` o `react-test-renderer`— y no `Chip`.
 *
 * `Chip` es el sujeto porque es el componente más simple del proyecto con una rama condicional:
 * pinta el icono de comprobación solo cuando está seleccionado.
 */
describe('Chip', () => {
  const noop = () => {};

  it('should render the label when mounted', () => {
    render(<Chip label="Bienestar Físico" selected={false} onPress={noop} />);

    expect(screen.getByText('Bienestar Físico')).toBeTruthy();
  });

  it('should call onPress once when pressed', () => {
    const onPress = jest.fn();
    render(<Chip label="Leer" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByText('Leer'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should render the check icon only when selected', () => {
    const unselected = render(
      <Chip label="Correr" selected={false} onPress={noop} />,
    ).toJSON();
    const selected = render(
      <Chip label="Correr" selected onPress={noop} />,
    ).toJSON();

    const childCount = (node: any) =>
      node && Array.isArray(node.children) ? node.children.length : 0;

    expect(childCount(selected)).toBe(childCount(unselected) + 1);
  });
});
