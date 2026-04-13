import axios from 'axios';

export const apiClient = axios.create({
  // Asegúrate de que este es el puerto donde corre tu FastAPI
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});