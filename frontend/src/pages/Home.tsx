import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

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
          { section_title: `Recomendados: ${data.genre1.name}`, items: data.genre1.items },
          { section_title: `Recomendados: ${data.genre2.name}`, items: data.genre2.items },
          { section_title: `Recomendados: ${data.genre3.name}`, items: data.genre3.items },
        ];
        setSections(formattedSections);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando home:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-8 border-black dark:border-white border-t-purple-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-3xl font-black uppercase tracking-widest dark:text-white">Cargando...</h2>
      </div>
    </div>
  );

return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 pb-20 font-sans transition-colors duration-500">
      
      <header className="mb-12 border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase dark:text-white">
          Panel de <span className="text-purple-600 dark:text-yellow-400">Nakamas</span>
        </h1>
      </header>

      {sections.map((section, idx) => (
        <section key={idx} className="mb-24 max-w-[1440px] mx-auto">
          <div className="flex items-center mb-6 px-4">
            <div className="h-10 w-3 bg-black dark:bg-white mr-4 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]"></div>
            <h2 className="text-3xl font-black uppercase tracking-tight dark:text-white italic">{section.section_title}</h2>
          </div>

          <div className="relative px-4 md:px-20"> 
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              
              {/* BOTONES: Reset total de animación. 
                  Usamos '!translate-y-[-50%]' para forzar que se queden quietos en el centro vertical 
              */}
              <CarouselPrevious className="hidden lg:flex absolute -left-16 top-1/2 !translate-y-[-50%] border-4 border-black dark:border-white w-14 h-14 bg-white dark:bg-slate-800 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none active:shadow-none active:translate-x-[2px] active:translate-y-[-48%]" />
              <CarouselNext className="hidden lg:flex absolute -right-16 top-1/2 !translate-y-[-50%] border-4 border-black dark:border-white w-14 h-14 bg-white dark:bg-slate-800 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none active:shadow-none active:translate-x-[2px] active:translate-y-[-48%]" />

              <CarouselContent className="-ml-4">
                {section.items.map((item) => (
                  <CarouselItem key={item.id} className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    
                    <Card className="border-4 border-black dark:border-white rounded-none overflow-hidden bg-white dark:bg-slate-900 flex flex-col h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:translate-y-[2px] hover:shadow-none">
                      
                      {/* IMAGEN: 
                          Usamos un div intermedio con 'display: flex' y 'p-0' para anular cualquier espacio.
                          El 'aspect-[2/3]' garantiza que el hueco sea perfecto para un póster.
                      */}
                      <div className="p-0 m-0 border-b-4 border-black dark:border-white bg-slate-200 aspect-[2/3] overflow-hidden flex">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover object-top m-0 p-0 block" 
                        />
                        {item.score > 0 && (
                          <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black font-black px-2 py-1 text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                            ⭐ {item.score}
                          </div>
                        )}
                      </div>

                      <CardFooter className="p-4 flex flex-col gap-4 flex-grow dark:bg-slate-900 justify-between">
                        <h3 className="font-black text-lg line-clamp-2 uppercase dark:text-white leading-tight">
                          {item.title}
                        </h3>
                        <Link to={`/media/${item.id}`} className="w-full">
                          <Button className="w-full bg-black dark:bg-white text-white dark:text-black font-black border-2 border-black dark:border-white hover:bg-purple-600 dark:hover:bg-yellow-400 uppercase text-[10px] tracking-widest transition-all">
                            EXPEDIENTE
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>
      ))}
    </div>
  );
}