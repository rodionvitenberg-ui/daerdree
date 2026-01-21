import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Проверь URL - он должен совпадать с тем, где запущен Django
    // Если на сервере - https://daerdree.bar/api/bookings/
    const djangoUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/` 
      : 'http://127.0.0.1:8000/api/bookings/'; 
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Сначала читаем текст ответа, чтобы не упасть на парсинге
    const responseText = await response.text();

    if (!response.ok) {
        console.error("Django Error Status:", response.status);
        console.error("Django Error Body:", responseText); // Тут увидим реальную причину
        return NextResponse.json({ error: 'Backend Error', details: responseText }, { status: response.status });
    }

    // Если всё ок, пробуем парсить (хотя Django может ничего не вернуть на 201 Created)
    let data;
    try {
        data = JSON.parse(responseText);
    } catch {
        data = { success: true };
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Next.js Proxy Error:", error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}