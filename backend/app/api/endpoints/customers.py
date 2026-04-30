from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.branch import Branch
from app.models.customer import Customer, CustomerType
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def read_customers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    customers = db.query(Customer).filter(Customer.branch_id == current_branch.id).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Check if document_id already exists in THIS branch
    existing_customer = db.query(Customer).filter(
        Customer.document_id == customer_in.document_id,
        Customer.branch_id == current_branch.id
    ).first()
    
    if existing_customer:
        raise HTTPException(status_code=400, detail="El cliente con este documento ya existe en esta sucursal")
    
    # Infer customer_type if not provided
    c_type = customer_in.customer_type
    if not c_type:
        first_letter = customer_in.document_id[0].upper()
        if first_letter in ['J', 'G', 'P']:
            c_type = CustomerType.JURIDICA
        else:
            c_type = CustomerType.NATURAL

    customer = Customer(
        customer_type=c_type,
        document_id=customer_in.document_id,
        name=customer_in.name,
        address=customer_in.address,
        phone=customer_in.phone,
        email=customer_in.email,
        branch_id=current_branch.id
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerResponse)
def read_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.branch_id == current_branch.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en esta sucursal")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int, 
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.branch_id == current_branch.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en esta sucursal")
    
    # Check if new document_id already exists for another customer in this branch
    if customer.document_id != customer_in.document_id:
        existing_customer = db.query(Customer).filter(
            Customer.document_id == customer_in.document_id,
            Customer.branch_id == current_branch.id
        ).first()
        if existing_customer:
            raise HTTPException(status_code=400, detail="El cliente con este documento ya existe en esta sucursal")

    # Update fields
    customer.document_id = customer_in.document_id
    customer.name = customer_in.name
    customer.address = customer_in.address
    customer.phone = customer_in.phone
    customer.email = customer_in.email

    if customer_in.customer_type:
        customer.customer_type = customer_in.customer_type
    else:
        first_letter = customer_in.document_id[0].upper()
        if first_letter in ['J', 'G', 'P']:
            customer.customer_type = CustomerType.JURIDICA
        else:
            customer.customer_type = CustomerType.NATURAL

    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Only Admin can delete
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_str != "ADMINISTRADOR":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar clientes")

    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.branch_id == current_branch.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en esta sucursal")
    
    db.delete(customer)
    db.commit()
    return {"ok": True}
