from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from app.core.database import Base
import enum

class RoleEnum(str, enum.Enum):
    VENDEDOR = "VENDEDOR"
    ADMINISTRADOR = "ADMINISTRADOR"
    AUDITOR = "AUDITOR"
    SUPERVISOR = "SUPERVISOR"
    SUPERADMIN = "SUPERADMIN" # Global management

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.VENDEDOR, nullable=False)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # Null for SuperAdmin
