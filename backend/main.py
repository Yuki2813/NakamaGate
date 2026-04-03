from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Asegúrate de que la carpeta existe antes de montarla
os.makedirs("static/profile_pics", exist_ok=True)

# Esto permite a FastAPI mostrar los archivos de la carpeta "static" en la URL "/static"
app.mount("/static", StaticFiles(directory="static"), name="static")