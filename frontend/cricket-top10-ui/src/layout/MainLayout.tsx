import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      {/* TRUE CENTER AREA */}
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
        }}
      >
        {children}
      </div>

      <Footer />
    </div>
  );
}

export default MainLayout;
