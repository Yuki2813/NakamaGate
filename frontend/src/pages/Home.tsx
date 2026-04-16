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
import Loader from '../components/Loader';

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

  if (loading) return <Loader text="Cargando catálogo..." />;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-yellow-500/30 pb-20 relative overflow-hidden">

      {/* Detalle de luz de fondo sutil */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true"></div>

      <header className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12 pb-10 relative z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          Explora <span className="text-yellow-500">NakamaGate</span>
        </h1>
      </header>

      <div className="relative z-10">
        {sections.map((section, idx) => {
          const sectionId = `section-${idx}`;

          return (
            <section key={idx} aria-labelledby={sectionId} className="mb-14 max-w-[1400px] mx-auto group/section">

              <header className="flex items-center justify-between px-6 md:px-16 mb-6">
                <h2 id={sectionId} className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  {section.section_title}
                </h2>
                <Link to="/directory" className="text-sm font-bold text-yellow-500 hover:text-yellow-400 transition-colors" aria-label={`Ver todo sobre ${section.section_title}`}>
                  Ver todo
                </Link>
              </header>

              <div className="relative px-6 md:px-16">
                <Carousel opts={{ align: "start", loop: true }} className="w-full" aria-label={`Carrusel de ${section.section_title}`}>
                  <CarouselContent className="-ml-4 md:-ml-6">
                    {section.items.map((item) => (
                      <CarouselItem key={item.id} className="pl-4 md:pl-6 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">

                        <article className="h-full">
                          <Card className="border-none bg-transparent shadow-none group/card cursor-pointer h-full">
                            <Link to={`/media/${item.id}`} className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-xl">

                              {/* FOTO DE LA OBRA CON BORDE DORADO AL HOVER */}
                              <figure className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-lg transition-all duration-300 group-hover/card:shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)] group-hover/card:border-yellow-500/50 group-hover/card:-translate-y-1 m-0">
                                <img
                                  src={item.image}
                                  alt={`Póster de ${item.title}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" aria-hidden="true" />

                                {item.score > 0 && (
                                  <figcaption className="absolute bottom-3 left-3 bg-[#020617]/80 backdrop-blur-md border border-slate-700/50 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <span className="text-yellow-500" aria-hidden="true">★</span>
                                    <span aria-label={`Puntuación: ${item.score} estrellas`}>{item.score}</span>
                                  </figcaption>
                                )}
                              </figure>

                              <div className="mt-4 flex-grow">
                                <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-slate-300 group-hover/card:text-yellow-400 transition-colors">
                                  {item.title}
                                </h3>
                              </div>
                            </Link>
                          </Card>
                        </article>

                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {/* BOTONES DEL CARRUSEL EN DORADO Y OSCURO */}
                  <CarouselPrevious
                    aria-label="Ver elementos anteriores"
                    className="hidden md:flex absolute -left-12 lg:-left-16 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full border border-slate-700 bg-slate-900/90 text-white backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-0 scale-75 group-hover/section:opacity-100 group-hover/section:scale-100 transition-all duration-300 hover:!scale-110 hover:bg-yellow-500 hover:text-black hover:border-yellow-400 z-10"
                  />
                  <CarouselNext
                    aria-label="Ver siguientes elementos"
                    className="hidden md:flex absolute -right-12 lg:-right-16 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full border border-slate-700 bg-slate-900/90 text-white backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-0 scale-75 group-hover/section:opacity-100 group-hover/section:scale-100 transition-all duration-300 hover:!scale-110 hover:bg-yellow-500 hover:text-black hover:border-yellow-400 z-10"
                  />

                </Carousel>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}