import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { mensajeChatbotSchema } from '../schemas/chatbot.schemas.js';
import * as chatbotService from '../services/ai/chatbot.service.js';

export const enviarMensaje: RequestHandler = asyncHandler(async (req, res) => {
  const datos = mensajeChatbotSchema.parse(req.body);
  const resultado = await chatbotService.enviarMensaje(req.usuario!.id_usuario, datos);
  res.json({ success: true, data: resultado });
});