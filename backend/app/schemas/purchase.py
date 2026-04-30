from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PurchaseItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float
    discount_amount: float = 0.0
    iva_percentage: float = 16.0

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    purchase_id: int
    iva_amount: float
    subtotal: float

    class Config:
        from_attributes = True

class PurchaseBase(BaseModel):
    invoice_number: str
    supplier_id: int
    global_discount: float = 0.0

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]

class PurchaseResponse(PurchaseBase):
    id: int
    date: datetime
    subtotal: float
    iva_total: float
    discount_total: float
    total_amount: float
    user_id: int
    branch_id: int
    supplier_name: Optional[str] = None
    supplier_rif: Optional[str] = None
    items: List[PurchaseItemResponse]

    class Config:
        from_attributes = True
