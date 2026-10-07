"use client";

import { useState } from "react";

export default function AITest() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      setResult({
        error: "Could not connect to AI.",
      });
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "60px 20px",
        background: "#f7f8fa",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "32px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>TraceMind AI Test</h1>

        <p style={{ color: "#666" }}>
          Test whether TraceMind can understand saved information.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste some information here..."
          rows={8}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "15px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            resize: "vertical",
            fontSize: "15px",
          }}
        />

        <button
          onClick={testAI}
          disabled={loading}
          style={{
            marginTop: "15px",
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            background: "#111827",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "AI is thinking..." : "Analyze with AI"}
        </button>

        {result && (
          <pre
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f3f4f6",
              borderRadius: "12px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}