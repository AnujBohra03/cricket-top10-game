import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout({
  children,
  theme,
  onToggleTheme,
}: {
  children: React.ReactNode;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
