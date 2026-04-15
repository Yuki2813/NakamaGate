import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface MediaItem {
  id: number;
  title: string;
  image: string;
  score: number;
}

interface HomeSection {
  section_title: string;
  items: MediaItem[];
}

export default function Home() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('content/home')
      .then(res => {
        const data = res.data;
        const formattedSections: HomeSection[] = [
          { section_title: "Top Animes", items: data.top_animes },
          { section_title: "Top Mangas", items: data.top_mangas },
          { section_title: `Género: ${data.genre1.name}`, items: data.genre1.items },
          { section_title: `Género: ${data.genre2.name}`, items: data.genre2.items },
          { section_title: `Género: ${data.genre3.name}`, items: data.genre3.items },
        ];
        setSections(formattedSections);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Estado de carga semántico usando aria-busy
  if (loading) return (
    <main aria-busy="true" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" role="status">
        <span className="sr-only">Cargando catálogo...</span>
      </div>
    </main>
  );

  return (
    // <main> envuelve todo el contenido principal de la página
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pb-20 transition-colors duration-500 text-slate-900 dark:text-slate-100">
      
      {/* <header> para la cabecera introductoria de la página */}
      <header className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12 pb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Explora <span className="text-purple-600 dark:text-purple-400">NakamaGate</span>
        </h1>
      </header>

      {/* Iteramos y creamos un <section> por cada bloque temático */}
      {sections.map((section, idx) => {
        const sectionId = `section-${idx}`; // ID único para accesibilidad
        
        return (
          <section key={idx} aria-labelledby={sectionId} className="mb-12 max-w-[1400px] mx-auto group/section">
            
            <header className="flex items-center justify-between px-6 md:px-16 mb-4">
              <h2 id={sectionId} className="text-xl font-semibold tracking-tight opacity-90 text-slate-900 dark:text-slate-100">
                {section.section_title}
              </h2>
              <Link to="#" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors" aria-label={`Ver todo sobre ${section.section_title}`}>
                Ver todo
              </Link>
            </header>

            <div className="relative px-6 md:px-16"> 
              <Carousel opts={{ align: "start", loop: true }} className="w-full" aria-label={`Carrusel de ${section.section_title}`}>
                <CarouselContent className="-ml-4">
                  {section.items.map((item) => (
                    <CarouselItem key={item.id} className="pl-4 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                      
                      {/* <article> define un contenido independiente, perfecto para cada obra */}
                      <article className="h-full">
                        <Card className="border-none bg-transparent shadow-none group/card cursor-pointer h-full">
                          <Link to={`/media/${item.id}`} className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl">
                            
                            {/* <figure> envuelve el contenido multimedia (póster) */}
                            <figure className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 shadow-md transition-all duration-300 group-hover/card:shadow-xl group-hover/card:-translate-y-1 m-0">
                              <img
                                src={item.image}
                                alt={`Póster de ${item.title}`}
                                className="w-full h-full object-cover" 
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity" aria-hidden="true" />
                              
                              {item.score > 0 && (
                                <figcaption className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                  <span aria-label={`Puntuación: ${item.score} estrellas`}>⭐ {item.score}</span>
                                </figcaption>
                              )}
                            </figure>

                            <div className="mt-3 flex-grow">
                              <h3 className="text-sm font-medium leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 opacity-80 group-hover/card:opacity-100 transition-opacity">
                                {item.title}
                              </h3>
                            </div>
                          </Link>
                        </Card>
                      </article>

                    </CarouselItem>
                  ))}
                </CarouselContent>

                {/* Botones de navegación con aria-labels */}
                <CarouselPrevious 
                  aria-label="Ver elementos anteriores"
                  className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-white backdrop-blur-md shadow-lg opacity-0 scale-75 group-hover/section:opacity-100 group-hover/section:scale-100 transition-all duration-300 hover:!scale-110 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-slate-700" 
                />
                <CarouselNext 
                  aria-label="Ver siguientes elementos"
                  className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-white backdrop-blur-md shadow-lg opacity-0 scale-75 group-hover/section:opacity-100 group-hover/section:scale-100 transition-all duration-300 hover:!scale-110 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-slate-700" 
                />

              </Carousel>
            </div>
          </section>
        );
      })}
    </main>
  );
}