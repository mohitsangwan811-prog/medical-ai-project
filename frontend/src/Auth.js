import { useState } from "react";
import axios from "axios";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && (!name || !age))) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const url = isLogin
        ? "http://127.0.0.1:8000/auth/login"
        : "http://127.0.0.1:8000/auth/signup";

      const body = isLogin
        ? { email, password }
        : { name, email, password, age: parseInt(age), gender };

      const res = await axios.post(url, body);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);

    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚕️</span>
          <div>
            <h1 style={styles.logoText}>MediAI</h1>
            <p style={styles.logoSub}>Intelligent Health Assistant</p>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={styles.cardSubtitle}>
            {isLogin ? "Login to access your health dashboard" : "Sign up to get started with MediAI"}
          </p>

          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} placeholder="Enter your email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} placeholder="Enter your password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {!isLogin && (
            <>
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
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.primaryBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "⏳ Please wait..." : isLogin ? "Login →" : "Create Account →"}
          </button>

          <p style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={styles.switchLink} onClick={() => { setIsLogin(!isLogin); setError(""); }}>
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" },
  header: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", padding: "16px 24px" },
  logo: { display: "flex", alignItems: "center", gap: "12px", maxWidth: "800px", margin: "0 auto" },
  logoIcon: { fontSize: "32px" },
  logoText: { color: "white", fontSize: "24px", fontWeight: "700", margin: 0 },
  logoSub: { color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: 0 },
  main: { maxWidth: "480px", margin: "40px auto", padding: "0 16px" },
  card: { background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  cardTitle: { fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px" },
  cardSubtitle: { color: "#64748b", fontSize: "14px", margin: "0 0 24px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" },
  input: { width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  genderGroup: { display: "flex", gap: "12px" },
  genderBtn: { flex: 1, padding: "10px", border: "2px solid #e2e8f0", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#64748b" },
  genderBtnActive: { border: "2px solid #6366f1", background: "#eef2ff", color: "#6366f1" },
  error: { color: "#ef4444", fontSize: "14px", margin: "0 0 16px" },
  primaryBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
  switchText: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" },
  switchLink: { color: "#6366f1", fontWeight: "600", cursor: "pointer" }
};

export default Auth;