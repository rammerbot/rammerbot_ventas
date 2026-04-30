from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RammerBot Ventas Backend"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos. Usaremos SQLite para el entorno local por defecto, 
    # pero es fácilmente cambiable a PostgreSQL.
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./rammerbot_local.db"
    
    # JWT Config (para RBAC y auth)
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

settings = Settings()
