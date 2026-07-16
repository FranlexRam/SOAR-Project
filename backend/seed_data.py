import csv
from database import SessionLocal
import models

def ingest_data(csv_file_path):
    db = SessionLocal()
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Nota: Si tu CSV tiene 'C-001', esto tomará el número 1. 
                # Si tienes varios tenants, ajustaremos esto pronto.
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
            print("¡Datos cargados exitosamente desde el CSV!")
    except Exception as e:
        print(f"Error al cargar datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    db = SessionLocal()
    # Limpiamos usando la nueva estructura
    db.query(models.Threat).delete()
    db.commit()
    db.close()
    
    ingest_data('data.csv')