import { BACKEND_URL } from '../config/env';

// Devuelve la URL final de una imagen; prepende BACKEND_URL si es relativa.
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path || path === "null" || path.trim() === "") {
    return null;
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
};
