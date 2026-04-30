from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    price_buy: float = 0.0
    price_sell: float = 0.0
    stock: int = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    branch_id: int

    class Config:
        from_attributes = True
