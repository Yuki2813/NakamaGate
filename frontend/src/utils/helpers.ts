import { BACKEND_URL } from '../config/env';

/**
 * Recibe un path de imagen de la base de datos y lo convierte en una URL absoluta.
 * Si la imagen ya es un enlace completo (http...), lo devuelve tal cual.
 */
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path || path === "null" || path.trim() === "") return null;
  return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
};