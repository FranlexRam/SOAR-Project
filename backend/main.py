from pydantic import BaseModel
from security import get_password_hash 
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Crear las tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESTRUCTURAS DE DATOS (SCHEMAS) ---
class UserCreate(BaseModel):
    email: str
    password: str
    tenant_name: str

# Dependencia para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINT DE REGISTRO ---
@app.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Crear el nuevo Tenant
    new_tenant = models.Tenant(name=user_data.tenant_name, unique_token=f"TOKEN-{user_data.email}")
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    # 2. Crear el Usuario con la contraseña cifrada
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email, 
        hashed_password=hashed_pwd, 
        tenant_id=new_tenant.id
    )
    db.add(new_user)
    db.commit()
    
    return {"message": "Usuario y Tenant creados exitosamente"}

# --- LÓGICA MULTI-TENANT ---
def get_current_tenant(token: str = Header(...), db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.unique_token == token, models.Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=403, detail="Token inválido o tenant inactivo")
    return tenant

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    total = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).count()
    critical = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id, models.Threat.risk_level == "CRITICAL").count()
    
    return {
        "total": total,
        "critical": critical,
        "active_response": "Automated"
    }        

@app.get("/threats")
def get_threats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    return db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).all()