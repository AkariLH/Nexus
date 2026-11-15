import { LegalDocument } from '../../components/legal/LegalDocument';
import { TERMS } from '../../constants/legal';

/** [terminos-en-app] Figma O2. Se abre desde Crear cuenta y desde Configuraciones › Legal. */
export default function TermsScreen() {
  return <LegalDocument title="Términos y condiciones" sections={TERMS} />;
}
