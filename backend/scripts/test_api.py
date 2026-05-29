import requests
import json

API = "http://localhost:8000/api/v1"

# Test 1: Root
print("=== Test Root ===")
r = requests.get("http://localhost:8000/")
print(r.json())

# Test 2: Get terms
print("\n=== Test Get Terms ===")
r = requests.get(f"{API}/terms/?limit=3")
for t in r.json():
    print(f"  RU: {t['ru']}  |  KZ: {t['kz']}")

# Test 3: Search terms
print("\n=== Test Search ===")
r = requests.get(f"{API}/terms/?search=витамин&limit=5")
for t in r.json():
    print(f"  RU: {t['ru']}  |  KZ: {t['kz']}")

# Test 4: Check text
print("\n=== Test Check Text ===")
r = requests.post(f"{API}/check/text", json={
    "text": "абсорбция витамины аптека",
    "language": "ru"
})
data = r.json()
print(f"Stats: {data['stats']}")
for item in data['results']:
    if item['status'] != 'neutral':
        print(f"  [{item['status'].upper()}] '{item['word']}' -> suggestion: {item.get('suggestion')}")

# Test 5: Register user
print("\n=== Test Register ===")
r = requests.post(f"{API}/auth/register", json={
    "email": "test@example.com",
    "password": "password123",
    "role": "admin"
})
print(r.status_code, r.json())

# Test 6: Login
print("\n=== Test Login ===")
r = requests.post(f"{API}/auth/login", data={
    "username": "test@example.com",
    "password": "password123"
})
token_data = r.json()
print(r.status_code, token_data)

# Test 7: Get Me
if r.status_code == 200:
    print("\n=== Test Me ===")
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    r = requests.get(f"{API}/auth/me", headers=headers)
    print(r.status_code, r.json())

print("\n✅ All tests passed!")
