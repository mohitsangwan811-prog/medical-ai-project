from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database.db import get_db, Diagnosis, Patient
from datetime import datetime
from jose import jwt
from typing import Optional

router = APIRouter()

SECRET_KEY = "mediai-secret-key-2024"
ALGORITHM = "HS256"

def get_user_id(authorization: Optional[str] = Header(None)):
    print("AUTH HEADER =", authorization)

    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "")
        

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        

        return int(payload["sub"])

    except :
        
        return None

@router.post("/save")
def save_diagnosis(data: dict, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
        diagnosis = Diagnosis(
            patient_id=user_id,
            symptoms=", ".join(data.get("symptoms", [])),
            predicted_disease=data.get("predicted_disease"),
            confidence=float(data.get("confidence", "0").replace("%", "")),
            risk_level=data.get("risk_level"),
            created_at=datetime.utcnow()
        )
        db.add(diagnosis)
        db.commit()
        db.refresh(diagnosis)
        return {"message": "Diagnosis saved successfully", "id": diagnosis.id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.get("/history")
def get_history(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:

        print("USER ID =", user_id)

        diagnoses = db.query(Diagnosis).filter(
            Diagnosis.patient_id == user_id
        ).all()

        print("FOUND =", len(diagnoses))

        diagnoses = db.query(Diagnosis, Patient).join(
            Patient, Diagnosis.patient_id == Patient.id
        ).filter(
            Diagnosis.patient_id == user_id
        ).order_by(Diagnosis.created_at.desc()).limit(50).all()

        result = []

        for diagnosis, patient in diagnoses:
            result.append({
                "id": diagnosis.id,
                "patient_name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "symptoms": diagnosis.symptoms,
                "predicted_disease": diagnosis.predicted_disease,
                "confidence": f"{diagnosis.confidence:.1f}%",
                "risk_level": diagnosis.risk_level,
                "date": diagnosis.created_at.strftime("%d %b %Y, %I:%M %p")
            })

        return {"history": result, "total": len(result)}

    except Exception as e:
        return {"error": str(e)}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
        total = db.query(Diagnosis).filter(Diagnosis.patient_id == user_id).count()
        high_risk = db.query(Diagnosis).filter(
            Diagnosis.patient_id == user_id,
            Diagnosis.risk_level == "High"
        ).count()

        from sqlalchemy import func
        diseases = db.query(
            Diagnosis.predicted_disease,
            func.count(Diagnosis.predicted_disease).label("count")
        ).filter(
            Diagnosis.patient_id == user_id
        ).group_by(Diagnosis.predicted_disease).order_by(
            func.count(Diagnosis.predicted_disease).desc()
        ).limit(5).all()

        return {
            "total_diagnoses": total,
            "high_risk_count": high_risk,
            "top_diseases": [{"disease": d[0], "count": d[1]} for d in diseases]
        }
    except Exception as e:
        return {"error": str(e)}