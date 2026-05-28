import { BACKEND_URL } from '../config/env';


export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path || path === "null" || path.trim() === "") {
    return null;
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
};
