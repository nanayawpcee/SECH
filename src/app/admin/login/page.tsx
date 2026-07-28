"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Shield,
  Database,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const currentYear = new Date().getFullYear();
  const { login, loading } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // 3. Update the handleSubmit function to look exactly like this:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      triggerShake();
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // ✅ 1. Call the login function from AuthContext.
      // This securely talks to your API route AND updates your global React state/session storage instantly.
      const loginError = await login(identifier.trim(), password.trim());

      if (loginError) {
        setSubmitting(false);
        setError(loginError);
        triggerShake();
        return;
      }

      // ✅ 2. Clear submitting state on success
      setSubmitting(false);

      // ✅ 3. Force a hard window location rewrite to /admin/dashboard
      // to completely flush Next.js routing state and force it to re-read your fresh session storage.
      window.location.replace("/admin");
    } catch (err) {
      setSubmitting(false);
      setError("A network error occurred.");
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  if (loading) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--off-white)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #E2EBE7",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="SECH Logo"
              width={40}
              height={40}
              style={{ height: "40px", width: "40px", objectFit: "contain" }}
            />
            <div>
              <h1
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-dark)",
                }}
              >
                St. Elizabeth Catholic Hospital
              </h1>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-light)",
                  margin: 0,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}
              >
                ADMINISTRATIVE PORTAL
              </p>
            </div>
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--red)",
            }}
          >
            <span
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Restricted Access
            </span>
            <AlertTriangle style={{ height: "20px", width: "20px" }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          padding: "5rem 2rem",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-lg)",
              background: "var(--light-green)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              border: "1.5px solid var(--primary)",
            }}
          >
            <Shield
              style={{ height: "32px", width: "32px", color: "var(--primary)" }}
            />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.7rem)",
              fontWeight: 800,
              margin: "0 0 0.75rem",
              color: "var(--text-dark)",
              lineHeight: 1.15,
            }}
          >
            Administrator Access
          </h1>
          <p
            style={{
              color: "var(--text-light)",
              maxWidth: "540px",
              margin: "0 auto",
              fontSize: "1rem",
              lineHeight: 1.7,
            }}
          >
            Secure backend portal for SECH. Comprehensive control over hospital
            content, data, and analytics. Authorized personnel only.
          </p>
        </div>

        {/* Two Column Layout Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.5rem",
            maxWidth: "1000px",
            margin: "0 auto",
            alignItems: "start",
          }}
        >
          {/* Left - Login Form */}
          <div
            style={{
              background: "var(--white)",
              border: "1.5px solid #E2EBE7",
              borderRadius: "var(--radius-lg)",
              padding: "2.5rem",
              boxShadow: "var(--shadow-card)",
              transform: shake ? "translateX(0)" : "none",
              animation: shake ? "shake 0.4s ease-in-out" : "none",
              transition: "var(--transition)",
            }}
          >

            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.3rem",
                fontWeight: 800,
                marginBottom: "1.5rem",
                color: "var(--text-dark)",
              }}
            >
              Sign In to Portal
            </h2>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1.5px solid var(--red)",
                  color: "var(--red)",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  marginBottom: "1.25rem",
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-mid)",
                    marginBottom: "6px",
                  }}
                >
                  Username or Email Address
                </label>
                <input
                  type="text" // ✅ Fixed: Changed from "email" to allow raw username strings without crashing the browser rules
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px solid #D6E8DF",
                    fontSize: "0.9rem",
                    color: "var(--text-dark)",
                    background: "var(--white)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="admin or admin@sech-gh.org"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-mid)",
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid #D6E8DF",
                      fontSize: "0.9rem",
                      color: "var(--text-dark)",
                      background: "var(--white)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-light)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  background: "var(--primary)",
                  color: "var(--white)",
                  padding: "13px 28px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  letterSpacing: "0.06em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  marginTop: "0.5rem",
                  transition: "var(--transition)",
                }}
              >
                {submitting ? "VERIFYING CREDENTIALS..." : "SECURE LOGIN"}
              </button>
            </form>
          </div>

          {/* Right - Info Cards */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Backend Control Card */}
            <div
              style={{
                background: "var(--primary-dark)",
                color: "var(--white)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Database
                    style={{
                      height: "28px",
                      width: "28px",
                      color: "var(--accent)",
                    }}
                  />
                </div>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  textAlign: "center",
                  marginBottom: "0.75rem",
                  color: "var(--white)",
                }}
              >
                Backend Control
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  textAlign: "center",
                  fontSize: "0.88rem",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Full access to Hospital Blog, Newsletters, appointments and
                management.
              </p>
            </div>

            {/* Dashboard Access Card */}
            <div
              style={{
                background: "var(--white)",
                border: "1.5px solid #E2EBE7",
                borderRadius: "var(--radius-md)",
                padding: "1.75rem",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "1.25rem",
                }}
              >
                <CheckCircle
                  style={{
                    height: "20px",
                    width: "20px",
                    color: "var(--primary)",
                  }}
                />
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--text-dark)",
                    margin: 0,
                    fontSize: "0.95rem",
                  }}
                >
                  Dashboard Access
                </h3>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "0.88rem",
                  color: "var(--text-mid)",
                }}
              >
                {[
                  "Real-time hospital performance metrics",
                  "Content management for news and updates",
                  "Appointment scheduling and patient management",
                  "Comprehensive analytics and reporting tools",
                ].map((item, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        marginTop: "8px",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Level Card */}
            <div
              style={{
                background: "rgba(214,64,69,0.04)",
                border: "1.5px solid rgba(214,64,69,0.15)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(214,64,69,0.1)",
                  marginBottom: "0.75rem",
                }}
              >
                <Lock
                  style={{ height: "24px", width: "24px", color: "var(--red)" }}
                />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 800,
                  margin: "0 0 4px",
                  fontSize: "1.1rem",
                  color: "var(--text-dark)",
                }}
              >
                Security Level 5
              </h3>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--text-light)",
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                Maximum security clearance required. All activities are
                monitored and logged.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #E2EBE7",
          background: "var(--primary-dark)",
          color: "var(--white)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.84rem",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
            }}
          >
            &copy; {currentYear} St. Elizabeth Hospital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
