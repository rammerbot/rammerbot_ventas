from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.branch import Branch
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierResponse

router = APIRouter()

@router.get("/", response_model=List[SupplierResponse])
def read_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    suppliers = db.query(Supplier).filter(Supplier.branch_id == current_branch.id).offset(skip).limit(limit).all()
    return suppliers

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier_in: SupplierCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Check if rif already exists in THIS branch
    existing = db.query(Supplier).filter(
        Supplier.rif == supplier_in.rif,
        Supplier.branch_id == current_branch.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="El proveedor con este RIF ya existe en esta sucursal")
    
    supplier = Supplier(
        **supplier_in.dict(),
        branch_id=current_branch.id
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int, 
    supplier_in: SupplierCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.branch_id == current_branch.id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    for field, value in supplier_in.dict().items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.branch_id == current_branch.id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    db.delete(supplier)
    db.commit()
    return {"ok": True}
