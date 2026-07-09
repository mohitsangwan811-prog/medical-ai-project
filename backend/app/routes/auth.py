from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db, Patient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
import traceback

router = APIRouter()

SECRET_KEY = "mediai-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    age: int
    gender: str = "Not specified"

class UserLogin(BaseModel):
    email: str
    password: str

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    try:
        existing = db.query(Patient).filter(Patient.email == user.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = Patient(
            name=user.name,
            email=user.email,
            password=hash_password(user.password),
            age=user.age,
            gender=user.gender
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_token({"sub": str(new_user.id), "email": new_user.email})
        
        return {
            "message": "Account created successfully",
            "token": token,
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(Patient).filter(Patient.email == user.email).first()
        
        if not db_user or not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = create_token({"sub": str(db_user.id), "email": db_user.email})
        
        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))