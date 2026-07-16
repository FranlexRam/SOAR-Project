from sqlalchemy import Column, String, DateTime, Integer, Boolean
from database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    unique_token = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)

class Threat(Base):
    __tablename__ = "threats"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, index=True) # ID del tenant dueño del dato
    threat_type = Column(String)
    detected_at = Column(DateTime)
    source_ip = Column(String)
    country_code = Column(String)
    soar_action = Column(String)
    risk_level = Column(String)
    status = Column(String)
    attack_vector = Column(String)
    impact = Column(String)