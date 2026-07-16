from database import engine, Base
import models

# Esto borra todas las tablas que existen en tu base de datos
print("Borrando tablas antiguas...")
models.Base.metadata.drop_all(bind=engine)
print("Tablas borradas con éxito.")