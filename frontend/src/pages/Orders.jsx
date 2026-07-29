import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Orders({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [search, setSearch] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/orders`).then(res => res.json()),
      fetch(`${API_BASE_URL}/customers`).then(res => res.json()),
      fetch(`${API_BASE_URL}/products`).then(res => res.json())
    ])
      .then(([ordersData, customersData, productsData]) => {
        setOrders(ordersData);
        setCustomers(customersData);
        setProducts(productsData);
        setLoading(false);
      })
      .catch(err => {
        showToast('Failed to load data: ' + err.message, 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    if (customers.length === 0) {
      showToast('You must add at least one customer before creating an order.', 'error');
      return;
    }
    if (products.length === 0) {
      showToast('You must add at least one product before creating an order.', 'error');
      return;
    }
    setSelectedCustomerId(customers[0].id.toString());
    setOrderItems([{ product_id: products[0].id.toString(), quantity: 1 }]);
    setIsAddOpen(true);
  };

  const handleOpenDetail = (orderId) => {
    fetch(`${API_BASE_URL}/orders/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load order details');
        return res.json();
      })
      .then(data => {
        setCurrentOrder(data);
        setIsDetailOpen(true);
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    if (field === 'quantity') {
      newItems[index][field] = parseInt(value) || 1;
    } else {
      newItems[index][field] = value;
    }
    setOrderItems(newItems);
  };

  const handleAddItemRow = () => {
    // Default to first product that is not already selected (if possible) or just first product
    const selectedIds = orderItems.map(item => item.product_id);
    const remainingProduct = products.find(p => !selectedIds.includes(p.id.toString()));
    const defaultProductId = remainingProduct ? remainingProduct.id.toString() : products[0].id.toString();

    setOrderItems([...orderItems, { product_id: defaultProductId, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) {
      showToast('An order must have at least one product item.', 'error');
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Compute live client-side total
  const computeTotal = () => {
    let total = 0;
    orderItems.forEach(item => {
      const prod = products.find(p => p.id.toString() === item.product_id);
      if (prod) {
        total += prod.price * item.quantity;
      }
    });
    return total;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }

    // Client-side validations
    for (const item of orderItems) {
      if (!item.product_id) {
        showToast('Please select a product for all items', 'error');
        return;
      }
      const prod = products.find(p => p.id.toString() === item.product_id);
      if (!prod) {
        showToast('Selected product not found', 'error');
        return;
      }

      // Check duplicate product selections in the order
      const dupCount = orderItems.filter(i => i.product_id === item.product_id).length;

      // Calculate total quantity requested for this product
      const totalReq = orderItems
        .filter(i => i.product_id === item.product_id)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (prod.quantity < totalReq) {
        showToast(`Insufficient stock for product '${prod.name}'. In stock: ${prod.quantity}. Requested total: ${totalReq}.`, 'error');
        return;
      }
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: orderItems.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity
      }))
    };

    fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to place order');
        return data;
      })
      .then(() => {
        showToast('Order placed successfully!', 'success');
        setIsAddOpen(false);
        fetchData();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will restore the stock levels.')) return;

    fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to cancel order');
        return data;
      })
      .then(() => {
        showToast('Order cancelled and stock restored successfully!', 'success');
        fetchData();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleSort = (field) => {
    if (sortBy === `${field}-asc`) {
      setSortBy(`${field}-desc`);
    } else if (sortBy === `${field}-desc`) {
      setSortBy('');
    } else {
      setSortBy(`${field}-asc`);
    }
  };

  const getItemsCount = (order) => {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = search.toLowerCase();
    const customerName = order.customer?.name?.toLowerCase() || '';
    const customerEmail = order.customer?.email?.toLowerCase() || '';
    const orderIdStr = `#ord-${order.id}`.toLowerCase();
    const rawOrderIdStr = `${order.id}`;

    return customerName.includes(searchLower) || 
           customerEmail.includes(searchLower) || 
           orderIdStr.includes(searchLower) ||
           rawOrderIdStr.includes(searchLower);
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'items-asc') {
      return getItemsCount(a) - getItemsCount(b);
    } else if (sortBy === 'items-desc') {
      return getItemsCount(b) - getItemsCount(a);
    } else if (sortBy === 'amount-asc') {
      return a.total_amount - b.total_amount;
    } else if (sortBy === 'amount-desc') {
      return b.total_amount - a.total_amount;
    }
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Create orders, review sales, and cancel orders.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} id="btn-add-order">
          <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Order
        </button>
      </div>

      <div className="card">
        <div className="search-container">
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="Search by customer name, email or order ID..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            id="search-orders"
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }} className="stat-desc">Loading orders...</div>
        ) : sortedOrders.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p>{search ? 'No matching orders found.' : 'No orders found. Place an order to see it listed here.'}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Order Date</th>
                    <th onClick={() => handleSort('items')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        Items Count
                        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '12px', height: '12px', opacity: sortBy.startsWith('items') ? 1 : 0.4 }}>
                          {sortBy === 'items-asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                          ) : sortBy === 'items-desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          )}
                        </svg>
                      </div>
                    </th>
                    <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        Total Amount
                        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '12px', height: '12px', opacity: sortBy.startsWith('amount') ? 1 : 0.4 }}>
                          {sortBy === 'amount-asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                          ) : sortBy === 'amount-desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          )}
                        </svg>
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(order => (
                    <tr key={order.id} className="order-row" id={`order-row-${order.id}`}>
                      <td style={{ fontWeight: 700 }}>#ORD-{order.id}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{order.customer?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.email}</div>
                        </div>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{order.items?.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>${order.total_amount.toFixed(2)}</td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-secondary btn-icon-only view-order-btn"
                            onClick={() => handleOpenDetail(order.id)}
                            title="View Order Details"
                            id={`btn-view-order-${order.id}`}
                          >
                            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-danger btn-icon-only cancel-order-btn"
                            onClick={() => handleDelete(order.id)}
                            title="Cancel/Delete Order"
                            id={`btn-delete-order-${order.id}`}
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
                  Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedOrders.length)} of {sortedOrders.length} entries
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

      {/* Add Order Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">Create New Order</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} id="create-order-form">
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  id="select-customer"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Order Items</h4>
              </div>

              <div className="order-items-header">
                <span>PRODUCT</span>
                <span>UNIT PRICE</span>
                <span>QTY</span>
                <span></span>
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {orderItems.map((item, index) => {
                  const currentProd = products.find(p => p.id.toString() === item.product_id);
                  return (
                    <div className="order-item-row" key={index}>
                      <select
                        className="form-select"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        required
                        id={`select-product-${index}`}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                            {p.name} (SKU: {p.sku}) {p.quantity <= 0 ? '[OUT OF STOCK]' : `[Stock: ${p.quantity}]`}
                          </option>
                        ))}
                      </select>

                      <div className="form-input" style={{ borderStyle: 'dashed', textAlign: 'center' }}>
                        {currentProd ? `$${currentProd.price.toFixed(2)}` : '$0.00'}
                      </div>

                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max={currentProd ? currentProd.quantity : 1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        id={`input-item-qty-${index}`}
                      />

                      <button
                        type="button"
                        className="btn btn-danger btn-icon-only"
                        onClick={() => handleRemoveItemRow(index)}
                        id={`btn-remove-item-${index}`}
                      >
                        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleAddItemRow} id="btn-add-item-row" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  + Add Another Item
                </button>
              </div>

              <div className="order-total-display">
                <span>Estimated Total:</span>
                <span className="order-total-price" id="order-est-total">${computeTotal().toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-submit-order">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {isDetailOpen && currentOrder && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">Order Details: #ORD-{currentOrder.id}</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="order-details-grid">
              <div>
                <div className="order-info-label">Customer Info</div>
                <div className="order-info-value" style={{ marginBottom: '0.5rem' }}>{currentOrder.customer?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentOrder.customer?.email}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentOrder.customer?.phone || 'No phone'}</div>
              </div>
              <div>
                <div className="order-info-label">Order Metadata</div>
                <div className="order-info-value" style={{ marginBottom: '0.5rem' }}>Date: {new Date(currentOrder.created_at).toLocaleString()}</div>
                <div className="order-info-value" style={{ color: 'var(--color-secondary)' }}>Total Paid: ${currentOrder.total_amount.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Items Ordered</h4>
            </div>

            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Product SKU</th>
                    <th>Product Name</th>
                    <th>Price at Order</th>
                    <th>Quantity</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product?.sku || 'UNKNOWN'}</td>
                      <td>{item.product?.name || 'Deleted Product'}</td>
                      <td>${item.price_at_order.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                        ${(item.price_at_order * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
