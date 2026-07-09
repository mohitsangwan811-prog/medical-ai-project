import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

export default function PDFReport({ patient, diagnosis, topConditions, doctor, riskLevel }) {
  const reportRef = useRef();

  const getRiskColor = () => {
    if (riskLevel === "High") return "#ef4444";
    if (riskLevel === "Medium") return "#f97316";
    return "#22c55e";
  };

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MediAI_Report_${patient?.name}_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <>
      <div ref={reportRef} style={{
        position: "absolute", left: "-9999px", top: 0,
        width: "794px", background: "white",
        fontFamily: "Arial, sans-serif", padding: "40px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          borderRadius: "12px", padding: "30px", color: "white",
          marginBottom: "30px", display: "flex",
          justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800" }}>MediAI</h1>
            <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "14px" }}>Intelligent Health Assistant</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.85 }}>Report Generated</p>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: "12px", padding: "24px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "56px", height: "56px", background: "#4f46e5",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontSize: "24px", fontWeight: "700"
            }}>
              {patient?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#1e293b" }}>{patient?.name}</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                Age: {patient?.age} • Gender: {patient?.gender}
              </p>
            </div>
          </div>
          <div style={{
            background: getRiskColor(), color: "white",
            padding: "8px 20px", borderRadius: "20px",
            fontWeight: "700", fontSize: "15px"
          }}>
            {riskLevel} Risk
          </div>
        </div>

        <div style={{
          border: "2px solid #4f46e5", borderRadius: "12px",
          padding: "24px", marginBottom: "24px", background: "#fafafe"
        }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>
            PRIMARY DIAGNOSIS
          </p>
          <h2 style={{ margin: "0 0 16px", fontSize: "28px", color: "#1e293b", fontWeight: "800" }}>
            {diagnosis?.name}
          </h2>
          <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b" }}>Confidence Score</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "12px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{
                width: `${diagnosis?.confidence}%`, height: "100%",
                background: "linear-gradient(90deg, #4f46e5, #7c3aed)", borderRadius: "6px"
              }} />
            </div>
            <span style={{ fontWeight: "700", color: "#4f46e5", fontSize: "16px" }}>{diagnosis?.confidence}%</span>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
            TOP POSSIBLE CONDITIONS
          </h3>
          {topConditions?.map((condition, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "16px",
              marginBottom: "14px", padding: "14px",
              background: i === 0 ? "#eff6ff" : "#f8fafc",
              borderRadius: "10px",
              border: i === 0 ? "1px solid #bfdbfe" : "1px solid #e2e8f0"
            }}>
              <span style={{
                width: "28px", height: "28px",
                background: i === 0 ? "#4f46e5" : "#94a3b8",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", color: "white", fontSize: "13px",
                fontWeight: "700", flexShrink: 0
              }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "15px" }}>{condition.name}</span>
                  <span style={{ fontWeight: "700", color: i === 0 ? "#4f46e5" : "#64748b" }}>{condition.confidence}%</span>
                </div>
                <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${condition.confidence}%`, height: "100%",
                    background: i === 0 ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "#94a3b8",
                    borderRadius: "4px"
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac",
          borderRadius: "12px", padding: "20px", marginBottom: "24px",
          display: "flex", alignItems: "center", gap: "16px"
        }}>
          <span style={{ fontSize: "36px" }}>👨‍⚕️</span>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>DOCTOR RECOMMENDATION</p>
            <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>{doctor}</p>
          </div>
        </div>

        <div style={{
          background: "#fffbeb", border: "1px solid #fcd34d",
          borderRadius: "10px", padding: "16px", marginBottom: "24px"
        }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#92400e", lineHeight: "1.6" }}>
            Disclaimer: This AI-generated report is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare provider.
          </p>
        </div>

        <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "16px", display: "flex", justifyContent: "space-between" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Generated by MediAI</p>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>
            Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      </div>

      <button onClick={downloadPDF} style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        color: "white", border: "none", borderRadius: "12px",
        padding: "14px 28px", fontSize: "16px", fontWeight: "700",
        cursor: "pointer", marginTop: "20px"
      }}>
        Download Medical Report PDF
      </button>
    </>
  );
}