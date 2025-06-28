#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
임의의 멘토와 멘티 사용자를 생성하여 테스트 데이터를 삽입합니다.
"""

import os
import sys
import json
import requests
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Base, User, MatchRequest

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 데이터베이스 설정
SQLALCHEMY_DATABASE_URL = "sqlite:///./mentor_mentee.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def hash_password(password: str) -> str:
    """비밀번호를 해시화합니다."""
    return pwd_context.hash(password)

def get_default_image_data(role: str) -> bytes:
    """기본 프로필 이미지를 다운로드하여 바이너리 데이터로 반환합니다."""
    try:
        if role == "mentor":
            url = "https://placehold.co/500x500.jpg?text=MENTOR"
        else:
            url = "https://placehold.co/500x500.jpg?text=MENTEE"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.content
        else:
            print(f"Warning: 기본 이미지 다운로드 실패 ({response.status_code})")
            return None
    except Exception as e:
        print(f"Warning: 기본 이미지 다운로드 중 오류 발생: {e}")
        return None

def create_sample_users():
    """샘플 사용자 데이터를 생성합니다."""
    
    print("=== 데이터베이스 초기화 시작 ===")
    
    # 데이터베이스 테이블 생성
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 기존 데이터 삭제
        print("기존 데이터 삭제 중...")
        db.query(MatchRequest).delete()
        db.query(User).delete()
        db.commit()
        
        print("기본 프로필 이미지 다운로드 중...")
        mentor_image = get_default_image_data("mentor")
        mentee_image = get_default_image_data("mentee")
        
        # 멘토 사용자들 생성
        mentors = [
            {
                "email": "mentor1@example.com",
                "password": "password123",
                "name": "김프론트",
                "role": "mentor",
                "bio": "프론트엔드 개발 전문 멘토입니다. React, Vue.js, Angular 등 모던 프론트엔드 기술에 대한 풍부한 경험을 가지고 있습니다.",
                "skills": ["React", "Vue.js", "TypeScript", "JavaScript", "HTML/CSS"]
            },
            {
                "email": "mentor2@example.com",
                "password": "password123",
                "name": "이백엔드",
                "role": "mentor",
                "bio": "백엔드 개발 및 클라우드 아키텍처 전문가입니다. Spring Boot, FastAPI, AWS 등의 기술로 확장 가능한 시스템을 구축해왔습니다.",
                "skills": ["Spring Boot", "FastAPI", "Python", "Java", "AWS", "Docker"]
            },
            {
                "email": "mentor3@example.com",
                "password": "password123",
                "name": "박풀스택",
                "role": "mentor",
                "bio": "풀스택 개발자로서 프론트엔드부터 백엔드, 데브옵스까지 전 영역에 대한 멘토링을 제공합니다.",
                "skills": ["React", "Node.js", "MongoDB", "Express", "Next.js", "GraphQL"]
            },
            {
                "email": "mentor4@example.com",
                "password": "password123",
                "name": "정데이터",
                "role": "mentor",
                "bio": "데이터 사이언스 및 머신러닝 전문가입니다. Python, R, TensorFlow를 활용한 실전 프로젝트 경험을 공유합니다.",
                "skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Data Analysis", "SQL"]
            },
            {
                "email": "mentor5@example.com",
                "password": "password123",
                "name": "최모바일",
                "role": "mentor",
                "bio": "iOS/Android 모바일 앱 개발 전문가입니다. React Native, Flutter, Swift, Kotlin으로 크로스플랫폼 및 네이티브 앱 개발을 멘토링합니다.",
                "skills": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"]
            }
        ]
        
        # 멘티 사용자들 생성
        mentees = [
            {
                "email": "mentee1@example.com",
                "password": "password123",
                "name": "김학습",
                "role": "mentee",
                "bio": "프론트엔드 개발을 배우고 있는 초보 개발자입니다. React를 집중적으로 학습하고 싶습니다."
            },
            {
                "email": "mentee2@example.com",
                "password": "password123",
                "name": "이성장",
                "role": "mentee",
                "bio": "컴퓨터공학을 전공하고 있는 대학생입니다. 백엔드 개발에 관심이 많습니다."
            },
            {
                "email": "mentee3@example.com",
                "password": "password123",
                "name": "박취업",
                "role": "mentee",
                "bio": "개발자로 취업을 준비하는 부트캠프 수강생입니다. 풀스택 개발 역량을 키우고 싶습니다."
            },
            {
                "email": "mentee4@example.com",
                "password": "password123",
                "name": "정커리어",
                "role": "mentee",
                "bio": "비전공자에서 개발자로 전향하려고 합니다. 데이터 분야에 특히 관심이 있습니다."
            },
            {
                "email": "mentee5@example.com",
                "password": "password123",
                "name": "최앱개발",
                "role": "mentee",
                "bio": "스타트업에서 앱 개발을 담당하고 있습니다. 모바일 앱 개발 실력을 향상시키고 싶습니다."
            },
            {
                "email": "mentee6@example.com",
                "password": "password123",
                "name": "한신입",
                "role": "mentee",
                "bio": "신입 개발자로 입사한지 6개월 되었습니다. 실무 경험을 쌓고 싶습니다."
            }
        ]
        
        print("멘토 사용자 생성 중...")
        created_mentors = []
        for mentor_data in mentors:
            mentor = User(
                email=mentor_data["email"],
                password_hash=hash_password(mentor_data["password"]),
                name=mentor_data["name"],
                role=mentor_data["role"],
                bio=mentor_data["bio"],
                image_data=mentor_image,
                skills=json.dumps(mentor_data["skills"], ensure_ascii=False),
                created_at=datetime.utcnow()
            )
            db.add(mentor)
            created_mentors.append(mentor)
        
        print("멘티 사용자 생성 중...")
        created_mentees = []
        for mentee_data in mentees:
            mentee = User(
                email=mentee_data["email"],
                password_hash=hash_password(mentee_data["password"]),
                name=mentee_data["name"],
                role=mentee_data["role"],
                bio=mentee_data["bio"],
                image_data=mentee_image,
                skills=None,
                created_at=datetime.utcnow()
            )
            db.add(mentee)
            created_mentees.append(mentee)
        
        # 사용자 데이터 커밋
        db.commit()
        
        # ID 새로고침
        for mentor in created_mentors:
            db.refresh(mentor)
        for mentee in created_mentees:
            db.refresh(mentee)
        
        print("샘플 매칭 요청 생성 중...")
        # 샘플 매칭 요청들 생성
        sample_requests = [
            {
                "mentor_id": created_mentors[0].id,  # 김프론트
                "mentee_id": created_mentees[0].id,  # 김학습
                "message": "React 개발을 배우고 싶습니다. 실무 경험을 바탕으로 멘토링 부탁드립니다!",
                "status": "pending"
            },
            {
                "mentor_id": created_mentors[1].id,  # 이백엔드
                "mentee_id": created_mentees[1].id,  # 이성장
                "message": "Spring Boot를 활용한 백엔드 개발을 학습하고 싶습니다.",
                "status": "accepted"
            },
            {
                "mentor_id": created_mentors[2].id,  # 박풀스택
                "mentee_id": created_mentees[2].id,  # 박취업
                "message": "풀스택 개발자가 되기 위한 로드맵을 알고 싶습니다.",
                "status": "pending"
            },
            {
                "mentor_id": created_mentors[0].id,  # 김프론트
                "mentee_id": created_mentees[5].id,  # 한신입
                "message": "프론트엔드 실무 스킬을 향상시키고 싶습니다.",
                "status": "rejected"
            },
            {
                "mentor_id": created_mentors[3].id,  # 정데이터
                "mentee_id": created_mentees[3].id,  # 정커리어
                "message": "데이터 사이언스 분야로 전향하려고 합니다. 조언 부탁드립니다.",
                "status": "pending"
            }
        ]
        
        for request_data in sample_requests:
            match_request = MatchRequest(
                mentor_id=request_data["mentor_id"],
                mentee_id=request_data["mentee_id"],
                message=request_data["message"],
                status=request_data["status"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(match_request)
        
        db.commit()
        
        print("\n=== 데이터베이스 초기화 완료 ===")
        print(f"✅ {len(mentors)}명의 멘토 생성됨")
        print(f"✅ {len(mentees)}명의 멘티 생성됨")
        print(f"✅ {len(sample_requests)}개의 샘플 매칭 요청 생성됨")
        print()
        print("=== 생성된 계정 정보 ===")
        print("📧 모든 계정의 비밀번호: password123")
        print()
        print("👨‍💼 멘토 계정:")
        for mentor in mentors:
            print(f"  - {mentor['email']} ({mentor['name']}) - {', '.join(mentor['skills'][:3])}...")
        print()
        print("👨‍🎓 멘티 계정:")
        for mentee in mentees:
            print(f"  - {mentee['email']} ({mentee['name']})")
        print()
        print("🔗 http://localhost:3000 에서 로그인하여 테스트할 수 있습니다.")
        
    except Exception as e:
        print(f"❌ 데이터베이스 초기화 중 오류 발생: {e}")
        print(f"오류 타입: {type(e).__name__}")
        import traceback
        print("상세 오류 정보:")
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    try:
        create_sample_users()
    except KeyboardInterrupt:
        print("\n\n❌ 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {e}")
        sys.exit(1)
