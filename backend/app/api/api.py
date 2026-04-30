from fastapi import APIRouter
from app.api.endpoints import customers, auth, suppliers, products, purchases, invoices, reports, superadmin, dashboard

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["superadmin"])
