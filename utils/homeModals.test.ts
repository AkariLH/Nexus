/**
 * [modales-un-clic] M-01. Prueba con usuarios del 5-nov: «había que dar clic varias veces para que
 * se cerraran». En Inicio varios avisos podían estar abiertos a la vez y se apilaban: cada «Cerrar»
 * quitaba uno y aparecía el de abajo. Ahora sale uno solo, en orden.
 */
import { homeModalToShow, HomeModalState } from './homeModals';

const none: HomeModalState = {
  focused: true,
  questionnaireDone: false,
  linked: false,
  expiredScan: false,
  invite: null,
  planning: null,
  milestone: false,
  offer: false,
  tourActive: false,
};

it('sin avisos no sale nada', () => {
  expect(homeModalToShow(none)).toBeNull();
});

it('con varios avisos a la vez sale uno solo, el más importante', () => {
  const all: HomeModalState = {
    ...none,
    questionnaireDone: true,
    linked: true,
    expiredScan: true,
    invite: 'accepted',
    planning: 'INVITE',
    milestone: true,
    offer: true,
  };
  expect(homeModalToShow(all)).toBe('questionnaire');
  expect(homeModalToShow({ ...all, questionnaireDone: false })).toBe('linked');
  expect(homeModalToShow({ ...all, questionnaireDone: false, linked: false })).toBe('expiredScan');
  expect(homeModalToShow({ ...none, invite: 'sent', planning: 'AGREED', milestone: true })).toBe('invite-sent');
  expect(homeModalToShow({ ...none, planning: 'AGREED', milestone: true, offer: true })).toBe('planning-AGREED');
  expect(homeModalToShow({ ...none, milestone: true, offer: true })).toBe('milestone');
  expect(homeModalToShow({ ...none, offer: true })).toBe('offer');
});

it('al cerrar uno sale el siguiente', () => {
  const state: HomeModalState = { ...none, invite: 'rejected', planning: 'EXPIRED' };
  expect(homeModalToShow(state)).toBe('invite-rejected');
  expect(homeModalToShow({ ...state, invite: null })).toBe('planning-EXPIRED');
});

it('el aviso de planeación «ajustando» no tiene modal y no tapa a los demás', () => {
  expect(homeModalToShow({ ...none, planning: 'ADJUSTING', milestone: true })).toBe('milestone');
});

it('con Inicio tapado por otra pantalla, o durante el recorrido la oferta, no sale nada', () => {
  expect(homeModalToShow({ ...none, linked: true, focused: false })).toBeNull();
  expect(homeModalToShow({ ...none, offer: true, tourActive: true })).toBeNull();
});
