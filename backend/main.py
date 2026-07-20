from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from jose import jwt
from database import SessionLocal, engine
import models
import threat_intel 
import os # Import necesario para variables de entorno
from dotenv import load_dotenv # Import necesario para cargar .env
from security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
# --- IMPORT NUEVO ---
from services.analytics import AnalyticsService
# --- IMPORT IA ---
import google.generativeai as genai

# Carga las variables desde el archivo .env
load_dotenv()

# Ya no definimos Blacklist aquí, se importa a través de 'models'
models.Base.metadata.create_all(bind=engine)

# --- CONFIGURACIÓN IA SEGURA ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# --- SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str
    tenant_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class RuleCreate(BaseModel):
    threat_type: str
    action: str
    is_active: bool = True

class ThreatReport(BaseModel):
    threat_type: str
    source_ip: str
    country_code: str
    risk_level: str
    attack_vector: str
    impact: str

app = FastAPI()

security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None: raise HTTPException(status_code=403, detail="Token inválido")
    except Exception:
        raise HTTPException(status_code=403, detail="Token inválido o expirado")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user: raise HTTPException(status_code=403, detail="Usuario no encontrado")
    return user

def get_current_tenant(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant_token = payload.get("tenant_token")
    except Exception:
        raise HTTPException(status_code=403, detail="Token inválido")
        
    tenant = db.query(models.Tenant).filter(models.Tenant.unique_token == tenant_token, models.Tenant.is_active == True).first()
    if not tenant: raise HTTPException(status_code=403, detail="Tenant no encontrado")
    return tenant

# --- AUTH & STATS ENDPOINTS ---
@app.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    new_tenant = models.Tenant(name=user_data.tenant_name, unique_token=f"TOKEN-{user_data.email}")
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_pwd, tenant_id=new_tenant.id)
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

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    total = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).count()
    critical = db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id, models.Threat.risk_level == "CRITICAL").count()
    return {"total": total, "critical": critical, "active_response": "Automated"}        

@app.get("/threats")
def get_threats(db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    return db.query(models.Threat).filter(models.Threat.tenant_id == tenant.id).all()

# --- ENDPOINTS FASE 3 (Analytics & IA) ---
@app.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db), 
    tenant: models.Tenant = Depends(get_current_tenant)
):
    trends = AnalyticsService.get_tenant_threat_trends(db, tenant.id)
    success_rate = AnalyticsService.get_action_success_rate(db, tenant.id)
    return {
        "trends": trends,
        "success_rate": success_rate
    }

@app.post("/analytics/generate-report")
def generate_report(
    db: Session = Depends(get_db),
    tenant: models.Tenant = Depends(get_current_tenant)
):
    # Obtenemos el contexto preparado por el servicio
    context = AnalyticsService.get_analytics_context(db, tenant.id)
    
    # Solicitud a Gemini
    response = model.generate_content(context)
    
    return {"reporte": response.text}

# --- ENDPOINTS FASE 2 & INTEL ---
@app.post("/rules", status_code=201)
def create_rule(rule: RuleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_rule = models.Rule(tenant_id=current_user.tenant_id, threat_type=rule.threat_type, action=rule.action, is_active=rule.is_active)
    db.add(db_rule)
    db.commit()
    return db_rule

@app.post("/threats/report", status_code=201)
async def report_threat(report: ThreatReport, db: Session = Depends(get_db), tenant: models.Tenant = Depends(get_current_tenant)):
    # 1. VERIFICACIÓN DE LISTA NEGRA LOCAL
    is_blacklisted = db.query(models.Blacklist).filter(
        models.Blacklist.ip_address == report.source_ip,
        models.Blacklist.tenant_id == tenant.id
    ).first()
    
    final_risk = report.risk_level
    reputation_score = 0
    
    if is_blacklisted:
        final_risk = "CRITICAL"
        reputation_score = 100 
    else:
        # 2. ENRIQUECIMIENTO (Solo si no está en lista negra)
        reputation_score = await threat_intel.check_ip_reputation(report.source_ip)
        if reputation_score > 75:
            final_risk = "CRITICAL"
        
    # 3. ORQUESTADOR: Buscar regla
    rule = db.query(models.Rule).filter(
        models.Rule.threat_type == report.threat_type,
        models.Rule.tenant_id == tenant.id,
        models.Rule.is_active == True
    ).first()
    
    action = rule.action if rule else "MANUAL"
    
    # 4. Guardar amenaza
    new_threat = models.Threat(
        tenant_id=tenant.id,
        threat_type=report.threat_type,
        detected_at=datetime.utcnow(),
        source_ip=report.source_ip,
        country_code=report.country_code,
        soar_action=action,
        risk_level=final_risk,
        status="DETECTED",
        attack_vector=report.attack_vector,
        impact=report.impact
    )
    db.add(new_threat)
    db.commit()
    db.refresh(new_threat)
    
    # 5. REGISTRAR LOG
    new_log = models.ActionLog(
        tenant_id=tenant.id,
        threat_id=new_threat.id,
        action_taken=action,
        status="SUCCESS"
    )
    db.add(new_log)
    db.commit()
    
    return {
        "message": "Amenaza procesada, enriquecida/bloqueada y log registrada", 
        "soar_action_taken": action, 
        "intel_score": reputation_score,
        "source": "BLACKLIST_LOCAL" if is_blacklisted else "ABUSEIPDB_API"
    }