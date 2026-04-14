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

// Adaptamos la interfaz a los datos reales que trae tu JSON
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
    // Llamamos a tu endpoint real
    apiClient.get('content/home')
      .then(res => {
        const data = res.data;

        // Transformamos tu JSON en un array de secciones para poder mapearlo fácilmente
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-8 border-black border-t-purple-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-3xl font-black uppercase tracking-widest">Cargando Nakamas...</h2>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 pb-20 font-sans antialiased">
      <header className="mb-12 border-b-4 border-black pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">
            Panel de <span className="text-purple-600">Nakamas</span>
          </h1>
          <p className="font-bold text-slate-600 mt-2">Descubre tu próxima obsesión.</p>
        </div>
      </header>

      {/* Iteramos sobre las secciones que hemos formateado */}
      {sections.map((section, idx) => (
        <section key={idx} className="mb-16">
          <div className="flex items-center mb-6">
            <div className="h-10 w-3 bg-black mr-4 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]"></div>
            <h2 className="text-3xl font-black uppercase tracking-tight">{section.section_title}</h2>
          </div>

          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {section.items.map((item) => (
                <CarouselItem key={item.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <Card className="border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white hover:-translate-y-2 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all h-full flex flex-col">

                    <CardContent className="p-0 aspect-[3/4] relative border-b-4 border-black bg-slate-200 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        loading="lazy"
                      />
                      {/* Solo mostramos la nota si es mayor que 0 (algunos géneros vienen con score 0 en tu JSON) */}
                      {item.score > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black font-black px-2 py-1 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-3">
                          ⭐ {item.score}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 flex flex-col justify-between items-start gap-3 flex-grow">
                      <h3 className="font-black text-lg line-clamp-2 uppercase leading-tight w-full">
                        {item.title}
                      </h3>

                      {/* ESTE ES EL CAMBIO CLAVE: Envolvemos el botón con un Link que use la ID real */}
                      <Link to={`/media/${item.id}`} className="w-full">
                        <Button className="w-full bg-black text-white font-bold border-2 border-black hover:bg-purple-600 uppercase text-xs transition-colors">
                          Ver Detalles
                        </Button>
                      </Link>
                    </CardFooter>

                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="hidden md:block">
              <CarouselPrevious className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-12 h-12 -left-6 bg-white hover:bg-black hover:text-white transition-colors" />
              <CarouselNext className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-12 h-12 -right-6 bg-white hover:bg-black hover:text-white transition-colors" />
            </div>
          </Carousel>
        </section>
      ))}
    </div>
  );
}