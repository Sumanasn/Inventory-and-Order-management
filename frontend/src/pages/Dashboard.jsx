import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import Notification from '../components/Notification';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      const response = await dashboardService.getSummary();
      setMetrics(response.data);
    } catch (err) {
      setError('Could not connect to the API server to pull real-time metrics.');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Operations Dashboard</h2>
      <Notification message={error} type="error" onClose={() => setError('')} />

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={cardStyle('#3b82f6')}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Products</h3>
          <p style={numberStyle}>{metrics.total_products}</p>
        </div>
        <div style={cardStyle('#10b981')}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Customers</h3>
          <p style={numberStyle}>{metrics.total_customers}</p>
        </div>
        <div style={cardStyle('#8b5cf6')}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Orders</h3>
          <p style={numberStyle}>{metrics.total_orders}</p>
        </div>
      </div>

      {/* Critical Stock Alert Log */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          ⚠️ Low Stock Alerts (≤ 10 Units Remaining)
        </h3>
        {metrics.low_stock_products.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>All warehouse inventory items are adequately stocked.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thTdStyle}>SKU</th>
                <th style={thTdStyle}>Product Title</th>
                <th style={thTdStyle}>Remaining Stock</th>
              </tr>
            </thead>
            <tbody>
              {metrics.low_stock_products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={thTdStyle}><code>{product.sku}</code></td>
                  <td style={thTdStyle}>{product.name}</td>
                  <td style={{ ...thTdStyle, color: '#dc2626', fontWeight: 'bold' }}>{product.quantity} units left</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const cardStyle = (borderColor) => ({
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  borderTop: `5px solid ${borderColor}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  borderLeft: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
});

const numberStyle = { fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#0f172a' };
const thTdStyle = { padding: '0.75rem', fontSize: '0.95rem' };
