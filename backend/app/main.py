from fastapi import FastAPI
from app.routes.diagnosis import router as diagnosis_router
from app.routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np

app = FastAPI(
    title="Medical Diagnosis API",
    description="AI Powered Medical Diagnosis System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(diagnosis_router, prefix="/diagnosis", tags=["diagnosis"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
# Models load karo
model = joblib.load("ml/disease_model.pkl")
label_encoder = joblib.load("ml/label_encoder.pkl")
SYMPTOMS = joblib.load("ml/symptoms_list.pkl")

def get_risk_level(confidence: float, age: int) -> str:
    if confidence > 0.8 or age > 60:
        return "High"
    elif confidence > 0.5:
        return "Medium"
    return "Low"

def recommend_doctor(disease: str) -> dict:
    recommendations = {
        "Malaria": {"specialist": "General Physician", "urgency": "Immediate"},
        "Typhoid": {"specialist": "Infectious Disease Specialist", "urgency": "Immediate"},
        "Dengue": {"specialist": "General Physician", "urgency": "Immediate"},
        "Pneumonia": {"specialist": "Pulmonologist", "urgency": "Immediate"},
        "Diabetes": {"specialist": "Endocrinologist", "urgency": "Within 2 days"},
        "Tuberculosis": {"specialist": "Pulmonologist", "urgency": "Immediate"},
        "Asthma": {"specialist": "Pulmonologist", "urgency": "Within 2 days"},
        "COVID19": {"specialist": "Pulmonologist", "urgency": "Immediate"},
        "Migraine": {"specialist": "Neurologist", "urgency": "Within 1 week"},
        "Anemia": {"specialist": "Hematologist", "urgency": "Within 3 days"},
        "UTI": {"specialist": "Urologist", "urgency": "Within 2 days"},
        "Gastritis": {"specialist": "Gastroenterologist", "urgency": "Within 3 days"},
        "Food_Poisoning": {"specialist": "Gastroenterologist", "urgency": "Today"},
        "Hypertension": {"specialist": "Cardiologist", "urgency": "Within 2 days"},
        "Chickenpox": {"specialist": "Dermatologist", "urgency": "Within 2 days"},
        "Depression": {"specialist": "Psychiatrist", "urgency": "Within 1 week"},
        "Arthritis": {"specialist": "Rheumatologist", "urgency": "Within 1 week"},
        "Kidney_Stone": {"specialist": "Urologist", "urgency": "Immediate"},
        "Jaundice": {"specialist": "Gastroenterologist", "urgency": "Immediate"},
    }
    return recommendations.get(disease, {
        "specialist": "General Physician",
        "urgency": "Within 3 days"
    })

@app.get("/")
def home():
    return {"message": "Medical Diagnosis API Running!", "status": "OK"}

@app.get("/symptoms")
def get_symptoms():
    return {"symptoms": SYMPTOMS}

@app.post("/diagnose")
def diagnose(data: dict):
    name = data.get("patient_name", "Patient")
    age = data.get("age", 25)
    symptoms = data.get("symptoms", [])

    # Feature vector banao
    feature_vector = [1 if s in symptoms else 0 for s in SYMPTOMS]

    # Predict karo
    prediction = model.predict([feature_vector])[0]
    probabilities = model.predict_proba([feature_vector])[0]

    # Top 3 predictions
    top3_indices = np.argsort(probabilities)[::-1][:3]
    top3 = [
        {
            "disease": label_encoder.inverse_transform([i])[0],
            "confidence": f"{probabilities[i] * 100:.1f}%"
        }
        for i in top3_indices
    ]

    confidence = float(np.max(probabilities))
    disease = label_encoder.inverse_transform([prediction])[0]
    risk = get_risk_level(confidence, age)
    doctor = recommend_doctor(disease)

    return {
        "patient": name,
        "age": age,
        "symptoms_analyzed": symptoms,
        "predicted_disease": disease,
        "confidence": f"{confidence * 100:.1f}%",
        "risk_level": risk,
        "top3_predictions": top3,
        "doctor_recommendation": doctor
    }