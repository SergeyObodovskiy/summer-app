"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncStatus } from "@summer/client";

const tabs = [
  { href: "/", label: "Неделя" },
  { href: "/kbju", label: "КБЖУ" },
  { href: "/workouts", label: "Тренировки" },
  { href: "/stats", label: "Достижения" },
  { href: "/goals", label: "Цели" },
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
      <SyncBadge />
    </nav>
  );
}

function SyncBadge() {
  const { online, syncing, connected } = useSyncStatus();
  const { label, color, bg } = !online
    ? { label: "офлайн", color: "#92400e", bg: "#fef3c7" }
    : syncing
    ? { label: "синхронизация…", color: "#1e40af", bg: "#dbeafe" }
    : connected
    ? { label: "онлайн", color: "#15803d", bg: "#dcfce7" }
    : { label: "подключение…", color: "#6b7280", bg: "#f1f3f5" };
  return (
    <span
      title="Статус синхронизации"
      style={{
        marginLeft: "auto",
        alignSelf: "center",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 8,
        color,
        background: bg,
      }}
    >
      {label}
    </span>
  );
}
