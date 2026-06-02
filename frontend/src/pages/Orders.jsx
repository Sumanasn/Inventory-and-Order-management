import React, { useState, useEffect } from 'react';
import { orderService, productService, customerService } from '../services/api';
import Notification from '../components/Notification';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  // Notification states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchOrders();
    fetchSupportData();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data);
    } catch (err) {
      triggerNotification('Could not download active order sheets from server.', 'error');
    }
  };

  const fetchSupportData = async () => {
    try {
      const prodRes = await productService.getAll();
      const custRes = await customerService.getAll();
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      triggerNotification('Failed to populate dropdown dependencies.', 'error');
    }
  };

  const triggerNotification = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  // Line-item helper operations
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = parseInt(value) || value;
    setItems(updatedItems);
  };

  const addLineItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const removeLineItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      triggerNotification('Please select a valid customer profile.', 'error');
      return;
    }

    // Filter out rows with unselected products
    const validItems = items.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      triggerNotification('An order sheet must contain at least one product line-item.', 'error');
      return;
    }

    // Validate quantities are positive numbers
    if (validItems.some(item => item.quantity <= 0)) {
      triggerNotification('All requested line-item quantities must be greater than zero.', 'error');
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: validItems
    };

    try {
      await orderService.create(payload);
      triggerNotification('Order dispatched and inventory quantities updated successfully.', 'success');
      setSelectedCustomerId('');
      setItems([{ product_id: '', quantity: 1 }]);
      fetchOrders();
      fetchSupportData(); // Reload stock dropdown numbers
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        // Captures backend guardrails such as "Insufficient stock for product..."
        triggerNotification(err.response.data.detail, 'error');
      } else {
        triggerNotification('An unexpected network error occurred while posting order.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you want to delete/cancel this order?')) return;
    try {
      await orderService.delete(id);
      triggerNotification('Order record deleted successfully.', 'success');
      fetchOrders();
      fetchSupportData(); // Reload updated items stock count values
    } catch (err) {
      triggerNotification('Failed to safely eliminate order record.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Order Processing & Dispatches</h2>
      
      <Notification message={message} type={messageType} onClose={() => setMessage('')} />

      {/* Interactive Form Panel */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#334155' }}>📦 Generate New Outbound Order</h3>
        <form onSubmit={handleSubmit}>
          
          {/* Customer Choice Row */}
          <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
            <label style={labelStyle}>Assign Client Profile</label>
            <select 
              value={selectedCustomerId} 
              onChange={(e) => setSelectedCustomerId(e.target.value)} 
              style={inputStyle}
            >
              <option value="">-- Choose Target Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          {/* Dynamic Item Form List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Product Line Items</label>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                  style={{ ...inputStyle, flex: '2' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} (SKU: {p.sku}) — Stock: {p.quantity} units [${p.price.toFixed(2)}]
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  style={{ ...inputStyle, width: '90px', flex: 'none' }}
                  placeholder="Qty"
                />

                <button 
                  type="button" 
                  onClick={() => removeLineItem(index)} 
                  style={removeBtnStyle}
                  disabled={items.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

            <button type="button" onClick={addLineItem} style={addItemBtnStyle}>
              ➕ Add Extra Line Item
            </button>
          </div>

          <button type="submit" style={submitBtnStyle}>Submit Complete Invoice</button>
        </form>
      </div>

      {/* Complete System Invoices Directory */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#334155' }}>System Ledger & Dispatched Invoices</h3>
        {orders.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>No orders have been generated in the ledger yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={cellStyle}>Order ID</th>
                <th style={cellStyle}>Customer ID</th>
                <th style={cellStyle}>Order Valuation</th>
                <th style={{ ...cellStyle, textAlign: 'right' }}>Ledger Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={cellStyle}>#{o.id}</td>
                  <td style={cellStyle}>Client ID: {o.customer_id}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold', color: '#047857' }}>
                    ${o.total_amount.toFixed(2)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <button onClick={() => handleDelete(o.id)} style={cancelBtnStyle}>Cancel Order</button>
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
const inputStyle = { padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const cellStyle = { padding: '0.75rem', fontSize: '0.95rem' };
const removeBtnStyle = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' };
const addItemBtnStyle = { background: 'none', border: '1px dashed #cbd5e1', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' };
const submitBtnStyle = { background: '#8b5cf6', color: '#fff', padding: '0.6rem 1.4rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', border: 'none', fontSize: '0.95rem' };
const cancelBtnStyle = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' };
