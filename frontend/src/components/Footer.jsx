export default function Footer() {
  return (
    <footer className="h-12 px-4 flex items-center justify-center border-t border-zinc-200 dark:border-zinc-800 text-sm">
      © {new Date().getFullYear()} — All rights reserved
    </footer>
  );
}
