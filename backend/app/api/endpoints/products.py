from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User, RoleEnum
from app.models.branch import Branch
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    products = db.query(Product).filter(Product.branch_id == current_branch.id).offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Check if code already exists in THIS branch
    existing = db.query(Product).filter(
        Product.code == product_in.code,
        Product.branch_id == current_branch.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="El código de producto ya existe en esta sucursal")
    
    product = Product(
        **product_in.dict(),
        branch_id=current_branch.id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product_in: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Restriction: Only Admin can edit
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_str != "ADMINISTRADOR":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden editar productos")

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.branch_id == current_branch.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    for field, value in product_in.dict().items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Restriction: Only Admin can delete
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_str != "ADMINISTRADOR":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar productos")

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.branch_id == current_branch.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Restriction: Stock must be 0
    if product.stock != 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar un producto con existencia en inventario")
    
    db.delete(product)
    db.commit()
    return {"ok": True}
