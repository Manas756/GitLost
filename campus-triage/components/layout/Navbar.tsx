"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Home" },
    { href: "/student/submit", label: "Report issue" },
    { href: "/track", label: "Track ticket" },
    { href: "/dashboard", label: "Staff dashboard" },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-semibold tracking-tight text-white">
          Campus <span className="text-cyan-400">Speedrun</span>
        </Link>
        <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                pathname === link.href
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
