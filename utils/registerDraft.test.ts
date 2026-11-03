import { clearRegisterDraft, keepRegisterDraft, readRegisterDraft } from './registerDraft';

describe('registerDraft', () => {
  it('guarda los datos del registro para "Cámbialo" hasta que se verifica el correo', () => {
    const draft = {
      password: 'Nexus2026!',
      name: 'Ana',
      nickname: 'Ani',
      birthDate: new Date(1999, 4, 4),
      termsAccepted: true,
    };
    keepRegisterDraft(draft);

    expect(readRegisterDraft()).toEqual(draft);
    expect(readRegisterDraft()).toEqual(draft);
    clearRegisterDraft();
    expect(readRegisterDraft()).toBeNull();
  });
});
