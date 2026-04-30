from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from app.core.database import get_db
from app.core import security
from app.api import deps
from app.models.user import User, RoleEnum
from app.models.branch import Branch
from app.models.invoice import FiscalSettings
from app.schemas.branch import BranchCreate, BranchResponse
from app.schemas.user import UserCreate, UserResponse as UserSchema
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def superadmin_login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Search user globally
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de SuperAdmin")
    
    access_token = security.create_access_token(
        subject=user.id, 
        extra_data={"role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/branches", response_model=BranchResponse)
def create_branch(
    branch_in: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_branch = Branch(**branch_in.dict())
    db.add(db_branch)
    db.flush()
    
    # Auto-create initial fiscal settings for the branch
    fiscal = FiscalSettings(
        branch_id=db_branch.id,
        next_invoice_number=1,
        next_control_number=1,
        usd_rate=1.0
    )
    db.add(fiscal)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.post("/users", response_model=UserSchema)
def create_user_for_branch(
    user_in: UserCreate,
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    # Check if username already exists globally
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    db_user = User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        role=user_in.role,
        branch_id=branch_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/branches/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: int,
    branch_in: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    for field, value in branch_in.dict().items():
        setattr(db_branch, field, value)
    
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/branches/{branch_id}")
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    db.delete(db_branch)
    db.commit()
    return {"message": "Sucursal eliminada exitosamente"}

@router.get("/branches/{branch_id}/users", response_model=List[UserSchema])
def list_branch_users(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    return db.query(User).filter(User.branch_id == branch_id).all()

@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Check username unique if changed
    if user_in.username != db_user.username:
        existing = db.query(User).filter(User.username == user_in.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Nombre de usuario ya en uso")
        db_user.username = user_in.username
    
    if user_in.password:
        db_user.hashed_password = security.get_password_hash(user_in.password)
    
    db_user.role = user_in.role
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}

@router.get("/branches", response_model=List[BranchResponse])
def list_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if str(current_user.role) != RoleEnum.SUPERADMIN.value and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Permiso denegado")
    return db.query(Branch).all()
