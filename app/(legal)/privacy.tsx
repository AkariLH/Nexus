import { LegalDocument } from '../../components/legal/LegalDocument';
import { PRIVACY } from '../../constants/legal';

/** [terminos-en-app] Figma O3. Se abre desde Crear cuenta y desde Configuraciones › Legal. */
export default function PrivacyScreen() {
  return <LegalDocument title="Aviso de privacidad" sections={PRIVACY} />;
}
