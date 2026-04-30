from typing import Generator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.branch import Branch
from app.schemas.user import UserResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_branch(request: Request, db: Session = Depends(get_db)) -> Branch:
    # 1. Intentar obtener el subdominio del header personalizado (para desarrollo frontend)
    # 2. Si no, obtener del host
    subdomain_header = request.headers.get("X-Branch-Subdomain")
    
    if subdomain_header:
        subdomain = subdomain_header
    else:
        # Extraer subdominio del host (ej: sucursal1.localhost -> sucursal1)
        host = request.headers.get("host", "")
        parts = host.split(".")
        if len(parts) > 1 and parts[0] != "localhost" and parts[0] != "127":
            subdomain = parts[0]
        else:
            # Fallback para pruebas locales si no se envía nada (por defecto sucursal1)
            subdomain = "sucursal1"
            
    branch = db.query(Branch).filter(Branch.subdomain == subdomain).first()
    if not branch:
        raise HTTPException(status_code=404, detail=f"Sucursal '{subdomain}' no encontrada")
    if not branch.is_active:
        raise HTTPException(status_code=400, detail="Esta sucursal está inactiva")
    return branch

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se pudo validar las credenciales",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != RoleEnum.ADMINISTRADOR:
        raise HTTPException(
            status_code=403, detail="El usuario no tiene suficientes privilegios"
        )
    return current_user
