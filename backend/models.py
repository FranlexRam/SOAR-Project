from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    unique_token = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    threats = relationship("Threat", back_populates="tenant")
    users = relationship("User", back_populates="tenant")
    rules = relationship("Rule", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    tenant = relationship("Tenant", back_populates="users")

class Threat(Base):
    __tablename__ = "threats"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    threat_type = Column(String)
    detected_at = Column(DateTime)
    source_ip = Column(String)
    country_code = Column(String)
    soar_action = Column(String)
    risk_level = Column(String)
    status = Column(String)
    attack_vector = Column(String)
    impact = Column(String)
    
    tenant = relationship("Tenant", back_populates="threats")
    forensic_reports = relationship("ForensicReport", back_populates="threat", cascade="all, delete-orphan")

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    threat_type = Column(String, index=True) 
    action = Column(String)                   
    is_active = Column(Boolean, default=True)
    
    tenant = relationship("Tenant", back_populates="rules")

class ActionLog(Base):
    __tablename__ = "action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    threat_id = Column(Integer, ForeignKey("threats.id"))
    action_taken = Column(String)
    status = Column(String) 
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class Blacklist(Base):
    __tablename__ = "blacklist"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    ip_address = Column(String, index=True)
    added_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class ForensicReport(Base):
    __tablename__ = "forensic_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True, nullable=True)
    
    # --- CAMBIO CLAVE ---
    # Eliminamos `unique=True` de threat_type para que puedan existir múltiples reportes del mismo tipo.
    # Añadimos `threat_id` con clave foránea y relación inversa con Threat.
    threat_type = Column(String, index=True)
    threat_id = Column(Integer, ForeignKey("threats.id"), index=True, nullable=True)
    
    identification_data = Column(String)
    danger_analysis = Column(String)
    potential_risks = Column(String)
    preventive_recommendations = Column(String)
    soar_automated_response = Column(String)
    
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    threat = relationship("Threat", back_populates="forensic_reports")