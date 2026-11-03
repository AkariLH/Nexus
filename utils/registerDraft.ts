/**
 * H4 "¿Escribiste mal tu correo? Cámbialo": guarda en memoria lo que se escribió al crear la cuenta
 * para que al volver solo haya que corregir el correo. No va en la ruta (en web quedaría en la URL)
 * ni en el almacenamiento del teléfono, y se borra al verificar el correo.
 */
export type RegisterDraft = {
  password: string;
  name: string;
  nickname: string;
  birthDate: Date | null;
  termsAccepted: boolean;
};

let draft: RegisterDraft | null = null;

export function keepRegisterDraft(next: RegisterDraft): void {
  draft = next;
}

export function readRegisterDraft(): RegisterDraft | null {
  return draft;
}

export function clearRegisterDraft(): void {
  draft = null;
}
