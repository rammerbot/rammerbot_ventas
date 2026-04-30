from pydantic import BaseModel, Field
from app.models.user import RoleEnum
from typing import Optional

class UserBase(BaseModel):
    username: str
    role: RoleEnum = RoleEnum.VENDEDOR
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
