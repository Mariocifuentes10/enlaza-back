import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import type { MensajeChatbotInput, MensajeHistorial } from '../../schemas/chatbot.schemas.js';
import { llamarClaude, type MensajeClaude } from './claude.client.js';

export interface RespuestaChatbot {
  respuesta: string;
}

const PALABRAS_DISCAPACIDAD_COGNITIVA = [
  'cognitiv',
  'intelectual',
  'autist',
  'autismo',
  'asperger',
  'sindrome de down',
  'aprendizaje',
  'discapacidad cognitiva',
  'atencion',
  'memoria',
];

function tieneDiscapacidadCognitiva(tipoDiscapacidad: string | null): boolean {
  if (!tipoDiscapacidad) {
    return false;
  }
  const normalizado = tipoDiscapacidad.toLowerCase();
  return PALABRAS_DISCAPACIDAD_COGNITIVA.some((palabra) => normalizado.includes(palabra));
}

function construirSystemPrompt(discapacidadCognitiva: boolean): string {
  const base =
    'Eres el asistente virtual de Enlaza, una plataforma de empleo inclusivo para personas con discapacidad. ' +
    'Ayudas con orientación laboral: búsqueda de empleo, consejos para entrevistas, derechos laborales, ' +
    'sugerencias de ajustes razonables y accesibilidad en el trabajo. Responde en español, con un tono cercano ' +
    'y respetuoso, sin usar acrónimos innecesarios. Si no sabes una respuesta, sugiere pedir asesoría a un mentor ' +
    'de la plataforma o al servicio de atención de la empresa.';

  if (!discapacidadCognitiva) {
    return base;
  }

  return (
    base +
    ' La persona a la que atiendes indicó una discapacidad cognitiva. Adapta tu tono: ' +
    'usa lenguaje simple y concreto, frases cortas, evita tecnicismos, y estructura cada respuesta en pasos ' +
    'numerados o viñetas breves. Repite la idea principal al final si hace falta y ofrece ayuda para aclarar. ' +
    'Sé paciente y alentador.'
  );
}

function aMensajesClaude(historial: MensajeHistorial[]): MensajeClaude[] {
  return historial.map((mensaje) => ({
    rol: mensaje.rol === 'asistente' ? 'assistant' : 'user',
    contenido: mensaje.contenido,
  }));
}

export async function enviarMensaje(idUsuario: number, datos: MensajeChatbotInput): Promise<RespuestaChatbot> {
  const candidato = await prisma.candidato.findUnique({
    where: { id_usuario: idUsuario },
    select: { tipo_discapacidad: true },
  });

  const system = construirSystemPrompt(tieneDiscapacidadCognitiva(candidato?.tipo_discapacidad ?? null));

  await prisma.conversacionChatbot.create({
    data: { id_usuario: idUsuario, rol: 'usuario', contenido: datos.mensaje },
  });

  try {
    const respuesta = await llamarClaude({
      system,
      mensajes: [...aMensajesClaude(datos.historial), { rol: 'user', contenido: datos.mensaje }],
    });

    await prisma.conversacionChatbot.create({
      data: { id_usuario: idUsuario, rol: 'asistente', contenido: respuesta },
    });

    return { respuesta };
  } catch (error) {
    logger.warn({ error, id_usuario: idUsuario }, 'No se pudo obtener respuesta del chatbot');
    throw error;
  }
}