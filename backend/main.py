import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, List
import uuid
import base64
import io
from PIL import Image

from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, RedirectResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, LargeBinary, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, validator
import uvicorn

# JWT 설정
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

# 데이터베이스 설정
SQLALCHEMY_DATABASE_URL = "sqlite:///./mentor_mentee.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 스키마
security = HTTPBearer()

# FastAPI 앱 설정
app = FastAPI(
    title="Mentor-Mentee Matching API",
    description="API for matching mentors and mentees in a mentoring platform",
    version="1.0.0",
    docs_url="/swagger-ui",
    openapi_url="/openapi.json"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 모델
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False)  # "mentor" or "mentee"
    bio = Column(Text, nullable=True)
    image_data = Column(LargeBinary, nullable=True)
    skills = Column(Text, nullable=True)  # JSON string for mentor skills
    created_at = Column(DateTime, default=datetime.utcnow)

class MatchRequest(Base):
    __tablename__ = "match_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, nullable=False)
    mentee_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending")  # "pending", "accepted", "rejected", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# Pydantic 모델
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['mentor', 'mentee']:
            raise ValueError('Role must be either mentor or mentee')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str

class ProfileRequest(BaseModel):
    name: str
    bio: str
    image: Optional[str] = None  # Base64 encoded image
    skills: Optional[List[str]] = None

class MatchRequestCreate(BaseModel):
    mentorId: int
    menteeId: int
    message: str

class MatchRequestResponse(BaseModel):
    id: int
    mentorId: int
    menteeId: int
    message: str
    status: str

class UserProfile(BaseModel):
    name: str
    bio: Optional[str] = None
    imageUrl: str
    skills: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    profile: UserProfile

class MentorResponse(BaseModel):
    id: int
    email: str
    role: str
    profile: UserProfile

class ErrorResponse(BaseModel):
    detail: str

# 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    # JWT 클레임 추가 (Unix timestamp로 변환)
    to_encode.update({
        "iss": "mentor-mentee-app",  # issuer
        "sub": str(data.get("user_id")),  # subject
        "aud": "mentor-mentee-users",  # audience
        "exp": int(expire.timestamp()),  # expiration time (Unix timestamp)
        "nbf": int(now.timestamp()),  # not before (Unix timestamp)
        "iat": int(now.timestamp()),  # issued at (Unix timestamp)
        "jti": str(uuid.uuid4()),  # JWT ID
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_aud": False}  # audience 검증 비활성화
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        print(f"JWT Error: {e}")  # 디버깅용
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def validate_image(image_data: bytes) -> bool:
    """이미지 유효성 검사"""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        # 포맷 확인
        if image.format not in ['JPEG', 'PNG']:
            return False
        
        # 크기 확인 (500x500 ~ 1000x1000)
        width, height = image.size
        if not (500 <= width <= 1000 and 500 <= height <= 1000):
            return False
        
        # 파일 크기 확인 (1MB)
        if len(image_data) > 1024 * 1024:
            return False
        
        return True
    except Exception:
        return False

# API 엔드포인트

@app.get("/")
async def root():
    """루트 URL에서 Swagger UI로 리다이렉트"""
    return RedirectResponse(url="/swagger-ui")

@app.post("/api/signup", status_code=201)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """회원가입"""
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 사용자 생성
    hashed_password = get_password_hash(request.password)
    user = User(
        email=request.email,
        password_hash=hashed_password,
        name=request.name,
        role=request.role
    )
    
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/api/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "name": user.name or "",
            "role": user.role
        }
    )
    
    return {"token": access_token}

@app.get("/api/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """내 정보 조회"""
    # 기본 이미지 URL 설정
    image_url = f"/api/images/{current_user.role}/{current_user.id}"
    
    profile = UserProfile(
        name=current_user.name or "",
        bio=current_user.bio or "",
        imageUrl=image_url
    )
    
    # 멘토인 경우 스킬 추가
    if current_user.role == "mentor" and current_user.skills:
        import json
        try:
            profile.skills = json.loads(current_user.skills)
        except:
            profile.skills = []
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        profile=profile
    )

@app.get("/api/images/{role}/{user_id}")
async def get_profile_image(role: str, user_id: int, db: Session = Depends(get_db)):
    """프로필 이미지 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.image_data:
        return Response(content=user.image_data, media_type="image/jpeg")
    else:
        # 기본 이미지로 리다이렉트
        default_url = f"https://placehold.co/500x500.jpg?text={role.upper()}"
        return RedirectResponse(url=default_url)

@app.put("/api/profile", response_model=UserResponse)
async def update_profile(
    request: ProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 수정"""
    current_user.name = request.name
    current_user.bio = request.bio
    
    # 이미지 처리
    if request.image:
        try:
            image_data = base64.b64decode(request.image)
            if not validate_image(image_data):
                raise HTTPException(status_code=400, detail="Invalid image format or size")
            current_user.image_data = image_data
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image data")
    
    # 멘토인 경우 스킬 처리
    if current_user.role == "mentor" and request.skills:
        import json
        current_user.skills = json.dumps(request.skills)
    
    db.commit()
    
    # 응답 생성
    image_url = f"/api/images/{current_user.role}/{current_user.id}"
    profile = UserProfile(
        name=current_user.name or "",
        bio=current_user.bio or "",
        imageUrl=image_url
    )
    
    if current_user.role == "mentor" and current_user.skills:
        import json
        try:
            profile.skills = json.loads(current_user.skills)
        except:
            profile.skills = []
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        profile=profile
    )

@app.get("/api/mentors", response_model=List[MentorResponse])
async def get_mentors(
    skill: Optional[str] = Query(None),
    order_by: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """멘토 목록 조회 (멘티 전용)"""
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can access mentor list")
    
    query = db.query(User).filter(User.role == "mentor")
    
    # 스킬 필터링
    if skill:
        query = query.filter(User.skills.contains(f'"{skill}"'))
    
    mentors = query.all()
    
    # 정렬
    if order_by == "name":
        mentors.sort(key=lambda x: x.name or "")
    elif order_by == "skill":
        mentors.sort(key=lambda x: x.skills or "")
    else:
        mentors.sort(key=lambda x: x.id)
    
    # 응답 생성
    result = []
    for mentor in mentors:
        image_url = f"/api/images/{mentor.role}/{mentor.id}"
        profile = UserProfile(
            name=mentor.name or "",
            bio=mentor.bio or "",
            imageUrl=image_url
        )
        
        if mentor.skills:
            import json
            try:
                profile.skills = json.loads(mentor.skills)
            except:
                profile.skills = []
        
        result.append(MentorResponse(
            id=mentor.id,
            email=mentor.email,
            role=mentor.role,
            profile=profile
        ))
    
    return result

@app.post("/api/match-requests", response_model=MatchRequestResponse)
async def create_match_request(
    request: MatchRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """매칭 요청 생성 (멘티 전용)"""
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can create match requests")
    
    # 멘토 존재 확인
    mentor = db.query(User).filter(User.id == request.mentorId, User.role == "mentor").first()
    if not mentor:
        raise HTTPException(status_code=400, detail="Mentor not found")
    
    # 기존 pending 요청 확인 (한 번에 하나의 요청만)
    existing_request = db.query(MatchRequest).filter(
        MatchRequest.mentee_id == current_user.id,
        MatchRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request")
    
    # 매칭 요청 생성
    match_request = MatchRequest(
        mentor_id=request.mentorId,
        mentee_id=current_user.id,
        message=request.message,
        status="pending"
    )
    
    db.add(match_request)
    db.commit()
    
    return MatchRequestResponse(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status
    )

@app.get("/api/match-requests/incoming", response_model=List[MatchRequestResponse])
async def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """나에게 들어온 요청 목록 (멘토 전용)"""
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can access incoming requests")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id).all()
    
    return [
        MatchRequestResponse(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            message=req.message,
            status=req.status
        )
        for req in requests
    ]

@app.get("/api/match-requests/outgoing", response_model=List[MatchRequestResponse])
async def get_outgoing_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내가 보낸 요청 목록 (멘티 전용)"""
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can access outgoing requests")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id).all()
    
    return [
        MatchRequestResponse(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            message=req.message,
            status=req.status
        )
        for req in requests
    ]

@app.put("/api/match-requests/{request_id}/accept", response_model=MatchRequestResponse)
async def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """요청 수락 (멘토 전용)"""
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can accept requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentor_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 이미 수락된 요청이 있는지 확인
    existing_accepted = db.query(MatchRequest).filter(
        MatchRequest.mentor_id == current_user.id,
        MatchRequest.status == "accepted"
    ).first()
    
    if existing_accepted:
        raise HTTPException(status_code=400, detail="You already have an accepted mentee")
    
    # 요청 수락
    match_request.status = "accepted"
    match_request.updated_at = datetime.utcnow()
    db.commit()
    
    return MatchRequestResponse(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status
    )

@app.put("/api/match-requests/{request_id}/reject", response_model=MatchRequestResponse)
async def reject_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """요청 거절 (멘토 전용)"""
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can reject requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentor_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 요청 거절
    match_request.status = "rejected"
    match_request.updated_at = datetime.utcnow()
    db.commit()
    
    return MatchRequestResponse(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status
    )

@app.delete("/api/match-requests/{request_id}", response_model=MatchRequestResponse)
async def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """요청 취소 (멘티 전용)"""
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can cancel requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentee_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 요청 취소
    match_request.status = "cancelled"
    match_request.updated_at = datetime.utcnow()
    db.commit()
    
    return MatchRequestResponse(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
