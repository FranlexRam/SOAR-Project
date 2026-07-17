from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt
from database import SessionLocal, engine
import models
from security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

# Crear las tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de seguridad para el header Authorization: Bearer <token>
security = HTTPBearer()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str
    tenant_name: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AUTH ENDPOINTS ---
@app.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    new_tenant = models.Tenant(name=user_data.tenant_name, unique_token=f"TOKEN-{user_data.email}")
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email, 
        hashed_password=hashed_pwd, 
        tenant_id=new_tenant.id
    )
    db.add(new_user)
    db.commit()
    return {"message": "Usuario y Tenant creados exitosamente"}

@app.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    tenant = db.query(models.Tenant).filter(models.Tenant.id == user.tenant_id).first()
    access_token = create_access_token(data={"sub": user.email, "tenant_token": tenant.unique_token})
    return {"access_token": access_token, "token_type": "bearer"}

# --- LÓGICA MULTI-TENANT CON JWT ---
def get_current_tenant(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        # Decodificamos el JWT para obtener el 'tenant_token' incrustado
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant_token = payload.get("tenant_token")
        if tenant_token is None:
            raise HTTPException(status_code=403, detail="Token sin información de tenant")
    except Exception:
        raise HTTPException(status_code=403, detail="Token inválido o expirado")
        
    tenant = db.query(models.Tenant).filter(models.Tenant.unique_token == tenant_token, models.Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=403, detail="Tenant no encontrado o inactivo")
    return tenant

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    total = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).count()
    critical = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id, models.Threat.risk_level == "CRITICAL").count()
    return {"total": total, "critical": critical, "active_response": "Automated"}        

@app.get("/threats")
def get_threats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    return db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).all()