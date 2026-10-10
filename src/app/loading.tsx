export default function Loading() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "2px solid rgba(201, 169, 110, 0.2)",
          borderTopColor: "#c9a96e",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          letterSpacing: "0.2em",
          color: "var(--clr-accent, #c9a96e)",
          textTransform: "uppercase",
          opacity: 0.85,
        }}
      >
        TRIPLE Z
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
