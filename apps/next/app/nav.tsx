"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Неделя" },
  { href: "/kbju", label: "КБЖУ" },
  { href: "/workouts", label: "Тренировки" },
  { href: "/stats", label: "Достижения" },
  { href: "/settings", label: "Настройки" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav style={{ display: "flex", gap: 8, padding: 12, background: "#fff", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              color: active ? "#fff" : "#1d2127",
              background: active ? "#2563eb" : "#e9ecf1",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
