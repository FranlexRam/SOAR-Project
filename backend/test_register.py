import requests

# URL de tu API
url = "http://127.0.0.1:8000/register"

# Datos de prueba
payload = {
    "email": "nuevo_usuario_123@test.com",
    "password": "mi_password_seguro",
    "tenant_name": "Empresa de Prueba"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Respuesta: {response.json()}")
except Exception as e:
    print(f"Error al conectar con el servidor: {e}")