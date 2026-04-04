import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="[overflow-x:clip] relative min-h-screen flex flex-col bg-brandDark text-contrast">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
