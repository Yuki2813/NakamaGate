import ssl

from sqlmodel import create_engine, Session
from dotenv import load_dotenv
import os
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Ruta absoluta al ca.pem relativa a este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CA_CERT = os.path.join(BASE_DIR, "ca.pem")

# Verifica que lo encuentra
print(f"Buscando CA en: {CA_CERT}")
print(f"Existe: {os.path.exists(CA_CERT)}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        "ssl": {
            "ca": os.path.join(os.path.dirname(__file__), "ca.pem")
        }
    }
)
def get_db():
    with Session(engine) as session:
        yield session