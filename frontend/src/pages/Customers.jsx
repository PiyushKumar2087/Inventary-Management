import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/customers`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load customers');
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '' });
    setIsAddOpen(true);
  };

  const handleOpenDetail = (customerId) => {
    fetch(`${API_BASE_URL}/customers/${customerId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load customer details');
        return res.json();
      })
      .then(data => {
        setCurrentCustomer(data);
        setIsDetailOpen(true);
      })
      .catch(err => showToast(err.message, 'error'));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Name and Email are required', 'error');
      return;
    }
    if (formData.phone) {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 12) {
        showToast('Phone number must contain exactly 10 or 12 digits', 'error');
        return;
      }
    }

    fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to create customer');
        return data;
      })
      .then(() => {
        showToast('Customer added successfully!', 'success');
        setIsAddOpen(false);
        fetchCustomers();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? All their orders will be deleted as well.')) return;

    fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to delete customer');
        return data;
      })
      .then(() => {
        showToast('Customer deleted successfully!', 'success');
        fetchCustomers();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer accounts and details.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} id="btn-add-customer">
          <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      <div className="card">
        <div className="search-container">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by name, email or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-customers"
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }} className="stat-desc">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No customers found. Add some customers to get started.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map(customer => (
                    <tr key={customer.id} className="customer-row" id={`customer-row-${customer.id}`}>
                      <td style={{ fontWeight: 600 }}>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{customer.phone || '-'}</td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-secondary btn-icon-only view-customer-btn"
                            onClick={() => handleOpenDetail(customer.id)}
                            title="View Customer"
                            id={`btn-view-customer-${customer.id}`}
                          >
                            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-danger btn-icon-only delete-customer-btn"
                            onClick={() => handleDelete(customer.id)}
                            title="Delete Customer"
                            id={`btn-delete-customer-${customer.id}`}
                          >
                            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} entries
                </div>
                <div className="pagination-buttons">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i + 1} 
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailOpen && currentCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Customer Details</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="order-info-label">Full Name</div>
                <div className="order-info-value" style={{ fontSize: '1.15rem' }}>{currentCustomer.name}</div>
              </div>
              <div>
                <div className="order-info-label">Email Address</div>
                <div className="order-info-value">{currentCustomer.email}</div>
              </div>
              <div>
                <div className="order-info-label">Phone Number</div>
                <div className="order-info-value" style={{ color: currentCustomer.phone ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {currentCustomer.phone || 'Not provided'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Customer</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} id="add-customer-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Alice Johnson"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  id="input-customer-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="e.g. alice@example.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  id="input-customer-email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="e.g. +1 555-0199"
                  value={formData.phone}
                  onChange={handleInputChange}
                  id="input-customer-phone"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-save-customer">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
