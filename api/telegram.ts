import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendTelegramMessage } from './_lib/telegram';

const WELCOME_TEXT = [
  'Привет! 👋 Это бот записи в бьюти-салон.',
  '',
  'Помогу выбрать услугу, мастера, дату и время — всё за пару кликов, прямо в Telegram.',
  '',
  'Нажмите кнопку ниже, чтобы начать запись 💅',
].join('\n');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(200).send('ok');
    return;
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret && req.headers['x-telegram-bot-api-secret-token'] !== expectedSecret) {
    res.status(401).send('unauthorized');
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const miniAppUrl = process.env.MINI_APP_URL;

  if (!token || !miniAppUrl) {
    console.error('Missing TELEGRAM_BOT_TOKEN or MINI_APP_URL env vars');
    res.status(200).send('ok');
    return;
  }

  const message = req.body?.message;
  const text: string | undefined = message?.text;

  if (message && typeof text === 'string' && text.startsWith('/start')) {
    await sendTelegramMessage(token, message.chat.id, WELCOME_TEXT, {
      replyMarkup: { inline_keyboard: [[{ text: '✨ Записаться', web_app: { url: miniAppUrl } }]] },
    });
  }

  res.status(200).send('ok');
}
