import httpx
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("ABUSEIPDB_API_KEY")

def is_private_ip(ip: str) -> bool:
    """Valida si una IP pertenece a un rango privado o local para evitar consultas externas innecesarias."""
    if not ip or ip == '127.0.0.1' or ip.startswith('10.') or ip.startswith('192.168.'):
        return True
    if ip.startswith('172.'):
        try:
            second_octet = int(ip.split('.')[1])
            if 16 <= second_octet <= 31:
                return True
        except ValueError:
            pass
    return False

async def check_ip_reputation(ip: str):
    # Si es una IP privada/local, retornamos un puntaje base y un código de país interno/corporativo ('INT')
    if is_private_ip(ip):
        print(f"DEBUG: IP privada/local detectada ({ip}). Omitiendo consulta externa y asignando entorno interno.")
        return 0, "INT"

    print(f"DEBUG: Consultando IP pública {ip} con API_KEY: {API_KEY[:5] if API_KEY else 'NO_KEY'}...")
    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {
        "Key": API_KEY,
        "Accept": "application/json"
    }
    params = {
        "ipAddress": ip,
        "maxAgeInDays": "30"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params)
            print(f"DEBUG: Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()["data"]
                score = data.get("abuseConfidenceScore", 0)
                country_code = data.get("countryCode", "US") # Extraemos el código de país real entregado por AbuseIPDB
                print(f"DEBUG: Score recibido: {score} | País: {country_code}")
                return score, country_code
            return 0, "US"
        except Exception as e:
            print(f"Error consultando AbuseIPDB: {e}")
            return 0, "US"