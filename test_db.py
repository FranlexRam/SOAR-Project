from database import engine

try:
    with engine.connect() as connection:
        print("¡Conexión exitosa a PostgreSQL!")
except Exception as e:
    print(f"Error de conexión: {e}")