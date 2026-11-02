/**
 * Reglas del registro (Figma H2/H3). Cada funcion devuelve el texto que se le muestra a la persona
 * o `null` si todo esta bien.
 */

// FA02: solo proveedores conocidos.
const TRUSTED_DOMAINS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com',
  'protonmail.com', 'proton.me', 'tutanota.com', 'zoho.com', 'mail.com',
  'yandex.com', 'gmx.com', 'fastmail.com', 'inbox.com',
  'hotmail.es', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'outlook.es', 'outlook.co.uk', 'outlook.fr', 'outlook.de',
  'yahoo.es', 'yahoo.com.mx', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de',
  'live.es', 'live.co.uk', 'live.fr', 'live.de',
  'gmail.es', 'gmail.co.uk', 'gmail.fr', 'gmail.de',
];

export function emailProblem(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return 'Escribe tu correo electrónico.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El formato del correo electrónico no es válido.';
  const domain = email.split('@')[1];
  if (!TRUSTED_DOMAINS.includes(domain)) {
    return 'Usa un correo de un proveedor conocido (Gmail, Outlook, Yahoo, Hotmail…).';
  }
  return null;
}

/** RN-01: la primera regla que le falta a la contrasena. */
export function passwordProblem(password: string): string | null {
  if (!password) return 'Escribe una contraseña.';
  if (password.length < 8) return 'Usa al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'Agrega una mayúscula.';
  if (!/[a-z]/.test(password)) return 'Agrega una minúscula.';
  if (!/[0-9]/.test(password)) return 'Agrega un número.';
  // Los mismos simbolos que acepta RegisterRequest.java; con otro (p. ej. ~) el backend la rechaza.
  if (!/[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(password)) return 'Agrega un símbolo (por ejemplo ! o #).';
  return null;
}

const SYMBOL = /[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/;

/** Figma H2 (requisitos): cada regla de RN-01 con si ya se cumple, en el orden de la lista. */
export function passwordChecks(password: string): { label: string; met: boolean }[] {
  return [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Una mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Una minúscula', met: /[a-z]/.test(password) },
    { label: 'Un número', met: /[0-9]/.test(password) },
    { label: 'Un símbolo (por ejemplo ! o #)', met: SYMBOL.test(password) },
  ];
}

/** FA03: tiene 18 años cumplidos en `today`. */
export function isAdult(birthDate: Date, today: Date = new Date()): boolean {
  const eighteenth = new Date(birthDate.getFullYear() + 18, birthDate.getMonth(), birthDate.getDate());
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eighteenth <= startOfToday;
}

/** Fecha local como la espera el backend: "2001-03-14". */
export function toBackendDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Lo contrario de toBackendDate, en hora local (el campo de fecha de la web da "2001-03-14"). */
export function fromBackendDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toBackendDate(date) === iso ? date : null;
}

/** Figma H3: "Si lo dejas vacío, usamos tu nombre." */
export function nicknameOrName(nickname: string, name: string): string {
  return nickname.trim() || name.trim();
}
