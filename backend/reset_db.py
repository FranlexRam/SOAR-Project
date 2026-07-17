from database import engine
import models

# Borra todas las tablas y las vuelve a crear vacías
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)
print("¡Base de datos limpia y reiniciada!")