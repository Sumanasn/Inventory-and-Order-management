import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Function to dynamically switch the central view panel
  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'products':  return <Products />;
      case 'customers': return <Customers />;
      case 'orders':    return <Orders />;
      default:          return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'products', label: '📦 Products' },
    { id: 'customers', label: '👤 Customers' },
    { id: 'orders', label: '🛒 Orders' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* GLOBAL NAVBAR HEADER */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>
          📦 IMS Enterprise <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal' }}>v1.0</span>
        </h1>
        
        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }}
          className="mobile-toggle-btn"
        >
          ☰
        </button>

        {/* Desktop Top Nav Layout Links */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '1rem' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                background: currentTab === item.id ? '#334155' : 'none',
                color: currentTab === item.id ? '#fff' : '#cbd5e1',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* MOBILE BREAKDOWN MENU */}
      {mobileMenuOpen && (
        <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '0.5rem 1rem' }} className="mobile-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setMobileMenuOpen(false);
              }}
              style={{
                background: 'none',
                color: currentTab === item.id ? '#38bdf8' : '#cbd5e1',
                border: 'none',
                padding: '0.75rem 0',
                textAlign: 'left',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* MAIN VIEW WORKSPACE PANEL */}
      <main style={{ flex: '1', padding: '2rem 1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {renderActivePage()}
      </main>

      {/* FOOTER METRIC BRAND */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
        Inventory & Order Management System Engine • Managed Container Deployment
      </footer>

      {/* Embedded CSS Media Query block to handle strict Mobile Responsiveness without tailwind dependencies */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
