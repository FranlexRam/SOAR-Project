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

# Dependencia para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- NUEVA LÓGICA MULTI-TENANT ---
def get_current_tenant(token: str = Header(...), db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.unique_token == token, models.Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=403, detail="Token inválido o tenant inactivo")
    return tenant

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    # Contamos amenazas FILTRADAS por el ID del tenant validado
    total = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).count()
    critical = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id, models.Threat.risk_level == "CRITICAL").count()
    
    return {
        "total": total,
        "critical": critical,
        "active_response": "Automated"
    }        

@app.get("/threats")
def get_threats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    # Traemos solo las amenazas del tenant validado
    return db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).all()