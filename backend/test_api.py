#!/usr/bin/env python3
"""
백엔드 API 테스트 스크립트
"""
import requests
import json
import base64
from PIL import Image
import io

BASE_URL = "http://localhost:8080/api"

def test_signup():
    """회원가입 테스트"""
    print("🧪 회원가입 테스트")
    
    # 멘토 회원가입
    mentor_data = {
        "email": "mentor@test.com",
        "password": "password123",
        "name": "김멘토",
        "role": "mentor"
    }
    
    response = requests.post(f"{BASE_URL}/signup", json=mentor_data)
    print(f"멘토 회원가입: {response.status_code} - {response.text}")
    
    # 멘티 회원가입
    mentee_data = {
        "email": "mentee@test.com",
        "password": "password123",
        "name": "이멘티",
        "role": "mentee"
    }
    
    response = requests.post(f"{BASE_URL}/signup", json=mentee_data)
    print(f"멘티 회원가입: {response.status_code} - {response.text}")

def test_login():
    """로그인 테스트"""
    print("\n🧪 로그인 테스트")
    
    # 멘토 로그인
    mentor_login = {
        "email": "mentor@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/login", json=mentor_login)
    print(f"멘토 로그인: {response.status_code}")
    
    if response.status_code == 200:
        mentor_token = response.json()["token"]
        print(f"멘토 토큰 획득: {mentor_token[:50]}...")
        return mentor_token
    
    return None

def test_profile_update(token):
    """프로필 업데이트 테스트"""
    print("\n🧪 프로필 업데이트 테스트")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 더미 이미지 생성 (500x500 JPEG)
    img = Image.new('RGB', (500, 500), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_data = img_buffer.getvalue()
    img_base64 = base64.b64encode(img_data).decode()
    
    profile_data = {
        "name": "김멘토 업데이트",
        "bio": "FastAPI 멘토입니다",
        "image": img_base64,
        "skills": ["FastAPI", "Python", "React"]
    }
    
    response = requests.put(f"{BASE_URL}/profile", json=profile_data, headers=headers)
    print(f"프로필 업데이트: {response.status_code} - {response.text[:200]}...")

def test_me_endpoint(token):
    """내 정보 조회 테스트"""
    print("\n🧪 내 정보 조회 테스트")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    print(f"내 정보 조회: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"사용자 정보: {json.dumps(data, indent=2, ensure_ascii=False)}")

def test_mentors_endpoint():
    """멘토 목록 조회 테스트 (멘티로)"""
    print("\n🧪 멘토 목록 조회 테스트")
    
    # 멘티 로그인
    mentee_login = {
        "email": "mentee@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/login", json=mentee_login)
    if response.status_code == 200:
        mentee_token = response.json()["token"]
        headers = {"Authorization": f"Bearer {mentee_token}"}
        
        # 멘토 목록 조회
        response = requests.get(f"{BASE_URL}/mentors", headers=headers)
        print(f"멘토 목록 조회: {response.status_code}")
        
        if response.status_code == 200:
            mentors = response.json()
            print(f"멘토 수: {len(mentors)}")
            for mentor in mentors:
                print(f"멘토: {mentor['profile']['name']} - {mentor['profile'].get('skills', [])}")

def main():
    print("🚀 백엔드 API 테스트 시작")
    
    # 회원가입 테스트
    test_signup()
    
    # 로그인 테스트
    mentor_token = test_login()
    
    if mentor_token:
        # 프로필 업데이트 테스트
        test_profile_update(mentor_token)
        
        # 내 정보 조회 테스트
        test_me_endpoint(mentor_token)
    
    # 멘토 목록 조회 테스트
    test_mentors_endpoint()
    
    print("\n✅ 백엔드 API 테스트 완료")

if __name__ == "__main__":
    main()
