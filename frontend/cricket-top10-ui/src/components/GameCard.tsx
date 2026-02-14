function GameCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        padding: "clamp(14px, 3vw, 24px)",
        borderRadius: "clamp(14px, 2.6vw, 20px)",
        width: "100%",
        maxWidth: "760px",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {children}
    </div>
  );
}

export default GameCard;
