#!/usr/bin/env python3
import requests
import json
from jose import jwt

def debug_jwt():
    print("🔍 JWT 토큰 디버깅")
    
    # 로그인
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = requests.post("http://localhost:8080/api/login", json=login_data)
    print(f"로그인 상태 코드: {response.status_code}")
    
    if response.status_code == 200:
        token = response.json()["token"]
        print(f"토큰: {token}")
        
        # JWT 토큰 디코딩 (검증 없이)
        try:
            decoded = jwt.get_unverified_claims(token)
            print(f"JWT 클레임: {json.dumps(decoded, indent=2, default=str)}")
        except Exception as e:
            print(f"JWT 디코딩 에러: {e}")
        
        # API 요청
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get("http://localhost:8080/api/me", headers=headers)
        print(f"내 정보 조회 상태 코드: {me_response.status_code}")
        print(f"응답: {me_response.text}")

if __name__ == "__main__":
    debug_jwt()
