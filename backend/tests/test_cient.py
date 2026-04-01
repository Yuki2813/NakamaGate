import sys
import os
import asyncio

# --- BLOQUE DE CONFIGURACIÓN DE RUTAS (PARA EVITAR EL MODULENOTFOUND) ---
# Obtenemos la ruta de 'NakamaGate' (subiendo dos niveles desde este archivo)
current_dir = os.path.dirname(os.path.abspath(__file__))
root_path = os.path.abspath(os.path.join(current_dir, "..", ".."))

# Inyectamos la raíz en el sistema de búsqueda de Python
if root_path not in sys.path:
    sys.path.insert(0, root_path)
# -----------------------------------------------------------------------

# Ahora los imports funcionarán correctamente buscando desde la raíz
try:
    from backend.clients.anilist_client import anilist_client
    from backend.database import engine
    print("✅ Sistema de rutas y base de datos localizados.")
except ImportError as e:
    print(f"❌ Error crítico de importación: {e}")
    print(f"DEBUG: Buscando en {root_path}")
    sys.exit(1)

async def run_tests():
    print("\n--- 🔍 INICIANDO PRUEBAS DE CLIENTE + ADAPTADOR ---")
    
    try:
        # 1. Probar Buscador Predictivo
        print("\nPrueba 1: Buscando 'One Piece'...")
        search_results = await anilist_client.search_predictive(
            search_text="One Piece", 
            is_adult=False, 
            media_type="MANGA"
        )
        
        if search_results:
            for item in search_results:
                print(f" > [{item['type']}] ID: {item['id']} | Título: {item['title']}")
        else:
            print("⚠️ No se obtuvieron resultados en la búsqueda.")

        # 2. Probar Datos de la Home
        print("\nPrueba 2: Cargando Mixpack de la Home (Tops)...")
        home_data = await anilist_client.get_home_data(
            is_adult=False, 
            random_genre="Action", 
            excluded_genres=[]
        )
        
        # 2. Probar Datos de la Home
        print("\nPrueba 2: Cargando Mixpack de la Home (Tops)...")
        home_data = await anilist_client.get_home_data(
            is_adult=False, 
            random_genre="Action", 
            excluded_genres=[]
        )
        
        # Mostramos los Tops
        print(f"\n🔥 TOP ANIMES ENCONTRADOS ({len(home_data['top_animes'])}):")
        for anime in home_data['top_animes']:
            print(f" ⭐ {anime.get('score', 'N/A')} pts | {anime['title']}")

        print(f"\n📚 TOP MANGAS ENCONTRADOS ({len(home_data['top_mangas'])}):")
        for manga in home_data['top_mangas']:
            print(f" ⭐ {manga.get('score', 'N/A')} pts | {manga['title']}")

        # AQUÍ ESTABA EL CAMBIO: Usamos 'recommended'
        print(f"\n🎯 RECOMENDACIÓN ALEATORIA (Género: Action):")
        for rec in home_data['recommended']:
            print(f" 🎲 {rec['title']}")

        # 3. Probar Detalles
        print("\nPrueba 3: Cargando detalles de 'Death Note' (ID: 1535)...")
        details = await anilist_client.get_media_details(1535)
        if details:
            print(f" ✅ Título: {details['title']}")
            print(f" ✅ Descripción: {details['description'][:100]}...")
        
        print("\n--- ✨ TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO ---")

    except Exception as e:
        print(f"\n❌ Ocurrió un error durante la ejecución: {e}")

if __name__ == "__main__":
    # Ejecución del bucle asíncrono
    asyncio.run(run_tests())