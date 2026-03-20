import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="overflow-x-hidden relative min-h-screen flex flex-col bg-contrast dark:bg-brandDark text-zinc-800 dark:text-contrast">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
