const TELEGRAM_API = 'https://api.telegram.org/bot';

export function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function getAdminChatId(): string | undefined {
  return process.env.ADMIN_TELEGRAM_ID;
}

interface SendMessageOptions {
  replyMarkup?: object;
}

export async function sendTelegramMessage(
  token: string,
  chatId: number | string,
  text: string,
  options: SendMessageOptions = {},
): Promise<void> {
  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: options.replyMarkup,
      }),
    });
    if (!res.ok) {
      console.error('Telegram sendMessage failed', chatId, await res.text());
    }
  } catch (err) {
    console.error('Telegram sendMessage error', chatId, err);
  }
}
