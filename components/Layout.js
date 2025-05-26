// Layout.js - Modern responsive layout component
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const isActive = (path) => router.pathname === path;

  const navItems = [
    { href: "/", icon: "📅", label: "Daily", title: "Daily Panchangam" },
    { href: "/special-days", icon: "🌕", label: "Special", title: "Special Days" },
    { href: "/rs-nakshatra", icon: "⚠️", label: "RS Days", title: "RS Nakshatra Days" },
    { href: "/auspicious-finder", icon: "🔍", label: "Find Time", title: "Auspicious Time Finder" },
    { href: "/moon-phases", icon: "🌙", label: "Moon", title: "Moon Phases" },
    { href: "/my-nakshatra", icon: "👤", label: "My Star", title: "Personal Nakshatra" },
  ];

  return (
    <>
      <div className="app-layout">
        {/* Header */}
        <header className="app-header">
          <div className="header-container">
            <div className="title-section">
              <h1 className="app-title">✨ விஸ்வாவசு தமிழ் பஞ்சாங்கம் ✨</h1>
              <p className="app-subtitle">Vedic Calendar & Auspicious Timings</p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-container">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <div className="nav-container">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                  title={item.title}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {isActive(item.href) && <div className="active-indicator" />}
                </a>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <style jsx>{`
        :root {
          /* Light Theme */
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-tertiary: #94a3b8;
          --border-primary: #e2e8f0;
          --border-secondary: #cbd5e1;
          --accent-primary: #f59e0b;
          --accent-secondary: #3b82f6;
          --success: #10b981;
          --warning: #ef4444;
          --danger: #dc2626;

          /* Shadows */
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }

        [data-theme="dark"] {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --bg-tertiary: #334155;
          --text-primary: #f8fafc;
          --text-secondary: #cbd5e1;
          --text-tertiary: #94a3b8;
          --border-primary: #334155;
          --border-secondary: #475569;
        }

        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-secondary);
          max-width: 100vw;
          overflow-x: hidden;
        }

        /* Header Styles */
        .app-header {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-primary);
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(10px);
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .title-section {
          text-align: center;
          flex: 1;
        }

        .app-title {
          font-family: 'Noto Sans Tamil', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(1.125rem, 3.5vw, 1.5rem);
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          line-height: 1.2;
        }

        .app-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
          font-weight: 500;
        }

        .theme-toggle {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          padding: 0.5rem;
          font-size: 1.125rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          height: 2.5rem;
        }

        .theme-toggle:hover {
          background: var(--border-primary);
          transform: scale(1.05);
        }

        /* Main Content */
        .main-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding-bottom: 5rem; /* Space for bottom nav */
        }

        /* Bottom Navigation */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-primary);
          border-top: 1px solid var(--border-primary);
          box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
          z-index: 50;
          backdrop-filter: blur(10px);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0.5rem;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: var(--text-secondary);
          padding: 0.5rem 0.25rem;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          position: relative;
          min-width: 3.5rem;
          min-height: 3.5rem;
          gap: 0.125rem;
        }

        .nav-item:hover {
          color: var(--accent-primary);
          background: rgba(245, 158, 11, 0.1);
          transform: translateY(-1px);
        }

        .nav-item.active {
          color: var(--accent-primary);
          background: rgba(245, 158, 11, 0.15);
        }

        .nav-icon {
          font-size: 1.25rem;
          line-height: 1;
          margin-bottom: 0.125rem;
        }

        .nav-label {
          font-size: 0.625rem;
          font-weight: 600;
          text-align: center;
          line-height: 1;
          letter-spacing: 0.025em;
        }

        .active-indicator {
          position: absolute;
          top: -0.125rem;
          left: 50%;
          transform: translateX(-50%);
          width: 0.25rem;
          height: 0.25rem;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateX(-50%) scale(1.2);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .header-container {
            padding: 0.75rem 1rem;
          }

          .app-title {
            font-size: 1.125rem;
          }

          .app-subtitle {
            font-size: 0.6875rem;
          }

          .nav-container {
            padding: 0.375rem 0.5rem;
          }

          .nav-item {
            min-width: 3rem;
            min-height: 3rem;
            padding: 0.375rem 0.125rem;
          }

          .nav-icon {
            font-size: 1.125rem;
          }

          .nav-label {
            font-size: 0.575rem;
          }

          .main-container {
            padding-bottom: 4.5rem;
          }
        }

        @media (max-width: 480px) {
          .nav-container {
            justify-content: space-between;
            padding: 0.25rem 0.5rem;
          }

          .nav-item {
            min-width: 2.75rem;
            min-height: 2.75rem;
            padding: 0.25rem 0.125rem;
          }

          .nav-icon {
            font-size: 1rem;
          }

          .nav-label {
            font-size: 0.55rem;
          }

          .main-container {
            padding-bottom: 4rem;
          }
        }

        /* Safe area adjustments for mobile devices */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .bottom-nav {
            padding-bottom: env(safe-area-inset-bottom);
          }

          .main-container {
            padding-bottom: calc(5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}