import time
from typing import Any, Optional

class CacheManager:
    """Gestor de caché en memoria con TTL (Time To Live)"""
    
    def __init__(self):
        self.cache = {}
    
    def set(self, key: str, data: Any, ttl_seconds: int = 3600) -> None:
        """
        Guardar datos en caché con expiración
        
        Args:
            key: Identificador único
            data: Datos a cachear
            ttl_seconds: Tiempo de vida en segundos (default: 1 hora)
        """
        self.cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl_seconds
        }
    
    def get(self, key: str) -> Optional[Any]:
        """
        Obtener datos del caché si aún están válidos
        
        Returns:
            Datos si existen y no han expirado, None en caso contrario
        """
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Verificar si ha expirado
        if time.time() > entry["expires_at"]:
            del self.cache[key]
            return None
        
        return entry["data"]
    
    def delete(self, key: str) -> None:
        """Eliminar una entrada específica del caché"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self) -> None:
        """Limpiar todo el caché"""
        self.cache.clear()
    
    def is_expired(self, key: str) -> bool:
        """Verificar si una clave ha expirado"""
        if key not in self.cache:
            return True
        
        return time.time() > self.cache[key]["expires_at"]


# Instancia global del caché
cache_manager = CacheManager()
