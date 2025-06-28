#!/usr/bin/env python3
import requests
import json

def simple_test():
    # 로그인
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = requests.post("http://localhost:8080/api/login", json=login_data)
    print(f"로그인 상태: {response.status_code}")
    
    if response.status_code == 200:
        token = response.json()["token"]
        print(f"토큰 길이: {len(token)}")
        
        # 내 정보 조회
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get("http://localhost:8080/api/me", headers=headers)
        print(f"내 정보 조회: {me_response.status_code}")
        
        if me_response.status_code == 200:
            print("내 정보:", json.dumps(me_response.json(), indent=2, ensure_ascii=False))
        else:
            print("에러:", me_response.text)

if __name__ == "__main__":
    simple_test()
