import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('stockflow-theme') || 'default';
  });

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-emerald', 'theme-rose');
    if (theme !== 'default') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('stockflow-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const renderActivePage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard setPage={setPage} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'orders':
        return <Orders showToast={showToast} />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <svg className="sidebar-icon" style={{ width: '32px', height: '32px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top Face (Highlight) */}
            <path d="M12 3L21 7.5L12 12L3 7.5L12 3Z" fill="var(--color-primary)" opacity="0.85" />
            <path d="M12 3L21 7.5L12 12L3 7.5L12 3Z" fill="#ffffff" opacity="0.25" />
            
            {/* Left Face (Shadow) */}
            <path d="M3 7.5L12 12V21L3 16.5V7.5Z" fill="var(--color-primary)" />
            <path d="M3 7.5L12 12V21L3 16.5V7.5Z" fill="#000000" opacity="0.25" />
            
            {/* Right Face */}
            <path d="M12 12L21 7.5V16.5L12 21V12Z" fill="var(--color-primary)" opacity="0.95" />
            <path d="M12 12L21 7.5V16.5L12 21V12Z" fill="#000000" opacity="0.05" />

            {/* Package details - Tape on top */}
            <path d="M12 5.25L16.5 7.5L12 9.75L7.5 7.5L12 5.25Z" fill="#ffffff" opacity="0.3" />
            
            {/* Front vertical seam tape */}
            <path d="M12 9.75V21" stroke="#ffffff" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
            
            {/* Center junction dot */}
            <circle cx="12" cy="12" r="1" fill="#ffffff" opacity="0.9" />
          </svg>
          <span>Inventory Management System</span>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`sidebar-link ${page === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setPage('dashboard')}
            id="nav-dashboard"
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </div>

          <div 
            className={`sidebar-link ${page === 'products' ? 'active' : ''}`} 
            onClick={() => setPage('products')}
            id="nav-products"
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </div>

          <div 
            className={`sidebar-link ${page === 'customers' ? 'active' : ''}`} 
            onClick={() => setPage('customers')}
            id="nav-customers"
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Customers
          </div>

          <div 
            className={`sidebar-link ${page === 'orders' ? 'active' : ''}`} 
            onClick={() => setPage('orders')}
            id="nav-orders"
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Orders
          </div>
        </nav>

      </aside>

      {/* Main View Area */}
      <main className="main-content">
        {/* Theme Selector Dropdown */}
        <div className="theme-selector-container top-right">
          <svg className="theme-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-2.22 1.124l-3.13 3.833a1.5 1.5 0 001.16 2.447h13.32a1.5 1.5 0 001.16-2.447l-3.13-3.833a3 3 0 00-2.22-1.124H9.53zM12 3v13.122" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)} 
            className="theme-select-dropdown"
            title="Choose UI Theme"
          >
            <option value="default">Midnight Blue</option>
            <option value="light">Light Modern</option>
            <option value="emerald">Emerald Dark</option>
            <option value="rose">Retro Rose</option>
          </select>
        </div>

        <div style={{ flex: 1, paddingBottom: '2rem' }}>
          {renderActivePage()}
        </div>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Inventory Management System. All rights reserved.</p>
        </footer>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            {toast.type === 'success' ? (
              <svg className="sidebar-icon" style={{ stroke: 'var(--color-secondary)', width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
              </svg>
            ) : (
              <svg className="sidebar-icon" style={{ stroke: 'var(--color-danger)', width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
