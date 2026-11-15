import type { Ionicons } from '@expo/vector-icons';

/**
 * [terminos-en-app] Términos y condiciones y aviso de privacidad (Figma O2 y O3).
 *
 * Los párrafos son los del Anexo E de la tesis, tal cual; cada uno es una tarjeta con un título
 * corto. Si cambia el texto legal, se cambia aquí y en el Anexo E a la vez.
 */
export interface LegalSection {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export const TERMS: LegalSection[] = [
  {
    title: 'Aceptación',
    icon: 'checkmark-circle-outline',
    text: 'Al acceder y usar esta aplicación, usted (“Usuario”) acepta los presentes Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, deberá abstenerse de utilizar la aplicación.',
  },
  {
    title: 'Qué hace Nexus',
    icon: 'sparkles-outline',
    text: 'La aplicación proporciona una plataforma para que las parejas gestionen su tiempo en común, registren su estado de ánimo, evalúen sus citas y reciban sugerencias de actividades generadas por un agente de inteligencia artificial a partir de sus preferencias. Asimismo, permite enviar recordatorios y avisos y, cuando el usuario lo autoriza, usar su ubicación para buscar actividades cercanas, sin almacenarla.',
  },
  {
    title: 'Tu cuenta',
    icon: 'key-outline',
    text: 'Para usar la aplicación, es necesario registrar una cuenta mediante correo electrónico y contraseña. El Usuario se responsabiliza de mantener estas credenciales de forma segura y es responsable de toda actividad que ocurra bajo su cuenta. El acceso a la aplicación está permitido únicamente para usos personales, lícitos y consistentes con estos Términos. Queda prohibido modificar, distribuir, descompilar o explotar comercialmente cualquier parte del software.',
  },
  {
    title: 'Sobre las recomendaciones',
    icon: 'bulb-outline',
    text: 'Las recomendaciones proporcionadas por el agente de inteligencia artificial no deben entenderse como consejo psicológico, médico, legal o profesional. Son aproximaciones basadas en patrones de preferencias y no sustituyen la intervención humana especializada.',
  },
  {
    title: 'Disponibilidad del servicio',
    icon: 'time-outline',
    text: 'La disponibilidad del servicio puede variar por mantenimiento, actualizaciones o interrupciones imprevistas del servidor. No se garantiza un acceso ininterrumpido ni libre de errores.',
  },
  {
    title: 'Responsabilidad',
    icon: 'alert-circle-outline',
    text: 'En lo referente a la responsabilidad, el desarrollador no asume obligaciones por decisiones personales tomadas en función de las sugerencias del agente de IA, ni por daños derivados de fallas en el dispositivo del Usuario o del servicio. El Usuario libera a los desarrolladores de cualquier reclamación por pérdidas directas, indirectas o colaterales relacionadas con el uso de la aplicación.',
  },
  {
    title: 'Propiedad intelectual',
    icon: 'lock-closed-outline',
    text: 'La propiedad intelectual de todos los componentes de la aplicación, incluyendo código, agentes de IA, diseño, contenido de interfaz y bases de datos, pertenece al equipo desarrollador. El Usuario recibe una licencia limitada, no transferible y no exclusiva para usar la aplicación, pero no adquiere derechos sobre el contenido subyacente o la infraestructura de IA.',
  },
  {
    title: 'Cambios a estos términos',
    icon: 'refresh-outline',
    text: 'Estos Términos pueden modificarse periódicamente para adaptarse a nuevos requisitos legales, técnicos o de negocio. Las actualizaciones se comunicarán dentro de la aplicación y, si el Usuario continúa usándola después de dichos cambios, se entenderá que acepta las modificaciones.',
  },
  {
    title: 'Cancelar tu cuenta',
    icon: 'trash-outline',
    text: 'El Usuario podrá cancelar su cuenta en cualquier momento. La eliminación de la cuenta implica el borrado de datos personales según lo previsto en el Aviso de Privacidad, aunque algunas obligaciones de confidencialidad o disposiciones sobre propiedad intelectual podrán subsistir.',
  },
  {
    title: 'Leyes aplicables',
    icon: 'document-text-outline',
    text: 'Estos Términos se rigen por las leyes mexicanas. Las controversias que surjan de su interpretación o cumplimiento se someterán a los tribunales competentes del lugar de residencia del Usuario, con renuncia expresa a cualquier otro fuero, en la medida permitida por la ley.',
  },
];

export const PRIVACY: LegalSection[] = [
  {
    title: 'Nuestro compromiso',
    icon: 'shield-checkmark-outline',
    text: 'En esta aplicación estamos comprometidos con la protección de su información personal y tratamos sus datos conforme a la legislación mexicana aplicable, incluyendo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.',
  },
  {
    title: 'Qué datos recabamos',
    icon: 'list-outline',
    text: 'Recabamos su nombre, correo electrónico, fecha de nacimiento y contraseña, que se almacena protegida con un algoritmo irreversible; su estado de ánimo diario y las calificaciones de sus citas, que se guardan cifrados; sus preferencias, los eventos de la agenda compartida y, si usted lo autoriza, los eventos de los calendarios de su teléfono. Estos datos se utilizan exclusivamente para ofrecer la funcionalidad de la aplicación: gestión del tiempo compartido, registro emocional, evaluación de citas y recomendaciones personalizadas.',
  },
  {
    title: 'Tus datos sensibles',
    icon: 'heart-outline',
    text: 'La base legal para el tratamiento de sus datos sensibles, como su estado de ánimo, es su consentimiento expreso, que otorga al aceptar este aviso durante el registro. Su registro emocional y sus calificaciones son privados: ni siquiera su pareja puede consultarlos.',
  },
  {
    title: 'Dónde se guardan',
    icon: 'lock-closed-outline',
    text: 'Su información se almacena en servidores de Amazon Web Services protegidos mediante cifrado y controles de acceso y, las recomendaciones se generan en ese mismo servidor, sin enviar sus datos a servicios de inteligencia artificial de terceros. Para consultar el pronóstico del clima se envía a un servicio meteorológico únicamente un punto geográfico aproximado, sin ningún dato que lo identifique. El envío de correos de verificación y, en su caso, de notificaciones al teléfono se realiza a través de proveedores de esos servicios.',
  },
  {
    title: 'Mensajes de la planeación',
    icon: 'chatbubble-outline',
    text: 'Los mensajes que intercambie con su pareja durante la planeación de una cita se eliminan al terminar la sesión y nunca se envían al agente de recomendaciones.',
  },
  {
    title: 'Tus derechos ARCO',
    icon: 'person-outline',
    text: 'Usted tiene derecho a acceder, rectificar, cancelar u oponerse al uso de sus datos (derechos ARCO) mediante los mecanismos integrados en la aplicación. En caso de solicitar la eliminación de su cuenta, su información será borrada permanentemente, salvo por obligaciones legales que requieran su retención por un tiempo limitado.',
  },
  {
    title: 'Avisos y ubicación',
    icon: 'location-outline',
    text: 'Podremos enviarle avisos importantes sobre la aplicación o recordatorios. Usamos su permiso para obtener su ubicación solo cuando es estrictamente necesario para alguna funcionalidad y no la almacenamos. Sus respuestas y preferencias son tratadas con confidencialidad.',
  },
  {
    title: 'Cambios a este aviso',
    icon: 'refresh-outline',
    text: 'Este Aviso de Privacidad podrá actualizarse para ajustarse a cambios normativos o tecnológicos. Publicaremos la versión más reciente en la aplicación y usted tendrá la oportunidad de aceptarla para continuar el uso del servicio.',
  },
];
