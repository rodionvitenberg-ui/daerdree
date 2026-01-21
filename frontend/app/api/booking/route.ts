// frontend/app/api/booking/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Отправляем данные в наш Django API
    // Предполагаем, что Django крутится на локалхосте или по IP
    // DJANGO_API_URL лучше вынести в env, например http://127.0.0.1:8000/api/bookings/
    
    // ВАЖНО: Убедись, что адрес правильный.
    const djangoUrl = 'https://daerdree.bar/api/bookings/'; 
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Django Error:", errorData);
        throw new Error('Django API Error');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}