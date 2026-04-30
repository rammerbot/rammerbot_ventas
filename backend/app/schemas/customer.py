from pydantic import BaseModel, Field, validator
import re
from typing import Optional
from app.models.customer import CustomerType

class CustomerBase(BaseModel):
    document_id: str = Field(..., description="RIF o Cédula (Ej: V12345678, J123456789)")
    name: str = Field(..., min_length=2)
    address: str = Field(..., min_length=5, description="Dirección fiscal requerida por SENIAT")
    phone: Optional[str] = None
    email: Optional[str] = None
    customer_type: Optional[CustomerType] = None

    @validator('document_id')
    def validate_document_id(cls, v):
        pattern = r"^[V|E|J|G|P]\d{7,9}$"
        if not re.match(pattern, v.upper()):
            raise ValueError('El documento debe tener un formato válido (Ej: V12345678, J123456789)')
        return v.upper()

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    customer_type: CustomerType

    class Config:
        from_attributes = True
