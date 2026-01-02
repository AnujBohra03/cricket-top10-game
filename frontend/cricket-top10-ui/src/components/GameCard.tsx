function GameCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: "24px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}

export default GameCard;
