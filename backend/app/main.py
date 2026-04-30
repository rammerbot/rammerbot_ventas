from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine

# Crear las tablas en SQLite local (para el prototipo inicial)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend para POS adaptado a SENIAT",
    version="1.0.0"
)

# Configuración de CORS para permitir conexiones desde cualquier máquina en la red local (LAN)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar a las IPs específicas permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "RammerBot Ventas API is running (SENIAT Compliant)"}

from app.api.api import api_router

# Include routers here
app.include_router(api_router, prefix="/api/v1")
