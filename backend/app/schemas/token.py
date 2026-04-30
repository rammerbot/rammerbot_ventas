from pydantic import BaseModel
from typing import Optional
from app.models.user import RoleEnum

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
