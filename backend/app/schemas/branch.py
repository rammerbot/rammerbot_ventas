from pydantic import BaseModel
from typing import Optional

class BranchBase(BaseModel):
    name: str
    subdomain: str
    rif: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    fiscal_message: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
