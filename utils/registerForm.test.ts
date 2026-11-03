import { emailProblem, fromBackendDate, passwordChecks, isAdult, nicknameOrName, passwordProblem, toBackendDate } from './registerForm';

describe('emailProblem', () => {
  it('acepta correos de proveedores conocidos', () => {
    expect(emailProblem('ana@gmail.com')).toBeNull();
    expect(emailProblem('  Ana@Outlook.com ')).toBeNull();
  });

  it('explica qué falla en el correo (FA02)', () => {
    expect(emailProblem('')).toBe('Escribe tu correo electrónico.');
    expect(emailProblem('ana@')).toBe('El formato del correo electrónico no es válido.');
    expect(emailProblem('ana@empresa.xyz')).toMatch(/proveedor conocido/);
  });
});

describe('passwordProblem', () => {
  it('una contraseña segura no tiene problema (RN-01)', () => {
    expect(passwordProblem('Secreto123!')).toBeNull();
  });

  it('dice la primera regla que falta', () => {
    expect(passwordProblem('')).toBe('Escribe una contraseña.');
    expect(passwordProblem('Ab1!')).toMatch(/8 caracteres/);
    expect(passwordProblem('secreto123!')).toMatch(/mayúscula/);
    expect(passwordProblem('SECRETO123!')).toMatch(/minúscula/);
    expect(passwordProblem('Secretoooo!')).toMatch(/número/);
    expect(passwordProblem('Secreto1234')).toMatch(/símbolo/);
  });
});

describe('isAdult', () => {
  const today = new Date(2026, 9, 19);

  it('cumple 18 hoy o antes (FA03)', () => {
    expect(isAdult(new Date(2008, 9, 19), today)).toBe(true);
    expect(isAdult(new Date(2001, 2, 14), today)).toBe(true);
  });

  it('le falta un día para los 18', () => {
    expect(isAdult(new Date(2008, 9, 20), today)).toBe(false);
  });
});

describe('toBackendDate', () => {
  it('manda la fecha local como AAAA-MM-DD', () => {
    expect(toBackendDate(new Date(2001, 2, 4))).toBe('2001-03-04');
  });
});

describe('nicknameOrName', () => {
  it('si el apodo queda vacío, usa el nombre (Figma H3)', () => {
    expect(nicknameOrName('  ', 'Ana López')).toBe('Ana López');
    expect(nicknameOrName(' Ani ', 'Ana López')).toBe('Ani');
  });
});

describe('fromBackendDate', () => {
  it('lee la fecha del campo de fecha de la web como dia local', () => {
    const date = fromBackendDate('2001-03-14');
    expect(date && toBackendDate(date)).toBe('2001-03-14');
  });

  it('devuelve null si el campo esta vacio o la fecha no existe', () => {
    expect(fromBackendDate('')).toBeNull();
    expect(fromBackendDate('2001-02-30')).toBeNull();
    expect(fromBackendDate('14/03/2001')).toBeNull();
  });
});

describe('passwordChecks', () => {
  it('marca cada regla de RN-01 por separado, en el orden de la lista', () => {
    expect(passwordChecks('Nexus2026')).toEqual([
      { label: 'Mínimo 8 caracteres', met: true },
      { label: 'Una mayúscula', met: true },
      { label: 'Una minúscula', met: true },
      { label: 'Un número', met: true },
      { label: 'Un símbolo: ! @ # $ % ^ & * ( ) _ + - [ ] { } ; \' : " \\ | , . < > / ?', met: false },
    ]);
  });

  it('coincide con passwordProblem: todas cumplen solo si no hay problema', () => {
    for (const pw of ['Secreto123!', 'Ab1!', 'secreto123!', 'Secreto1234', '']) {
      expect(passwordChecks(pw).every((c) => c.met)).toBe(passwordProblem(pw) === null);
    }
  });
});
