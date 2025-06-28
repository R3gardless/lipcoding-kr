#!/bin/bash

# Python 가상환경 활성화 및 의존성 설치
cd backend

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# FastAPI 서버 실행
echo "Starting FastAPI server on http://localhost:8080"
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
