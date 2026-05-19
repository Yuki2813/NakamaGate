from sqlmodel import create_engine, Session
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL")

# SSL solo contra Aiven. MySQL local en docker no usa TLS.
connect_args: dict = {}
if "aivencloud.com" in (DATABASE_URL or ""):
    connect_args = {"ssl": {"ca": os.path.join(BASE_DIR, "ca.pem")}}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)
def get_db():
    with Session(engine) as session:
        yield session