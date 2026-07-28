import httpx
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("ABUSEIPDB_API_KEY")

async def check_ip_reputation(ip: str):
    print(f"DEBUG: Consultando IP {ip} con API_KEY: {API_KEY[:5]}...")
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