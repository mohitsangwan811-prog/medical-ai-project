import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import Auth from "./Auth";
import PDFReport from "./PDFReport";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const ALL_SYMPTOMS = [
  "fever", "chills", "headache", "nausea", "sweating", "vomiting", "fatigue",
  "weakness", "stomach_pain", "loss_of_appetite", "constipation", "diarrhea",
  "severe_headache", "joint_pain", "rash", "muscle_pain", "pain_behind_eyes",
  "chest_pain", "cough", "shortness_of_breath", "difficulty_breathing",
  "frequent_urination", "excessive_thirst", "blurred_vision", "slow_healing",
  "numbness", "night_sweats", "weight_loss", "blood_in_sputum", "wheezing",
  "chest_tightness", "yellow_skin", "yellow_eyes", "dark_urine", "abdominal_pain",
  "loss_of_taste", "loss_of_smell", "body_ache", "throbbing_headache",
  "light_sensitivity", "dizziness", "pale_skin", "cold_hands", "cold_feet",
  "irregular_heartbeat", "burning_urination", "pelvic_pain", "cloudy_urine",
  "blood_in_urine", "back_pain", "bloating", "indigestion", "heartburn",
  "stomach_cramps", "dehydration", "nosebleed", "blisters", "itching",
  "sadness", "sleep_problems", "loss_of_interest", "concentration_issues",
  "hopelessness", "swelling", "stiffness", "reduced_motion", "warmth",
  "severe_pain", "high_fever", "persistent_cough", "sore_throat"
];

const SYMPTOM_CATEGORIES = {
  "Fever & Temperature": ["fever", "high_fever", "chills", "sweating", "night_sweats"],
  "Head & Neurological": ["headache", "severe_headache", "throbbing_headache", "dizziness", "light_sensitivity", "blurred_vision"],
  "Respiratory": ["cough", "persistent_cough", "shortness_of_breath", "difficulty_breathing", "wheezing", "chest_tightness", "chest_pain"],
  "Digestive": ["nausea", "vomiting", "stomach_pain", "abdominal_pain", "bloating", "indigestion", "heartburn", "stomach_cramps", "diarrhea", "constipation", "loss_of_appetite"],
  "Body & Muscles": ["fatigue", "weakness", "body_ache", "muscle_pain", "joint_pain", "back_pain", "severe_pain", "swelling", "stiffness", "reduced_motion", "warmth"],
  "Skin": ["rash", "yellow_skin", "pale_skin", "blisters", "itching"],
  "Urinary": ["frequent_urination", "burning_urination", "pelvic_pain", "cloudy_urine", "blood_in_urine"],
  "Other Symptoms": ["loss_of_taste", "loss_of_smell", "nosebleed", "yellow_eyes", "dark_urine", "blood_in_sputum", "sore_throat", "pain_behind_eyes", "irregular_heartbeat", "cold_hands", "cold_feet", "slow_healing", "excessive_thirst", "weight_loss", "numbness", "sadness", "sleep_problems", "loss_of_interest", "concentration_issues", "hopelessness", "dehydration"]
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [step, setStep] = useState(1);
  const [page, setPage] = useState("home");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Fever & Temperature");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);
  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/diagnosis/history`, { headers: getHeaders() });
      setHistory(res.data.history || []);
    } catch (err) { console.log(err); }
  }, [getHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/diagnosis/stats`, { headers: getHeaders() });
      setStats(res.data);
    } catch (err) { console.log(err); }
  }, [getHeaders]);

  useEffect(() => {
    if (page === "history") {
      fetchHistory();
      fetchStats();
    }
  }, [page, fetchHistory, fetchStats]);

  const toggleSymptom = (s) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const filteredSymptoms = search
    ? ALL_SYMPTOMS.filter(s => s.includes(search.toLowerCase()))
    : SYMPTOM_CATEGORIES[activeCategory] || [];

  const diagnose = async () => {
    if (!name || !age || selected.length === 0) {
      setError("Please fill all fields and select at least one symptom.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/diagnose`, {
        patient_name: name, age: parseInt(age), symptoms: selected
      });
      setResult(res.data);

      await axios.post(`${API_URL}/diagnosis/save`, {
        patient_name: name, age: parseInt(age), gender,
        symptoms: selected,
        predicted_disease: res.data.predicted_disease,
        confidence: res.data.confidence,
        risk_level: res.data.risk_level
      }, { headers: getHeaders() });

      setStep(3);
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => {
    setName(""); setAge(""); setGender("");
    setSelected([]); setResult(null);
    setError(""); setStep(1); setSearch("");
  };

  const getRiskColor = (risk) => {
    if (risk === "High") return "#ef4444";
    if (risk === "Medium") return "#f59e0b";
    return "#10b981";
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚕️</span>
            <div>
              <h1 style={styles.logoText}>MediAI</h1>
              <p style={styles.logoSub}>Intelligent Health Assistant</p>
            </div>
          </div>
          <div style={styles.navBtns}>
            <span style={styles.welcomeText}>👋 {user.name}</span>
            <button style={{...styles.navBtn, ...(page === "home" ? styles.navBtnActive : {})}} onClick={() => { setPage("home"); reset(); }}>
              🏠 Home
            </button>
            <button style={{...styles.navBtn, ...(page === "history" ? styles.navBtnActive : {})}} onClick={() => setPage("history")}>
              📋 History
            </button>
            <button style={{...styles.navBtn, background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.5)"}} onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        {page === "home" && (
          <div>
            {step < 3 && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: step === 1 ? "50%" : "100%"}} />
                </div>
                <div style={styles.progressSteps}>
                  <span style={{...styles.progressStep, color: step >= 1 ? "#6366f1" : "#94a3b8"}}>① Patient Info</span>
                  <span style={{...styles.progressStep, color: step >= 2 ? "#6366f1" : "#94a3b8"}}>② Select Symptoms</span>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Patient Information</h2>
                <p style={styles.cardSubtitle}>Please provide your basic details to get started</p>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input style={styles.input} placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Age</label>
                  <input style={styles.input} placeholder="Enter your age" type="number" value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender</label>
                  <div style={styles.genderGroup}>
                    {["Male", "Female", "Other"].map(g => (
                      <button key={g} style={{...styles.genderBtn, ...(gender === g ? styles.genderBtnActive : {})}} onClick={() => setGender(g)}>
                        {g === "Male" ? "♂ Male" : g === "Female" ? "♀ Female" : "⚧ Other"}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <button style={styles.primaryBtn} onClick={() => { if (!name || !age) { setError("Please fill all fields."); return; } setError(""); setStep(2); }}>
                  Continue →
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Select Your Symptoms</h2>
                <p style={styles.cardSubtitle}>Select all symptoms you are experiencing ({selected.length} selected)</p>
                <input style={styles.searchInput} placeholder="🔍 Search symptoms..." value={search} onChange={e => setSearch(e.target.value)} />
                {!search && (
                  <div style={styles.categories}>
                    {Object.keys(SYMPTOM_CATEGORIES).map(cat => (
                      <button key={cat} style={{...styles.categoryBtn, ...(activeCategory === cat ? styles.categoryBtnActive : {})}} onClick={() => setActiveCategory(cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                <div style={styles.symptomsGrid}>
                  {filteredSymptoms.map(s => (
                    <button key={s} style={{...styles.symptomBtn, ...(selected.includes(s) ? styles.symptomBtnActive : {})}} onClick={() => toggleSymptom(s)}>
                      {selected.includes(s) ? "✓ " : ""}{s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                {selected.length > 0 && (
                  <div style={styles.selectedSection}>
                    <p style={styles.selectedTitle}>Selected Symptoms:</p>
                    <div style={styles.selectedTags}>
                      {selected.map(s => (
                        <span key={s} style={styles.tag}>
                          {s.replace(/_/g, " ")}
                          <button style={styles.tagRemove} onClick={() => toggleSymptom(s)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {error && <p style={styles.error}>{error}</p>}
                <div style={styles.btnRow}>
                  <button style={styles.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
                  <button style={styles.primaryBtn} onClick={diagnose} disabled={loading}>
                    {loading ? "⏳ Analyzing..." : "🔍 Get Diagnosis"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && result && (
              <div>
                <div style={styles.resultHeader}>
                  <h2 style={styles.resultTitle}>Diagnosis Complete</h2>
                  <p style={styles.resultSubtitle}>Based on AI analysis of your symptoms</p>
                </div>
                <div style={styles.card}>
                  <div style={styles.patientRow}>
                    <div style={styles.avatar}>{result.patient.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 style={styles.patientName}>{result.patient}</h3>
                      <p style={styles.patientInfo}>Age: {result.age} • {gender || "Not specified"}</p>
                    </div>
                    <div style={{...styles.riskBadge, background: getRiskColor(result.risk_level)}}>
                      {result.risk_level} Risk
                    </div>
                  </div>
                </div>
                <div style={{...styles.card, borderLeft: "4px solid #6366f1"}}>
                  <p style={styles.sectionLabel}>PRIMARY DIAGNOSIS</p>
                  <h2 style={styles.diseaseName}>{result.predicted_disease.replace(/_/g, " ")}</h2>
                  <div style={styles.confidenceRow}>
                    <span style={styles.confidenceLabel}>Confidence Score</span>
                    <span style={styles.confidenceValue}>{result.confidence}</span>
                  </div>
                  <div style={styles.confidenceBarBg}>
                    <div style={{...styles.confidenceBarFill, width: result.confidence, background: parseFloat(result.confidence) > 70 ? "#10b981" : "#f59e0b"}} />
                  </div>
                </div>
                {result.top3_predictions && (
                  <div style={styles.card}>
                    <p style={styles.sectionLabel}>TOP 3 POSSIBLE CONDITIONS</p>
                    {result.top3_predictions.map((item, i) => (
                      <div key={i} style={styles.predictionRow}>
                        <div style={styles.predictionRank}>#{i + 1}</div>
                        <div style={styles.predictionInfo}>
                          <p style={styles.predictionName}>{item.disease.replace(/_/g, " ")}</p>
                          <div style={styles.predictionBarBg}>
                            <div style={{...styles.predictionBarFill, width: item.confidence, background: i === 0 ? "#6366f1" : i === 1 ? "#8b5cf6" : "#a78bfa"}} />
                          </div>
                        </div>
                        <span style={styles.predictionConf}>{item.confidence}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={styles.card}>
                  <p style={styles.sectionLabel}>DOCTOR RECOMMENDATION</p>
                  <div style={styles.doctorRow}>
                    <span style={styles.doctorIcon}>👨‍⚕️</span>
                    <div>
                      <p style={styles.doctorSpecialist}>{result.doctor_recommendation.specialist}</p>
                      <p style={styles.doctorUrgency}>⏰ Visit: {result.doctor_recommendation.urgency}</p>
                    </div>
                  </div>
                </div>
                <div style={styles.card}>
                  <p style={styles.sectionLabel}>SYMPTOMS ANALYZED ({result.symptoms_analyzed.length})</p>
                  <div style={styles.selectedTags}>
                    {result.symptoms_analyzed.map(s => (
                      <span key={s} style={styles.tag}>{s.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
                <div style={styles.disclaimer}>
                  ⚠️ This is an AI-powered tool for informational purposes only. Always consult a qualified medical professional for proper diagnosis and treatment.
                </div>
                <PDFReport
  patient={{
    name: result.patient,
    age: result.age,
    gender: gender
  }}
  diagnosis={{
    name: result.predicted_disease,
    confidence: parseFloat(result.confidence)
  }}
  topConditions={
    result.top3_predictions?.map(item => ({
      name: item.disease,
      confidence: parseFloat(item.confidence)
    })) || []
  }
  doctor={result.doctor_recommendation.specialist}
  riskLevel={result.risk_level}
/>
                <button style={styles.primaryBtn} onClick={reset}>+ New Diagnosis</button>
              </div>
            )}
          </div>
        )}

        {page === "history" && (
          <div>
            <h2 style={styles.cardTitle}>My Diagnosis History</h2>
            <p style={styles.cardSubtitle}>Your personal health records</p>
            {stats && (
              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <p style={styles.statNum}>{stats.total_diagnoses}</p>
                  <p style={styles.statLabel}>Total Diagnoses</p>
                </div>
                <div style={styles.statCard}>
                  <p style={{...styles.statNum, color: "#ef4444"}}>{stats.high_risk_count}</p>
                  <p style={styles.statLabel}>High Risk Cases</p>
                </div>
                <div style={styles.statCard}>
                  <p style={{...styles.statNum, color: "#6366f1", fontSize: "16px"}}>{stats.top_diseases?.[0]?.disease?.replace(/_/g, " ") || "N/A"}</p>
                  <p style={styles.statLabel}>Most Common</p>
                </div>
              </div>
            )}
            {history.length === 0 ? (
              <div style={styles.card}>
                <p style={{textAlign: "center", color: "#94a3b8", padding: "40px"}}>No diagnosis history yet</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} style={{...styles.card, borderLeft: `4px solid ${getRiskColor(item.risk_level)}`}}>
                  <div style={{display: "flex", alignItems: "flex-start", gap: "16px"}}>
                    <div style={styles.avatar}>{item.patient_name.charAt(0).toUpperCase()}</div>
                    <div style={{flex: 1}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px"}}>
                        <h3 style={styles.patientName}>{item.patient_name}</h3>
                        <span style={{...styles.riskBadge, background: getRiskColor(item.risk_level), fontSize: "11px", padding: "3px 10px"}}>
                          {item.risk_level}
                        </span>
                      </div>
                      <p style={styles.patientInfo}>Age: {item.age} • {item.gender}</p>
                      <p style={{...styles.patientInfo, marginTop: "4px"}}>🦠 <b>{item.predicted_disease?.replace(/_/g, " ")}</b> • 📊 {item.confidence}</p>
                      <p style={{...styles.patientInfo, marginTop: "4px"}}>📅 {item.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" },
  header: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", padding: "16px 24px", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" },
  headerContent: { maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { fontSize: "32px" },
  logoText: { color: "white", fontSize: "24px", fontWeight: "700", margin: 0 },
  logoSub: { color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: 0 },
  navBtns: { display: "flex", gap: "8px", alignItems: "center" },
  navBtn: { padding: "8px 16px", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "20px", background: "transparent", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  navBtnActive: { background: "rgba(255,255,255,0.2)", border: "2px solid white" },
  welcomeText: { color: "white", fontSize: "13px", fontWeight: "600", marginRight: "8px" },
  main: { maxWidth: "800px", margin: "0 auto", padding: "24px 16px" },
  progressContainer: { marginBottom: "24px" },
  progressBar: { height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "3px", transition: "width 0.3s" },
  progressSteps: { display: "flex", justifyContent: "space-between", marginTop: "8px" },
  progressStep: { fontSize: "13px", fontWeight: "600" },
  card: { background: "white", borderRadius: "16px", padding: "24px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  cardTitle: { fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px" },
  cardSubtitle: { color: "#64748b", fontSize: "14px", margin: "0 0 24px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" },
  input: { width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  searchInput: { width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" },
  genderGroup: { display: "flex", gap: "12px" },
  genderBtn: { flex: 1, padding: "10px", border: "2px solid #e2e8f0", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#64748b" },
  genderBtnActive: { border: "2px solid #6366f1", background: "#eef2ff", color: "#6366f1" },
  categories: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  categoryBtn: { padding: "6px 14px", border: "2px solid #e2e8f0", borderRadius: "20px", background: "white", cursor: "pointer", fontSize: "13px", color: "#64748b", fontWeight: "500" },
  categoryBtnActive: { border: "2px solid #6366f1", background: "#eef2ff", color: "#6366f1", fontWeight: "600" },
  symptomsGrid: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" },
  symptomBtn: { padding: "8px 16px", border: "2px solid #e2e8f0", borderRadius: "20px", background: "white", cursor: "pointer", fontSize: "13px", color: "#374151", fontWeight: "500" },
  symptomBtnActive: { border: "2px solid #6366f1", background: "#eef2ff", color: "#6366f1", fontWeight: "600" },
  selectedSection: { marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "12px" },
  selectedTitle: { fontSize: "13px", fontWeight: "600", color: "#64748b", margin: "0 0 10px" },
  selectedTags: { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag: { background: "#eef2ff", color: "#6366f1", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" },
  tagRemove: { background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "16px", padding: 0, lineHeight: 1 },
  error: { color: "#ef4444", fontSize: "14px", margin: "8px 0" },
  primaryBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  secondaryBtn: { width: "48%", padding: "14px", background: "white", color: "#6366f1", border: "2px solid #6366f1", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  btnRow: { display: "flex", gap: "12px", justifyContent: "space-between" },
  resultHeader: { textAlign: "center", marginBottom: "20px" },
  resultTitle: { fontSize: "26px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" },
  resultSubtitle: { color: "#64748b", fontSize: "14px", margin: 0 },
  patientRow: { display: "flex", alignItems: "center", gap: "16px" },
  avatar: { width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "700", flexShrink: 0 },
  patientName: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" },
  patientInfo: { color: "#64748b", fontSize: "14px", margin: 0 },
  riskBadge: { marginLeft: "auto", padding: "6px 16px", borderRadius: "20px", color: "white", fontSize: "13px", fontWeight: "700" },
  sectionLabel: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", margin: "0 0 12px" },
  diseaseName: { fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px" },
  confidenceRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  confidenceLabel: { fontSize: "14px", color: "#64748b" },
  confidenceValue: { fontSize: "14px", fontWeight: "700", color: "#1e293b" },
  confidenceBarBg: { height: "10px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden" },
  confidenceBarFill: { height: "100%", borderRadius: "5px" },
  predictionRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  predictionRank: { width: "28px", height: "28px", borderRadius: "50%", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  predictionInfo: { flex: 1 },
  predictionName: { fontSize: "15px", fontWeight: "600", color: "#1e293b", margin: "0 0 6px" },
  predictionBarBg: { height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" },
  predictionBarFill: { height: "100%", borderRadius: "4px" },
  predictionConf: { fontSize: "14px", fontWeight: "700", color: "#6366f1", minWidth: "45px", textAlign: "right" },
  doctorRow: { display: "flex", alignItems: "center", gap: "16px" },
  doctorIcon: { fontSize: "36px" },
  doctorSpecialist: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" },
  doctorUrgency: { color: "#64748b", fontSize: "14px", margin: 0 },
  disclaimer: { background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "12px", padding: "14px 16px", fontSize: "13px", color: "#92400e", marginBottom: "16px", lineHeight: "1.5" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "20px" },
  statCard: { flex: 1, background: "white", borderRadius: "16px", padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  statNum: { fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" },
  statLabel: { fontSize: "13px", color: "#64748b", margin: 0 },
};

export default App;