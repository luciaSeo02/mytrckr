"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/job-applications", label: "Job Tracker" },
  { href: "/market-insights", label: "Market" },
  { href: "/recommendations", label: "Learn" },
  { href: "/cv-analyzer", label: "CV Analyzer" },
  { href: "/interview-prep", label: "Interview" },
];

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export default function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (AUTH_ROUTES.includes(pathname)) return null;
  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const initials = user ? getInitials(user.name, user.email) : "?";
  const displayName = user?.name ?? user?.email ?? "";

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--bg-border)",
        backgroundColor: "var(--bg-base)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--accent)",
            letterSpacing: "0.05em",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          my<span style={{ color: "var(--text-muted)" }}>/</span>trckr
        </Link>

        <div
          className="nav-desktop"
          style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isActive
                    ? "var(--bg-elevated)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div
          className="nav-desktop"
          ref={userMenuRef}
          style={{ position: "relative" }}
        >
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              padding: "5px 10px 5px 6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--text-muted)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!userMenuOpen) {
                e.currentTarget.style.borderColor = "var(--bg-border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                backgroundColor: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </span>
            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>
              {userMenuOpen ? "▲" : "▼"}
            </span>
          </button>

          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 180,
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
                padding: "4px 0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 100,
              }}
            >
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  display: "block",
                  padding: "10px 14px 8px",
                  borderBottom: "1px solid var(--bg-border)",
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {user?.name ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {user?.email}
                </div>
              </Link>

              <div
                style={{
                  borderTop: "1px solid var(--bg-border)",
                  marginTop: 4,
                  paddingTop: 4,
                }}
              >
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    void logout();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    fontSize: "0.875rem",
                    color: "var(--danger)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 0,
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: "none",
            background: "none",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-md)",
            padding: "6px 10px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: "1rem",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            borderTop: "1px solid var(--bg-border)",
            backgroundColor: "var(--bg-surface)",
            padding: "12px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px 12px",
              borderBottom: "1px solid var(--bg-border)",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              >
                {user?.name ?? "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {user?.email}
              </div>
            </div>
          </div>

          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isActive
                    ? "var(--accent-dim)"
                    : "transparent",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              color:
                pathname === "/profile"
                  ? "var(--accent)"
                  : "var(--text-secondary)",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor:
                pathname === "/profile" ? "var(--accent-dim)" : "transparent",
              textDecoration: "none",
              display: "block",
            }}
          >
            Profile
          </Link>

          <button
            onClick={() => {
              setMenuOpen(false);
              void logout();
            }}
            data-variant="danger"
            style={{ marginTop: 8, padding: "10px", width: "100%" }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
