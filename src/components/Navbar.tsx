import { Link, useLocation } from 'react-router-dom';
import { Building2, Search, Shield, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAdminLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Building2 size={26} />
          <div className="brand-text">
            <span className="brand-main">Karimnagar</span>
            <span className="brand-sub">Business Marketplace</span>
          </div>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <Search size={15} />
            Browse
          </Link>

          {isAdminLoggedIn ? (
            <>
              <Link
                to="/admin"
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Shield size={15} />
                Admin Panel
              </Link>
              <button
                className="nav-link btn-logout"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className={`nav-link nav-admin ${isActive('/admin/login') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Shield size={15} />
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
