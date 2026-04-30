from pydantic import BaseModel
from typing import Optional

class SupplierBase(BaseModel):
    rif: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    branch_id: int

    class Config:
        from_attributes = True
