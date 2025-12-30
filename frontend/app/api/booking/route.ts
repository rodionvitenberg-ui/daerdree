// app/api/booking/route.ts
import { NextResponse } from 'next/server';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: Request) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, guests, date, contact } = body;

    // Формируем сообщение
    const message = `
🔔 <b>New Booking Request!</b>

👤 <b>Name:</b> ${name}
👥 <b>Guests:</b> ${guests}
📅 <b>Date:</b> ${date}
📞 <b>Contact:</b> ${contact}

<i>Sent from website form</i>
    `;

    // Отправляем в Telegram
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML', // Чтобы работала жирность шрифта
      }),
    });

    if (!response.ok) {
        throw new Error('Telegram API Error');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}