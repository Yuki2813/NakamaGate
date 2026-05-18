import { BACKEND_URL } from '../config/env';

// Devuelve la URL final de una imagen: si ya es absoluta la deja igual,
// si es relativa le pone delante BACKEND_URL. Valores vacíos o "null"
// devuelven null para que el componente decida pintar un placeholder.
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path || path === "null" || path.trim() === "") return null;
  return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
};
