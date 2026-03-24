export default function Footer() {
  return (
    <footer className="h-12 px-4 flex items-center justify-center text-sm">
      <div className="select-none">
        © {new Date().getFullYear()} — All rights reserved
      </div>
    </footer>
  );
}
