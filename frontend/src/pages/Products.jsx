import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    quantity: 0
  });

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'price' || name === 'quantity') ? (value === '' ? '' : name === 'price' ? parseFloat(value) : parseInt(value)) : value
    }));
  };

  const handleOpenDetail = (productId) => {
    fetch(`${API_BASE_URL}/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load product details');
        return res.json();
      })
      .then(data => {
        setCurrentProduct(data);
        setIsDetailOpen(true);
      })
      .catch(err => showToast(err.message, 'error'));
  };

  const handleOpenAdd = () => {
    setFormData({ sku: '', name: '', description: '', price: 0, quantity: 0 });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product) => {
    setCurrentProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      showToast('SKU and Product Name are required', 'error');
      return;
    }
    if (formData.price < 0 || formData.quantity < 0) {
      showToast('Price and quantity must be non-negative', 'error');
      return;
    }

    const payload = { ...formData, price: formData.price === '' ? 0 : formData.price, quantity: formData.quantity === '' ? 0 : formData.quantity };
    fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to create product');
        return data;
      })
      .then(() => {
        showToast('Product added successfully!', 'success');
        setIsAddOpen(false);
        fetchProducts();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      showToast('SKU and Product Name are required', 'error');
      return;
    }
    if (formData.price < 0 || formData.quantity < 0) {
      showToast('Price and quantity must be non-negative', 'error');
      return;
    }

    const payload = { ...formData, price: formData.price === '' ? 0 : formData.price, quantity: formData.quantity === '' ? 0 : formData.quantity };
    fetch(`${API_BASE_URL}/products/${currentProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update product');
        return data;
      })
      .then(() => {
        showToast('Product updated successfully!', 'success');
        setIsEditOpen(false);
        fetchProducts();
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to delete product');
        return data;
      })
      .then(() => {
        showToast('Product deleted successfully!', 'success');
        fetchProducts();
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

  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          product.sku.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'in-stock') {
      matchesStatus = product.quantity >= 10;
    } else if (statusFilter === 'low-stock') {
      matchesStatus = product.quantity > 0 && product.quantity < 10;
    } else if (statusFilter === 'out-of-stock') {
      matchesStatus = product.quantity === 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    } else if (sortBy === 'price-desc') {
      return b.price - a.price;
    } else if (sortBy === 'stock-asc') {
      return a.quantity - b.quantity;
    } else if (sortBy === 'stock-desc') {
      return b.quantity - a.quantity;
    }
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Add and configure products in the database.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} id="btn-add-product">
          <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <div className="card">
        <div className="search-container">
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="Search by name or SKU..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            id="search-products"
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }} className="stat-desc">Loading products...</div>
        ) : sortedProducts.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>No products found. Add some products to get started.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        Price
                        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '12px', height: '12px', opacity: sortBy.startsWith('price') ? 1 : 0.4 }}>
                          {sortBy === 'price-asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                          ) : sortBy === 'price-desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          )}
                        </svg>
                      </div>
                    </th>
                    <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        Stock Quantity
                        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '12px', height: '12px', opacity: sortBy.startsWith('stock') ? 1 : 0.4 }}>
                          {sortBy === 'stock-asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                          ) : sortBy === 'stock-desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          )}
                        </svg>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        Status
                        <span style={{ position: 'relative', display: 'inline-block', height: '14px' }}>
                          <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                              opacity: 0,
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              cursor: 'pointer'
                            }}
                            id="status-filter-select"
                          >
                            <option value="all">All Statuses</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                          </select>
                          <svg className="sidebar-icon" fill={statusFilter === 'all' ? 'none' : 'currentColor'} stroke="currentColor" viewBox="0 0 24 24" style={{ width: '14px', height: '14px', cursor: 'pointer', color: statusFilter === 'all' ? 'var(--text-muted)' : 'var(--color-primary)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </span>
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => (
                    <tr key={product.id} className="product-row" id={`product-row-${product.id}`}>
                      <td style={{ fontWeight: 700 }}>{product.sku}</td>
                      <td>{product.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{product.description || '-'}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>{product.quantity}</td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.quantity < 10 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-secondary btn-icon-only view-product-btn"
                            onClick={() => handleOpenDetail(product.id)}
                            title="View Product"
                            id={`btn-view-product-${product.id}`}
                          >
                            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            className="btn btn-secondary btn-icon-only edit-product-btn" 
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                            id={`btn-edit-product-${product.id}`}
                          >
                            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="btn btn-danger btn-icon-only delete-product-btn" 
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                            id={`btn-delete-product-${product.id}`}
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
                  Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedProducts.length)} of {sortedProducts.length} entries
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
      {isDetailOpen && currentProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Product Details</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div className="order-info-label">SKU</div>
                <div className="order-info-value">{currentProduct.sku}</div>
              </div>
              <div>
                <div className="order-info-label">Status</div>
                <div className="order-info-value">
                  {currentProduct.quantity === 0 ? (
                    <span className="badge badge-danger">Out of Stock</span>
                  ) : currentProduct.quantity < 10 ? (
                    <span className="badge badge-warning">Low Stock</span>
                  ) : (
                    <span className="badge badge-success">In Stock</span>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="order-info-label">Product Name</div>
                <div className="order-info-value">{currentProduct.name}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="order-info-label">Description</div>
                <div className="order-info-value" style={{ color: 'var(--text-muted)' }}>{currentProduct.description || 'No description'}</div>
              </div>
              <div>
                <div className="order-info-label">Price</div>
                <div className="order-info-value" style={{ color: 'var(--color-secondary)', fontSize: '1.25rem' }}>${currentProduct.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="order-info-label">Stock Quantity</div>
                <div className="order-info-value" style={{ fontSize: '1.25rem' }}>{currentProduct.quantity}</div>
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
              <h3 className="modal-title">Add New Product</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} id="add-product-form">
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input 
                  type="text" 
                  name="sku" 
                  className="form-input" 
                  placeholder="e.g. PROD-101" 
                  required 
                  value={formData.sku} 
                  onChange={handleInputChange}
                  id="input-sku"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  placeholder="e.g. Ergonomic Office Chair" 
                  required 
                  value={formData.name} 
                  onChange={handleInputChange}
                  id="input-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  className="form-input" 
                  placeholder="Brief details about the product" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  id="input-description"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    className="form-input" 
                    min="0" 
                    required 
                    value={formData.price} 
                    onChange={handleInputChange}
                    id="input-price"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock *</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    className="form-input" 
                    min="0" 
                    required 
                    value={formData.quantity} 
                    onChange={handleInputChange}
                    id="input-quantity"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-save-product">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Product: {currentProduct?.name}</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}>
                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} id="edit-product-form">
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input 
                  type="text" 
                  name="sku" 
                  className="form-input" 
                  required 
                  value={formData.sku} 
                  onChange={handleInputChange}
                  id="edit-sku"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  required 
                  value={formData.name} 
                  onChange={handleInputChange}
                  id="edit-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  className="form-input" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  id="edit-description"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    className="form-input" 
                    min="0" 
                    required 
                    value={formData.price} 
                    onChange={handleInputChange}
                    id="edit-price"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    className="form-input" 
                    min="0" 
                    required 
                    value={formData.quantity} 
                    onChange={handleInputChange}
                    id="edit-quantity"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-update-product">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
