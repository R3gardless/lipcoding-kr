import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, List
import uuid
import base64
import io
import binascii
from PIL import Image

from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, RedirectResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, LargeBinary, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, validator, ValidationError
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

# 예외 핸들러
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Pydantic 검증 오류를 400 Bad Request로 변환"""
    return JSONResponse(
        status_code=400,
        content={"detail": "Validation error"}
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
    id: int
    name: str
    role: str
    bio: str
    image: Optional[str] = None  # Base64 encoded image
    skills: Optional[List[str]] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['mentor', 'mentee']:
            raise ValueError('Role must be either mentor or mentee')
        return v

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

def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """토큰이 없어도 401 대신 None을 반환하는 버전"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def validate_image(image_data: bytes) -> tuple[bool, str]:
    """이미지 유효성 검사"""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        # 포맷 확인
        if image.format not in ['JPEG', 'PNG']:
            return False, f"지원하지 않는 이미지 형식입니다. JPEG 또는 PNG만 가능합니다. (현재: {image.format})"
        
        # 크기 확인 (500x500 ~ 1000x1000)
        width, height = image.size
        if not (500 <= width <= 1000 and 500 <= height <= 1000):
            return False, f"이미지 크기는 500x500 ~ 1000x1000 픽셀이어야 합니다. (현재: {width}x{height})"
        
        # 파일 크기 확인 (1MB)
        if len(image_data) > 1024 * 1024:
            return False, f"이미지 파일 크기는 1MB 이하여야 합니다. (현재: {len(image_data) / 1024 / 1024:.2f}MB)"
        
        return True, "유효한 이미지입니다."
    except Exception as e:
        return False, f"이미지 처리 중 오류가 발생했습니다: {str(e)}"

# API 엔드포인트

@app.get("/")
async def root():
    """루트 URL에서 Swagger UI로 리다이렉트"""
    return RedirectResponse(url="/swagger-ui")

@app.post("/api/signup", status_code=201)
async def signup(request: dict, db: Session = Depends(get_db)):
    """회원가입"""
    # 필수 필드 검증
    required_fields = ["email", "password", "name", "role"]
    for field in required_fields:
        if field not in request:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # 역할 검증
    if request["role"] not in ["mentor", "mentee"]:
        raise HTTPException(status_code=400, detail="Role must be either mentor or mentee")
    
    # 이메일 형식 검증 (간단한 검증)
    email = request["email"]
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 사용자 생성
    hashed_password = get_password_hash(request["password"])
    user = User(
        email=email,
        password_hash=hashed_password,
        name=request["name"],
        role=request["role"]
    )
    
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/api/login", response_model=TokenResponse)
async def login(request: dict, db: Session = Depends(get_db)):
    """로그인"""
    # 필수 필드 검증
    if "email" not in request or "password" not in request:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing email or password"
        )
    
    user = db.query(User).filter(User.email == request["email"]).first()
    
    if not user or not verify_password(request["password"], user.password_hash):
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
async def get_profile_image(
    role: str, 
    user_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 이미지 조회"""
    # 역할 검증
    if role not in ["mentor", "mentee"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = db.query(User).filter(User.id == user_id, User.role == role).first()
    
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
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 수정"""
    print(f"프로필 업데이트 요청: {request}")
    print(f"현재 사용자: {current_user.id}, 역할: {current_user.role}")
    
    # 필수 필드 검증
    required_fields = ["id", "name", "role", "bio"]
    for field in required_fields:
        if field not in request:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # 역할 검증
    if request["role"] not in ["mentor", "mentee"]:
        raise HTTPException(status_code=400, detail="Role must be either mentor or mentee")
    
    current_user.name = request["name"]
    current_user.bio = request["bio"]
    
    # 이미지 처리
    if "image" in request and request["image"]:
        try:
            image_data = base64.b64decode(request["image"])
            is_valid, message = validate_image(image_data)
            if not is_valid:
                print(f"이미지 유효성 검사 실패: {message}")
                raise HTTPException(status_code=400, detail=message)
            current_user.image_data = image_data
            print("이미지 업데이트 성공")
        except binascii.Error:
            error_msg = "잘못된 base64 이미지 데이터입니다."
            print(f"Base64 디코딩 오류: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        except HTTPException:
            raise
        except Exception as e:
            error_msg = f"이미지 처리 중 오류가 발생했습니다: {str(e)}"
            print(f"이미지 처리 예외: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
    
    # 멘토인 경우 스킬 처리
    if current_user.role == "mentor" and "skills" in request and request["skills"]:
        import json
        current_user.skills = json.dumps(request["skills"])
    
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
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """매칭 요청 생성 (멘티 전용)"""
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can create match requests")
    
    # 필수 필드 검증
    required_fields = ["mentorId", "menteeId", "message"]
    for field in required_fields:
        if field not in request:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # 멘토 존재 확인
    mentor = db.query(User).filter(User.id == request["mentorId"], User.role == "mentor").first()
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
        mentor_id=request["mentorId"],
        mentee_id=request["menteeId"],
        message=request["message"],
        status="pending"
    )
    
    db.add(match_request)
    db.commit()
    db.refresh(match_request)
    
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
