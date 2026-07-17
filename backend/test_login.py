import requests

# Ajusta el email que usaste para registrarte anteriormente
payload = {"email": "nuevo_usuario_123@test.com", "password": "mi_password_seguro"}
response = requests.post("http://127.0.0.1:8000/login", json=payload)

print(f"Status: {response.status_code}")
print(f"Respuesta: {response.json()}")