import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

// Типизация события
interface Event {
  id: number;
  title: string;
  description: string;
  image: string;
  event_date: string;
}

// Функция для загрузки данных (выполняется на сервере)
async function getEvent(id: string): Promise<Event | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  try {
    const res = await fetch(`${API_BASE}/api/events/${id}/`, {
      next: { revalidate: 60 }, // Кэшируем на 60 секунд
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id);
  if (!event) return { title: "Event Not Found" };
  
  return {
    title: `${event.title} | Daerdree Events`,
    description: event.description.slice(0, 150),
  };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  // В Next.js 15 params нужно ждать (await)
  const { id } = await params
  const event = await getEvent(id);

  if (!event) {
    notFound(); // Покажет стандартную страницу 404
  }

  // Форматирование даты
  const dateObj = new Date(event.event_date);
  
  const dateStr = dateObj.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      timeZone: 'Asia/Nicosia' // <--- Привязка к Кипру
  });
  
  const timeStr = dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Nicosia' // <--- Привязка к Кипру
  });

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Хлебные крошки */}
        <Link href="/events" className="inline-flex items-center text-white/50 hover:text-accent transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
          &larr; Back to Events
        </Link>

        <article className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
          
          {/* ЛЕВАЯ КОЛОНКА: Контент */}
          <div>
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase text-white mb-6 leading-tight">
              {event.title}
            </h1>
            
            <div className="relative aspect-video w-full bg-neutral-900 rounded-sm overflow-hidden mb-10 border border-white/10">
              {event.image ? (
                <Image 
                  src={event.image} 
                  alt={event.title}
                  fill
                  className="object-cover"
                  unoptimized={true} // Важно для внешних URL
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/20">NO IMAGE</div>
              )}
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <p className="whitespace-pre-line text-gray-300 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: Инфо-панель (Sticky) */}
          <div className="relative">
            <div className="lg:sticky lg:top-32 bg-neutral-900/50 border border-white/10 p-8 backdrop-blur-sm">
              <h3 className="font-serif text-xl font-bold text-accent mb-6 uppercase tracking-wider">
                Event Details
              </h3>

              <div className="space-y-6 mb-8">
                <div>
                  <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-white text-lg font-medium">{dateStr}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Time</span>
                  <span className="text-white text-lg font-medium">{timeStr}</span>
                </div>
                <div>
                   <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Location</span>
                   <span className="text-white text-lg font-medium">Daerdree Bar</span>
                </div>
              </div>

             {/* Кнопка Бронирования с параметрами */}
              <Link 
                href={`/book?event=${encodeURIComponent(event.title)}&date=${encodeURIComponent(event.event_date)}`} 
                className="block w-full"
              >
                <button className="w-full py-4 bg-accent text-black font-bold uppercase tracking-widest hover:bg-white transition-colors">
                  Book a Table
                </button>
              </Link>
              
              <p className="text-center text-white/30 text-xs mt-4">
                Reservation is recommended for this event.
              </p>
            </div>
          </div>

        </article>
      </div>
    </main>
  );
}