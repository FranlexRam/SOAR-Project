from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    unique_token = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Relación: Un tenant puede tener muchas amenazas
    threats = relationship("Threat", back_populates="tenant")
    # Relación: Un tenant puede tener muchos usuarios
    users = relationship("User", back_populates="tenant")

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
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True) # ForeignKey real
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