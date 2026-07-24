import time
import requests
import random
from datetime import datetime

# URLs de tu API
LOGIN_URL = "http://localhost:8000/login"
API_URL = "http://localhost:8000/threats/report"

# Credenciales de acceso al SOAR
CREDENTIALS = {
    "email": "nuevo_usuario_123@test.com",       # Ajusta tu correo real
    "password": "mi_password_seguro"          # Ajusta tu contraseña real
}

# Catálogo ampliado de vectores de ataque realistas
ATTACK_CATALOG = {
    "1": {
        "threat_type": "SQL_INJECTION",
        "source_ip": "45.33.32.156",
        "risk_level": "HIGH",
        "status": "Contained",
        "attack_vector": "WEB_APP",
        "impact": "CRITICAL",
        "country_code": "VE"
    },
    "2": {
        "threat_type": "XSS_ATTACK",
        "source_ip": "185.220.101.5",
        "risk_level": "MEDIUM",
        "status": "Detected",
        "attack_vector": "WEB_APP",
        "impact": "MEDIUM",
        "country_code": "RU"
    },
    "3": {
        "threat_type": "BRUTE_FORCE",
        "source_ip": "203.0.113.89",
        "risk_level": "CRITICAL",
        "status": "Contained",
        "attack_vector": "AUTH_PORTAL",
        "impact": "High",
        "country_code": "CN"
    },
    "4": {
        "threat_type": "PATH_TRAVERSAL",
        "source_ip": "198.51.100.23",
        "risk_level": "HIGH",
        "status": "In Analysis",
        "attack_vector": "API_ENDPOINT",
        "impact": "High",
        "country_code": "US"
    },
    "5": {
        "threat_type": "COMMAND_INJECTION",
        "source_ip": "103.25.56.12",
        "risk_level": "CRITICAL",
        "status": "Contained",
        "attack_vector": "SHELL_ACCESS",
        "impact": "CRITICAL",
        "country_code": "KP"
    },
    "6": {
        "threat_type": "RANSOMWARE",
        "source_ip": "192.168.10.45",
        "risk_level": "CRITICAL",
        "status": "Contained",
        "attack_vector": "Network",
        "impact": "High",
        "country_code": "DE"
    },
    "7": {
        "threat_type": "CONTROLLED_DDOS",
        "source_ip": "172.16.254.1",
        "risk_level": "CRITICAL",
        "status": "Mitigated",
        "attack_vector": "INFRASTRUCTURE",
        "impact": "CRITICAL",
        "country_code": "RO"
    }
}

def authenticate():
    print("🔑 Autenticando en el motor del SOAR...")
    try:
        response = requests.post(LOGIN_URL, json=CREDENTIALS)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✅ Autenticación exitosa.")
            return {"Authorization": f"Bearer {token}"}
        else:
            print(f"❌ Error en login: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Excepción conectando al servicio de auth: {e}")
        return None

def send_attack(headers, attack_data):
    try:
        # Añadir marca de tiempo dinámica para enriquecer la telemetría
        payload = attack_data.copy()
        response = requests.post(API_URL, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print(f"   [+] Telemetría enviada -> Tipo: {payload['threat_type']} | IP Origen: {payload['source_ip']} | Severidad: {payload['risk_level']}")
            return True
        else:
            print(f"   [!] Error al reportar amenaza: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   [!] Error de red: {e}")
        return False

def interactive_menu():
    headers = authenticate()
    if not headers:
        return

    while True:
        print("\n" + "="*50)
        print("🛡️  SIMULADOR TÁCTICO DE AMENAZAS - SOAR ENGINE")
        print("="*50)
        print(" [1] Inyección SQL (Web App)")
        print(" [2] Cross-Site Scripting - XSS")
        print(" [3] Fuerza Bruta (Auth Portal)")
        print(" [4] Path Traversal")
        print(" [5] Command Injection")
        print(" [6] Ransomware Outbreak")
        print(" [7] DDoS Controlado")
        print(" [8] Ejecutar Lote Completo (Todos los vectores)")
        print(" [9] Cadena de Ataque Multi-Etapa (Attack Chaining simulado)")
        print(" [0] Salir")
        print("-"*50)
        
        choice = input("Selecciona una opción de ataque: ").strip()
        
        if choice == "0":
            print("Saliendo del simulador. ¡Hasta luego!")
            break
            
        elif choice in ATTACK_CATALOG:
            selected = ATTACK_CATALOG[choice]
            print(f"\n🚀 Ejecutando vector individual: {selected['threat_type']}...")
            send_attack(headers, selected)
            print("✨ ¡Ataque inyectado! Revisa los detalles y el timeline en tu dashboard.")
            
        elif choice == "8":
            print("\n🚀 Ejecutando lote completo de ataques de forma secuencial...")
            delay = float(input("Introduce la pausa en segundos entre cada ataque (ej. 2): ") or 2.0)
            for key, attack in ATTACK_CATALOG.items():
                print(f" -> Lote [{key}/7]: Lanzando {attack['threat_type']}")
                send_attack(headers, attack)
                time.sleep(delay)
            print("✨ ¡Lote completo finalizado!")
            
        elif choice == "9":
            print("\n🔄 Iniciando Cadena de Ataque Multi-Etapa (Simulación APT Avanzada)...")
            chain_sequence = ["3", "4", "5", "6"] # Fuerza Bruta -> Path Traversal -> Command Injection -> Ransomware
            delay = float(input("Pausa entre fases de la cadena (ej. 3): ") or 3.0)
            
            for idx, step_key in enumerate(chain_sequence, 1):
                attack = ATTACK_CATALOG[step_key]
                print(f" 🔗 [Fase {idx}/4] Escalamiento de privilegios / Vector: {attack['threat_type']}")
                send_attack(headers, attack)
                time.sleep(delay)
                
            print("✨ ¡Cadena de ataque multi-etapa completada! El motor de correlación debería reflejar una alerta de campaña persistente.")
            
        else:
            print("❌ Opción no válida. Por favor, selecciona un número del catálogo.")

if __name__ == "__main__":
    interactive_menu()