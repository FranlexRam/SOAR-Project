import csv
from database import SessionLocal
import models
from security import get_password_hash # <-- Añadir import de seguridad

def ingest_data(csv_file_path):
    db = SessionLocal()
    try:
        # 1. Asegurar que exista un Tenant por defecto (ID 1)
        default_tenant = db.query(models.Tenant).filter(models.Tenant.id == 1).first()
        if not default_tenant:
            default_tenant = models.Tenant(id=1, name="Default Tenant", unique_token="TOKEN-12345")
            db.add(default_tenant)
            db.commit()

        # 2. Asegurar que exista tu usuario de prueba por defecto
        default_user = db.query(models.User).filter(models.User.email == "nuevo_usuario_123@test").first()
        if not default_user:
            hashed_pwd = get_password_hash("SecurePassword123!")
            default_user = models.User(email="nuevo_usuario_123@test", hashed_password=hashed_pwd, tenant_id=1)
            db.add(default_user)
            db.commit()

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                tenant_id_val = int(''.join(filter(str.isdigit, row['tenant_id']))) 
                
                threat = models.Threat(
                    tenant_id=tenant_id_val,
                    detected_at=row['detected_at'],
                    country_code=row['country_code'],
                    risk_level=row['risk_level'],
                    attack_vector=row['attack_vector'],
                    threat_type=row['threat_type'],
                    source_ip=row['source_ip'],
                    soar_action=row['soar_action'],
                    status=row['status'],
                    impact=row['impact']
                )
                db.add(threat)
            db.commit()
            print("¡Datos, Tenant y Usuario cargados exitosamente!")
    except Exception as e:
        print(f"Error al cargar datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    db = SessionLocal()
    # Limpiamos todo usando la nueva estructura (borramos en orden inverso para evitar FK)
    db.query(models.User).delete()
    db.query(models.Threat).delete()
    db.query(models.Tenant).delete()
    db.commit()
    db.close()
    
    ingest_data('data.csv')