"""
Tests de arranque que se ejecutan automáticamente al iniciar el servidor.

Cada función comprueba una pieza concreta de la infraestructura (env, BD,
caché, AniList) y devuelve una tupla (nombre, ok, detalle). Los resultados
se imprimen en stdout para que aparezcan en los logs de Render.

Entrada principal: run_self_tests(). Se invoca desde el lifespan de FastAPI.
"""
import os
import time

from fastapi_cache import FastAPICache
from sqlmodel import Session, select

from backend.clients.anilist_client import anilist_client
from backend.database import engine
from backend.models.users import Users


CheckResult = tuple[str, bool, str]


async def check_env_vars() -> CheckResult:
    """Comprueba que las variables de entorno críticas están definidas."""
    required = ["SECRET_KEY", "DATABASE_URL"]
    missing = []
    for name in required:
        if not os.getenv(name):
            missing.append(name)
    if missing:
        return ("env_vars", False, f"faltan: {', '.join(missing)}")
    return ("env_vars", True, f"{len(required)} variables presentes")


async def check_db_ping() -> CheckResult:
    """Ejecuta SELECT 1 contra la BD para validar la conexión."""
    try:
        with Session(engine) as session:
            session.exec(select(1)).first()
        return ("db_ping", True, "conexión OK")
    except Exception as e:
        return ("db_ping", False, str(e))


async def check_db_admin_exists() -> CheckResult:
    """Verifica que la seed dejó el admin creado."""
    try:
        with Session(engine) as session:
            admin = session.exec(select(Users).where(Users.alias == "yago")).first()
        if admin is None:
            return ("db_admin", False, "admin 'yago' no encontrado")
        return ("db_admin", True, f"id={admin.id}")
    except Exception as e:
        return ("db_admin", False, str(e))


async def check_cache_init() -> CheckResult:
    """El backend de fastapi-cache se ha inicializado en el lifespan."""
    try:
        FastAPICache.get_backend()
        return ("cache_init", True, "backend listo")
    except Exception as e:
        return ("cache_init", False, str(e))


async def check_cache_set_get() -> CheckResult:
    """Escribe y lee una clave de prueba en la caché en memoria."""
    try:
        backend = FastAPICache.get_backend()
        key = f"selftest:{int(time.time() * 1000)}"
        await backend.set(key, "ok", expire=10)
        value = await backend.get(key)
        await backend.clear(key=key)
        if value != "ok":
            return ("cache_set_get", False, f"valor inesperado: {value!r}")
        return ("cache_set_get", True, "set/get/clear OK")
    except Exception as e:
        return ("cache_set_get", False, str(e))


async def check_anilist_details() -> CheckResult:
    """Pide a AniList los detalles de One Piece (id 21) y valida la respuesta."""
    try:
        data = await anilist_client.get_media_details(21)
        if not data or not data.get("title"):
            return ("anilist_details", False, "respuesta vacía o sin title")
        return ("anilist_details", True, f"title={data['title']}")
    except Exception as e:
        return ("anilist_details", False, str(e))


async def check_anilist_search() -> CheckResult:
    """Búsqueda predictiva contra AniList con un texto conocido."""
    try:
        results = await anilist_client.search_predictive(search_text="naruto", media_type="ANIME")
        if not results:
            return ("anilist_search", False, "sin resultados")
        return ("anilist_search", True, f"{len(results)} resultados")
    except Exception as e:
        return ("anilist_search", False, str(e))


CHECKS = [
    check_env_vars,
    check_db_ping,
    check_db_admin_exists,
    check_cache_init,
    check_cache_set_get,
    check_anilist_details,
    check_anilist_search,
]


async def run_self_tests() -> list[CheckResult]:
    """Ejecuta todos los checks en orden y devuelve la lista de resultados."""
    print("\n=== NakamaGate self-tests ===")
    results: list[CheckResult] = []
    for check in CHECKS:
        try:
            result = await check()
        except Exception as e:
            result = (check.__name__, False, f"excepción: {e}")
        name, ok, detail = result
        mark = "PASS" if ok else "FAIL"
        print(f"[{mark}] {name} — {detail}")
        results.append(result)

    failed = 0
    for _, ok, _ in results:
        if not ok:
            failed += 1
    total = len(results)
    print(f"=== Resumen self-tests: {total - failed}/{total} OK, {failed} fallidos ===\n")
    return results
