import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="stat-desc">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
        <div style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>Error</div>
        <p className="stat-desc">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text">
          <h1>Welcome Back, Inventory Manager!</h1>
          <p>
            Here is a real-time overview of your store's performance. Monitor product quantities,
            manage customer records, and review order fulfillment targets below.
          </p>
        </div>
        <div className="welcome-badge">
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          System Healthy
        </div>
      </div>

      {/* Asymmetric Split Layout */}
      <div className="dashboard-layout-split">
        
        {/* Main Column */}
        <div className="dashboard-main-col">
          
          {/* Stats Cards Grid (2x2 inside column) */}
          <div className="dashboard-grid" style={{ marginBottom: '0' }}>
            <div className="card stat-card large" onClick={() => setPage('products')} style={{ cursor: 'pointer' }} id="stat-products">
              <div className="stat-header">
                <span>PRODUCTS</span>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="stat-value">{stats.total_products}</div>
              <div className="stat-desc">Active in catalog</div>
            </div>

            <div className="card stat-card secondary large" onClick={() => setPage('customers')} style={{ cursor: 'pointer' }} id="stat-customers">
              <div className="stat-header">
                <span>CUSTOMERS</span>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="stat-value">{stats.total_customers}</div>
              <div className="stat-desc">Registered accounts</div>
            </div>

            <div className="card stat-card large" onClick={() => setPage('orders')} style={{ cursor: 'pointer' }} id="stat-orders">
              <div className="stat-header">
                <span>ORDERS</span>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="stat-value">{stats.total_orders}</div>
              <div className="stat-desc">Processed transactions</div>
            </div>

            <div className="card stat-card danger large" style={{ borderColor: stats.low_stock_products.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)' }} id="stat-low-stock">
              <div className="stat-header">
                <span>LOW STOCK</span>
                <svg className="sidebar-icon" style={{ stroke: 'var(--color-warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="stat-value" style={{ color: stats.low_stock_products.length > 0 ? 'var(--color-warning)' : 'inherit' }}>
                {stats.low_stock_products.length}
              </div>
              <div className="stat-desc">Alert limit &lt; 10</div>
            </div>
          </div>

        </div>

        {/* Side Column */}
        <div className="dashboard-side-col" style={{ height: '100%' }}>
          
          {/* Low Stock Alerts */}
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Low Stock Alert</h2>
              <p className="stat-desc">{stats.low_stock_products.length} replenishments required</p>
            </div>

            {stats.low_stock_products.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: 'var(--color-secondary)', width: '36px', height: '36px', margin: '0 auto 1rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: 'var(--color-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>All items stocked!</p>
              </div>
            ) : (
              <div className="low-stock-scroll-container">
                <div className="low-stock-list">
                  {stats.low_stock_products.map(product => (
                    <div className="low-stock-item" key={product.id} style={{ padding: '0.75rem 1rem' }}>
                      <div className="low-stock-info" style={{ gap: '0.75rem' }}>
                        <span className="low-stock-badge" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>{product.sku}</span>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>{product.name}</h4>
                          <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-danger)' }}>{product.quantity} left</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
