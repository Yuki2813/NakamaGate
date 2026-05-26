from sqlmodel import create_engine, Session
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL")

connect_args = {}
ca_path = os.path.join(BASE_DIR, "ca.pem")
if "aivencloud.com" in (DATABASE_URL or "") and os.path.exists(ca_path):
    connect_args = {"ssl": {"ca": ca_path}}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)
def get_db():
    with Session(engine) as session:
        yield session
