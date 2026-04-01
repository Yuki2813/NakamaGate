import asyncio
import json
from backend.clients import anilist_client

async def test_search_predictive():
    print("\n--- 🔍 PROBANDO BUSCADOR PREDICTIVO (ADAPTADO) ---")
    # Probamos buscando "One Piece" como MANGA
    results = await anilist_client.search_predictive(
        search_text="One Piece", 
        is_adult=False, 
        media_type="MANGA"
    )
    
    if results:
        for item in results:
            # Ahora usamos los nombres del ADAPTADOR: 'title', 'image_thumb', 'type'
            print(f"[{item['type']}] ID: {item['id']} | Título: {item['title']} | Miniatura: {item['image_thumb']}")
    else:
        print("No se encontraron resultados.")

async def test_home_mix():
    print("\n--- 🏠 PROBANDO HOME MIXPACK (ADAPTADO) ---")
    home = await anilist_client.get_home_data(
        is_adult=False, 
        random_genre="Sci-Fi", 
        excluded_genres=["Horror", "Ecchi"]
    )
    
    # El cliente ahora devuelve un diccionario con 3 listas: top_animes, top_mangas, recommended
    print(f"Top Animes encontrados: {len(home['top_animes'])}")
    print(f"Top Mangas encontrados: {len(home['top_mangas'])}")
    
    if home['top_animes']:
        first_anime = home['top_animes'][0]
        print(f"Primer Anime Top: {first_anime['title']} (Score: {first_anime['score']})")

async def test_details():
    print("\n--- 📄 PROBANDO DETALLES (ID 1535 - Death Note) ---")
    details = await anilist_client.get_media_details(1535)
    
    if details:
        print(f"Título: {details['title']}")
        print(f"Año: {details['year']}")
        print(f"Unidades (Episodios/Capítulos): {details['units']}")
        print(f"Descripción (Primeros 100 caracteres): {details['description'][:100]}...")
    else:
        print("No se encontró el detalle.")

if __name__ == "__main__":
    # Ejecutamos el bucle de eventos de asyncio
    try:
        asyncio.run(test_search_predictive())
        asyncio.run(test_home_mix())
        asyncio.run(test_details())
    except Exception as e:
        print(f"❌ Error durante el test: {e}")