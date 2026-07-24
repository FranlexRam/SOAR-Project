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
import os
from pathlib import Path
from dotenv import load_dotenv
from security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
import json
# --- IMPORT NUEVO ---
from services.analytics import AnalyticsService
# --- IMPORT IA ---
import google.generativeai as genai

# --- CARGA EXPLÍCITA DEL .ENV DESDE LA RAÍZ DEL PROYECTO ---
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Ya no definimos Blacklist aquí, se importa a través de 'models'
models.Base.metadata.create_all(bind=engine)

# --- CONFIGURACIÓN IA SEGURA ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- DIAGNÓSTICO TEMPORAL DE MODELOS ---
print("--- BUSCANDO MODELOS DISPONIBLES EN TU API KEY ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"-> Modelo compatible encontrado: {m.name}")
except Exception as e:
    print(f"Error al listar modelos (revisa tu GEMINI_API_KEY): {e}")
print("--------------------------------------------------")

# Inicializamos con el modelo verificado
model = genai.GenerativeModel('gemini-3.5-flash')

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
    context = AnalyticsService.get_analytics_context(db, tenant.id)
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
        reputation_score = await threat_intel.check_ip_reputation(report.source_ip)
        if reputation_score > 75:
            final_risk = "CRITICAL"
        
    rule = db.query(models.Rule).filter(
        models.Rule.threat_type == report.threat_type,
        models.Rule.tenant_id == tenant.id,
        models.Rule.is_active == True
    ).first()
    
    action = rule.action if rule else "MANUAL"
    
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

# --- ENDPOINTS ADICIONALES PARA EL MONITOR EN TIEMPO REAL (FASE 4.2) ---

@app.get("/api/threats/active")
def get_active_threats(
    db: Session = Depends(get_db), 
    tenant: models.Tenant = Depends(get_current_tenant)
):
    threats = db.query(models.Threat).filter(
        models.Threat.tenant_id == tenant.id,
        models.Threat.status != "Resolved"
    ).all()
    
    result = []
    for t in threats:
        result.append({
            "type": t.threat_type,
            "detected": t.detected_at.strftime("%Y-%m-%d %H:%M:%S") if t.detected_at else "",
            "sourceIp": t.source_ip,
            "soarAction": t.soar_action or "Pending Action",
            "riskLevel": t.risk_level,
            "status": "Contained" if t.status == "CONTAINED" else "In Analysis",
            "incidentId": f"T-{t.id}",
            "attackVector": t.attack_vector or "Web Endpoint",
            "impact": t.impact or "High"
        })
    return result

@app.post("/api/threats/{incident_str_id}/contain")
def contain_active_threat(
    incident_str_id: str,
    db: Session = Depends(get_db),
    tenant: models.Tenant = Depends(get_current_tenant)
):
    try:
        threat_id = int(incident_str_id.replace("T-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de incidente inválido")
    
    threat = db.query(models.Threat).filter(
        models.Threat.id == threat_id,
        models.Threat.tenant_id == tenant.id
    ).first()
    
    if not threat:
        raise HTTPException(status_code=404, detail="Amenaza no encontrada")
    
    threat.status = "CONTAINED"
    threat.soar_action = "Manual Resolve"
    
    new_log = models.ActionLog(
        tenant_id=tenant.id,
        threat_id=threat.id,
        action_taken="MANUAL_CONTAIN",
        status="SUCCESS"
    )
    db.add(new_log)
    db.commit()
    
    return {"message": f"Incidente {incident_str_id} contenido exitosamente"}

# --- ENDPOINT FORENSE / REPORTE DE IA PERSISTENTE Y PERSONALIZADO POR INCIDENTE (FASE 4.3) ---

@app.get("/api/threats/{incident_str_id}/forensic-report")
def get_or_generate_forensic_report(
    incident_str_id: str,
    db: Session = Depends(get_db),
    tenant: models.Tenant = Depends(get_current_tenant)
):
    try:
        threat_id = int(incident_str_id.replace("T-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de incidente inválido")

    # 1. Buscar la amenaza validando el tenant actual
    threat = db.query(models.Threat).filter(
        models.Threat.id == threat_id,
        models.Threat.tenant_id == tenant.id
    ).first()
    
    if not threat:
        raise HTTPException(status_code=404, detail="Incidente no encontrado en el historial.")

    # 2. CAMBIO CLAVE: Buscar un reporte forense asociado ESPECÍFICAMENTE a este threat_id (incidente único)
    forensic_report = db.query(models.ForensicReport).filter(
        models.ForensicReport.threat_id == threat.id,
        models.ForensicReport.tenant_id == tenant.id
    ).first() if hasattr(models.ForensicReport, 'threat_id') else None

    if not forensic_report:
        # 3. Si no existe para este incidente específico, llamamos a Gemini con los datos particulares de ESTE ataque
        prompt_context = f"""
        Actúa como un analista experto en Ciberseguridad y SOAR. Genera un reporte forense técnico, único y altamente personalizado para este incidente específico:
        - ID de Incidente: T-{threat.id}
        - Tipo de Amenaza: {threat.threat_type}
        - Vector de Ataque: {threat.attack_vector or "Web Endpoint"}
        - IP de Origen: {threat.source_ip}
        - Nivel de Riesgo: {threat.risk_level}
        - Impacto: {threat.impact}
        - Acción SOAR ejecutada: {threat.soar_action}

        Debes retornar estrictamente un objeto JSON válido con exactamente estas llaves y contenidos analíticos únicos para este evento:
        {{
            "danger_analysis": "Un párrafo técnico analizando específicamente por qué este ataque ({threat.threat_type}) desde la IP {threat.source_ip} con riesgo {threat.risk_level} es peligroso para este vector.",
            "operational_risk": "Impacto operacional detallado para este incidente de {threat.threat_type}.",
            "financial_risk": "Impacto financiero estimado por inactividad o brecha de {threat.threat_type}.",
            "reputation_risk": "Impacto en la reputación corporativa por la IP {threat.source_ip}.",
            "compliance_risk": "Afectación a marcos regulatorios y normativas de seguridad.",
            "recommendations": [
                "Recomendación técnica específica 1 orientada a la IP {threat.source_ip}",
                "Recomendación técnica específica 2 para blindar el vector {threat.attack_vector}",
                "Acción correctiva inmediata para el incidente T-{threat.id}"
            ],
            "soar_response": "Detalle técnico de la automatización SOAR aplicada mediante la acción {threat.soar_action} sobre el nodo de origen."
        }}
        """

        try:
            ai_response = model.generate_content(prompt_context)
            raw_text = ai_response.text.strip()
            
            # Limpiar bloques de código markdown si la IA los incluye
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            ai_data = json.loads(raw_text.strip())
        except Exception as e:
            # Fallback robusto en caso de error de parseo de la IA
            ai_data = {
                "danger_analysis": f"Análisis detallado de la brecha por {threat.threat_type} originada desde {threat.source_ip} con nivel {threat.risk_level}.",
                "operational_risk": f"Degradación en la operatividad del servicio debido a {threat.impact}.",
                "financial_risk": "Costes asociados a mitigación de incidentes y análisis de logs.",
                "reputation_risk": "Exposición pública de vulnerabilidades de la aplicación.",
                "compliance_risk": "Incumplimiento temporal de auditorías de seguridad.",
                "recommendations": [
                    f"Desplegar reglas de filtrado específicas contra patrones de {threat.threat_type}.",
                    f"Bloquear permanentemente la dirección IP maliciosa {threat.source_ip}.",
                    "Auditar los componentes afectados por el vector de red."
                ],
                "soar_response": f"Respuesta automatizada ejecutada: {threat.soar_action} sobre {threat.source_ip}."
            }

        identification_info = {
            "type": threat.threat_type,
            "vector": threat.attack_vector or "Web Endpoint",
            "timestamp": threat.detected_at.strftime("%Y-%m-%d %H:%M:%S") if threat.detected_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        potential_risks_info = {
            "operational": ai_data.get("operational_risk", ""),
            "financial": ai_data.get("financial_risk", ""),
            "reputation": ai_data.get("reputation_risk", ""),
            "compliance": ai_data.get("compliance_risk", "")
        }

        # Guardar en la base de datos vinculado de manera única al threat_id de este incidente
        forensic_report_kwargs = {
            "tenant_id": tenant.id,
            "threat_type": threat.threat_type,
            "identification_data": json.dumps(identification_info),
            "danger_analysis": ai_data.get("danger_analysis", ""),
            "potential_risks": json.dumps(potential_risks_info),
            "preventive_recommendations": json.dumps(ai_data.get("recommendations", [])),
            "soar_automated_response": ai_data.get("soar_response", "")
        }
        
        if hasattr(models.ForensicReport, 'threat_id'):
            forensic_report_kwargs["threat_id"] = threat.id

        forensic_report = models.ForensicReport(**forensic_report_kwargs)
        db.add(forensic_report)
        db.commit()
        db.refresh(forensic_report)

    # 4. Retornar el reporte estructurado y personalizado para este incidente
    return {
        "threat_id": threat.id,
        "threat_type": threat.threat_type,
        "identification": json.loads(forensic_report.identification_data),
        "danger_analysis": forensic_report.danger_analysis,
        "potential_risks": json.loads(forensic_report.potential_risks),
        "preventive_recommendations": json.loads(forensic_report.preventive_recommendations),
        "soar_automated_response": forensic_report.soar_automated_response
    }