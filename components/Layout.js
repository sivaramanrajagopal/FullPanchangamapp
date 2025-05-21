// components/Layout.js
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();

  const isActive = (path) => (router.pathname === path ? "active" : "");

  return (
    <div className="app-container">
      <header className="header">
        <h1>✨ விஸ்வாவசு தமிழ் பஞ்சாங்கம் ✨</h1>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav">
        <Link href="/">
          <a className={`nav-item ${isActive("/")}`}>
            <span className="nav-icon">📅</span>
            <span className="nav-label">Daily</span>
          </a>
        </Link>
        <Link href="/special-days">
          <a className={`nav-item ${isActive("/special-days")}`}>
            <span className="nav-icon">🌕</span>
            <span className="nav-label">Special</span>
          </a>
        </Link>
        <Link href="/rs-nakshatra">
          <a className={`nav-item ${isActive("/rs-nakshatra")}`}>
            <span className="nav-icon">⚠️</span>
            <span className="nav-label">RS Days</span>
          </a>
        </Link>
        <Link href="/auspicious-finder">
          <a className={`nav-item ${isActive("/auspicious-finder")}`}>
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Find Time</span>
          </a>
        </Link>
        <Link href="/moon-phases">
          <a className={`nav-item ${isActive("/moon-phases")}`}>
            <span className="nav-icon">🌙</span>
            <span className="nav-label">Moon</span>
          </a>
        </Link>
        <Link href="/my-nakshatra">
          <a className={`nav-item ${isActive("/my-nakshatra")}`}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">My Star</span>
          </a>
        </Link>
      </nav>

      <style jsx>{`
        .app-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f5f5f5;
        }

        .header {
          text-align: center;
          padding: 15px 10px;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
          margin: 0;
          color: #4f46e5;
          font-size: 1.5rem;
        }

        .main-content {
          flex: 1;
          padding: 20px;
        }

        .bottom-nav {
          display: flex;
          justify-content: space-between;
          background-color: white;
          padding: 10px 15px;
          box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #666;
          font-size: 0.8rem;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .nav-item.active {
          color: #4f46e5;
        }

        .nav-icon {
          font-size: 1.5rem;
          margin-bottom: 3px;
        }

        .nav-label {
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}
