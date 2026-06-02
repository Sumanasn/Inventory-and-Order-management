import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import Notification from '../components/Notification';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // State variables for editing an existing item
  const [editingId, setEditingId] = useState(null);
  
  // Notification states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (err) {
      triggerNotification('Failed to download current product listings.', 'error');
    }
  };

  const triggerNotification = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setQuantity('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Front-end Form Validation Guardrails
    if (!name.trim() || !sku.trim() || !price || !quantity) {
      triggerNotification('Please complete all input fields before saving.', 'error');
      return;
    }
    if (parseFloat(price) < 0 || parseInt(quantity) < 0) {
      triggerNotification('Price and Stock Quantity cannot hold negative values.', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: parseFloat(price),
      quantity: parseInt(quantity)
    };

    try {
      if (editingId) {
        // Run PUT Update request
        await productService.update(editingId, payload);
        triggerNotification('Product records updated successfully.', 'success');
      } else {
        // Run POST Create request
        await productService.create(payload);
        triggerNotification('New inventory item registered successfully.', 'success');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        // Pulls custom unique constraints errors directly from our FastAPI exceptions
        triggerNotification(err.response.data.detail, 'error');
      } else {
        triggerNotification('An unexpected network error interrupted the action.', 'error');
      }
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price);
    setQuantity(product.quantity);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you want to delete this product?')) return;
    try {
      await productService.delete(id);
      triggerNotification('Product purged from inventory database.', 'success');
      fetchProducts();
      if (editingId === id) resetForm();
    } catch (err) {
      triggerNotification('Failed to safely remove product. It may be attached to existing orders.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Product & Inventory Control</h2>
      
      <Notification message={message} type={messageType} onClose={() => setMessage('')} />

      {/* Dynamic Creation / Modification Panel */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#334155' }}>
          {editingId ? '📝 Modify Item Details' : '➕ Register New Product'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Product Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Ergonomic Desk" />
          </div>
          <div>
            <label style={labelStyle}>Unique SKU Code</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} placeholder="e.g. DESK-001" />
          </div>
          <div>
            <label style={labelStyle}>Unit Price ($)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>Stock Quantity</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={btnStyle('#2563eb')}>{editingId ? 'Save Edits' : 'Add Item'}</button>
            {editingId && <button type="button" onClick={resetForm} style={btnStyle('#64748b')}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Main Records Spreadsheet View */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#334155' }}>Current Inventory Directory</h3>
        {products.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>No inventory records logged yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Product Name</th>
                <th style={cellStyle}>SKU</th>
                <th style={cellStyle}>Price</th>
                <th style={cellStyle}>Stock Level</th>
                <th style={{ ...cellStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={cellStyle}>{p.id}</td>
                  <td style={{ ...cellStyle, fontWeight: '500' }}>{p.name}</td>
                  <td style={cellStyle}><code>{p.sku}</code></td>
                  <td style={cellStyle}>${p.price.toFixed(2)}</td>
                  <td style={{ ...cellStyle, color: p.quantity <= 10 ? '#dc2626' : '#0f172a', fontWeight: p.quantity <= 10 ? 'bold' : 'normal' }}>
                    {p.quantity} units
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <button onClick={() => startEdit(p)} style={actionBtnStyle('#f59e0b')}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={actionBtnStyle('#ef4444')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const cellStyle = { padding: '0.75rem', fontSize: '0.95rem' };
const btnStyle = (bgColor) => ({ 
  background: bgColor,
  color: '#fff', 
  padding: '0.55rem 1rem', 
  borderRadius: '4px', 
  fontWeight: '600', 
  cursor: 'pointer', 
  border: 'none' 
});
const actionBtnStyle = (color) => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontWeight: '600', marginLeft: '0.75rem', fontSize: '0.9rem' });
