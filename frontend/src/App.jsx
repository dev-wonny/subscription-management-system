import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    Settings,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    X,
    CreditCard,
    Calendar,
    User,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    CircleDollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1';

const App = () => {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
    const [loading, setLoading] = useState(false);
    const [monthInputType, setMonthInputType] = useState('text');
    const [filters, setFilters] = useState({
        billing_month: '',
        payment_status: '',
        customer_id: '',
        sort_by: 'issued_at',
        sort_order: 'desc'
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'plans'

    // Data for selects
    const [customers, setCustomers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        fetchInvoices();
        fetchInitialData();
    }, [filters, pagination.current_page]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/invoices`, {
                params: { ...filters, page: pagination.current_page }
            });
            setInvoices(response.data.data.invoices);
            setPagination(response.data.data.pagination);
        } catch (err) {
            showToast('Error fetching invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [custRes, planRes, subRes] = await Promise.all([
                axios.get(`${API_BASE}/customers`),
                axios.get(`${API_BASE}/plans?all=true`),
                axios.get(`${API_BASE}/subscriptions`)
            ]);
            setCustomers(custRes.data.data);
            setPlans(planRes.data.data);
            setSubscriptions(subRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const openEditModal = (subId) => {
        const sub = subscriptions.find(s => s.subscription_id === subId);
        setSelectedSub(sub);
        setShowEditModal(true);
    };

    const openStatusModal = (invoice) => {
        setSelectedInvoice(invoice);
        setShowStatusModal(true);
    };

    const handleSort = (field) => {
        const isAsc = filters.sort_by === field && filters.sort_order === 'asc';
        setFilters({
            ...filters,
            sort_by: field,
            sort_order: isAsc ? 'desc' : 'asc'
        });
    };

    const handleReset = () => {
        setFilters({
            billing_month: '',
            payment_status: '',
            customer_id: '',
            sort_by: 'issued_at',
            sort_order: 'desc'
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const SortIcon = ({ field }) => {
        if (filters.sort_by !== field) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        return filters.sort_order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    return (
        <div className="container">
            <div className="header-actions">
                <div>
                    <h1>Subscription & Bill</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.5rem 0',
                                color: activeTab === 'invoices' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'invoices' ? '2px solid var(--primary)' : 'none',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >Invoices</button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.5rem 0',
                                color: activeTab === 'plans' ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === 'plans' ? '2px solid var(--primary)' : 'none',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >Plans Management</button>
                    </div>
                </div>
                {activeTab === 'invoices' && (
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> New Subscription
                    </button>
                )}
            </div>

            {activeTab === 'invoices' ? (
                <div className="card">
                    <div className="filters">
                        <div className="filter-group">
                            <label>Billing Month</label>
                            <input
                                type={monthInputType === 'month' || filters.billing_month ? 'month' : 'text'}
                                value={filters.billing_month}
                                onChange={e => setFilters({ ...filters, billing_month: e.target.value })}
                                onFocus={() => setMonthInputType('month')}
                                onBlur={() => setMonthInputType('text')}
                                placeholder="Select Month"
                            />
                        </div>
                        <div className="filter-group">
                            <label>Status</label>
                            <select value={filters.payment_status} onChange={e => setFilters({ ...filters, payment_status: e.target.value })}>
                                <option value="">All Statuses</option>
                                <option value="PAID">PAID</option>
                                <option value="PENDING">PENDING</option>
                                <option value="FAILED">FAILED</option>
                                <option value="REFUNDED">REFUNDED</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Customer</label>
                            <select value={filters.customer_id} onChange={e => setFilters({ ...filters, customer_id: e.target.value })}>
                                <option value="">All Customers</option>
                                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={handleReset} title="Reset Filters">
                                <RotateCcw size={16} /> Reset
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Customer <SortIcon field="customer_name" />
                                    </th>
                                    <th onClick={() => handleSort('plan_name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Plan <SortIcon field="plan_name" />
                                    </th>
                                    <th onClick={() => handleSort('billing_month')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Billing Month <SortIcon field="billing_month" />
                                    </th>
                                    <th>Amount</th>
                                    <th onClick={() => handleSort('payment_status')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Payment <SortIcon field="payment_status" />
                                    </th>
                                    <th>Sub Status</th>
                                    <th onClick={() => handleSort('due_date')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        Due Date <SortIcon field="due_date" />
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.invoice_id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{invoice.customer.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{invoice.customer.email}</div>
                                        </td>
                                        <td>{invoice.plan.plan_name}</td>
                                        <td>{invoice.billing_month}</td>
                                        <td>₩{parseFloat(invoice.amount).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge badge-${invoice.payment_status.toLowerCase()}`}>
                                                {invoice.payment_status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${invoice.subscription_status?.toLowerCase() || 'unknown'}`} style={{ opacity: 0.85 }}>
                                                {invoice.subscription_status}
                                            </span>
                                        </td>
                                        <td>{format(new Date(invoice.due_date), 'yyyy-MM-dd')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => openEditModal(invoice.subscription_id)} title="Subscription Settings">
                                                    <Settings size={16} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => openStatusModal(invoice)} title="Quick Payment Update">
                                                    <CircleDollarSign size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="pagination">
                        <button
                            className="page-btn"
                            disabled={pagination.current_page === 1}
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(pagination.total_pages)].map((_, i) => (
                            <button
                                key={i}
                                className={`page-btn ${pagination.current_page === i + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="page-btn"
                            disabled={pagination.current_page === pagination.total_pages}
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <PlanManagement plans={plans} fetchPlans={fetchInitialData} showToast={showToast} />
            )}

            {showAddModal && (
                <AddSubscriptionModal
                    onClose={() => setShowAddModal(false)}
                    customers={customers}
                    plans={plans}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchInvoices();
                        fetchInitialData();
                        showToast('Subscription added successfully');
                    }}
                />
            )}

            {showEditModal && selectedSub && (
                <EditSubscriptionModal
                    sub={selectedSub}
                    plans={plans}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchInvoices();
                        fetchInitialData();
                        showToast('Subscription modified successfully');
                    }}
                />
            )}

            {showStatusModal && selectedInvoice && (
                <PaymentStatusModal
                    invoice={selectedInvoice}
                    onClose={() => setShowStatusModal(false)}
                    onSuccess={() => {
                        setShowStatusModal(false);
                        fetchInvoices();
                        showToast('Payment status updated successfully');
                    }}
                />
            )}

            {toast && (
                <div className="toast-container">
                    <div className="toast" style={{ borderLeftColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                        {toast.type === 'error' ? <AlertCircle size={20} color="var(--danger)" /> : <CheckCircle2 size={20} color="var(--success)" />}
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
};

const AddSubscriptionModal = ({ onClose, onSuccess, customers, plans }) => {
    const [formData, setFormData] = useState({
        customer_id: '',
        plan_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method_token: '',
        status: 'ACTIVE'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/subscriptions/add`, formData);
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Error adding subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">New Subscription</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label><User size={14} style={{ marginRight: '4px' }} /> Customer</label>
                        <select required value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}>
                            <option value="">Select Customer</option>
                            {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.email})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label><Package size={14} style={{ marginRight: '4px' }} /> Plan</label>
                        <select required value={formData.plan_id} onChange={e => setFormData({ ...formData, plan_id: e.target.value })}>
                            <option value="">Select Plan</option>
                            {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.plan_name} - ₩{parseFloat(p.monthly_price).toLocaleString()}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label><Calendar size={14} style={{ marginRight: '4px' }} /> Start Date</label>
                        <input type="date" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label><CreditCard size={14} style={{ marginRight: '4px' }} /> Payment Token</label>
                        <input type="text" placeholder="tok_..." value={formData.payment_method_token} onChange={e => setFormData({ ...formData, payment_method_token: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400 }}>
                                <input type="radio" style={{ width: 'auto' }} checked={formData.status === 'ACTIVE'} onChange={() => setFormData({ ...formData, status: 'ACTIVE' })} /> ACTIVE
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400 }}>
                                <input type="radio" style={{ width: 'auto' }} checked={formData.status === 'TRIAL'} onChange={() => setFormData({ ...formData, status: 'TRIAL' })} /> TRIAL
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Saving...' : 'Create Subscription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditSubscriptionModal = ({ sub, plans, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
        status: sub.status,
        payment_method_token: sub.payment_method_token || '',
        end_date: sub.end_date || ''
    });
    const [loading, setLoading] = useState(false);
    const [diffMsg, setDiffMsg] = useState('');

    useEffect(() => {
        if (formData.plan_id != sub.plan_id) {
            const oldPlan = plans.find(p => p.plan_id == sub.plan_id);
            const newPlan = plans.find(p => p.plan_id == formData.plan_id);
            if (oldPlan && newPlan) {
                const diff = parseFloat(newPlan.monthly_price) - parseFloat(oldPlan.monthly_price);
                if (diff > 0) {
                    setDiffMsg(`⚠️ Plan Upgrade: ₩${diff.toLocaleString()} will be charged.`);
                } else if (diff < 0) {
                    setDiffMsg(`Notice: Plan Downgrade (₩${Math.abs(diff).toLocaleString()} cheaper)`);
                } else {
                    setDiffMsg('');
                }
            }
        } else {
            setDiffMsg('');
        }
    }, [formData.plan_id, plans, sub.plan_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.status === 'CANCELED' && !formData.end_date) {
            alert('End date is required for cancellation');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/subscriptions/modify`, formData);
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Error modifying subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Modify Subscription</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Customer</label>
                        <div className="card" style={{ padding: '0.75rem', marginBottom: 0, background: 'var(--bg-main)' }}>
                            <strong>{sub.customer_name}</strong>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Plan</label>
                        <select required value={formData.plan_id} onChange={e => setFormData({ ...formData, plan_id: e.target.value })}>
                            {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.plan_name} - ₩{parseFloat(p.monthly_price).toLocaleString()}</option>)}
                        </select>
                    </div>
                    {diffMsg && <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 600 }}>{diffMsg}</div>}
                    <div className="form-group">
                        <label>Status</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PAUSED">PAUSED</option>
                            <option value="TRIAL">TRIAL</option>
                            <option value="CANCELED">CANCELED</option>
                        </select>
                    </div>
                    {formData.status === 'CANCELED' && (
                        <div className="form-group">
                            <label>Termination Date</label>
                            <input type="date" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Payment Token (Subscription Default)</label>
                        <input
                            type="text"
                            placeholder="e.g. tok_visa_1234"
                            value={formData.payment_method_token}
                            onChange={e => setFormData({ ...formData, payment_method_token: e.target.value })}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Changing this will apply to future invoices.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PlanManagement = ({ plans, fetchPlans, showToast }) => {
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Service Plans</h2>
                <button className="btn btn-primary" onClick={() => setShowAddPlan(true)}>
                    <Plus size={18} /> Add New Plan
                </button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Plan Name</th>
                        <th>Billing Cycle</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map(plan => (
                        <tr key={plan.plan_id}>
                            <td style={{ fontWeight: 600 }}>{plan.plan_name}</td>
                            <td>{plan.billing_cycle}</td>
                            <td>₩{parseFloat(plan.monthly_price).toLocaleString()}</td>
                            <td>
                                <span className={`badge badge-${plan.is_active ? 'active' : 'canceled'}`}>
                                    {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </td>
                            <td>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setEditingPlan(plan)}>
                                    <Settings size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {(showAddPlan || editingPlan) && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => { setShowAddPlan(false); setEditingPlan(null); }}
                    onSuccess={() => {
                        setShowAddPlan(false);
                        setEditingPlan(null);
                        fetchPlans();
                        showToast(editingPlan ? 'Plan updated' : 'Plan created');
                    }}
                />
            )}
        </div>
    );
};

const PlanModal = ({ plan, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(plan ? {
        plan_name: plan.plan_name,
        monthly_price: plan.monthly_price,
        billing_cycle: plan.billing_cycle,
        is_active: plan.is_active
    } : {
        plan_name: '',
        monthly_price: '',
        billing_cycle: 'MONTHLY',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (plan) {
                await axios.put(`${API_BASE}/plans/${plan.plan_id}`, formData);
            } else {
                await axios.post(`${API_BASE}/plans`, formData);
            }
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Plan Name</label>
                        <input required type="text" value={formData.plan_name} onChange={e => setFormData({ ...formData, plan_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Billing Cycle</label>
                        <select value={formData.billing_cycle} onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}>
                            <option value="MONTHLY">MONTHLY</option>
                            <option value="ANNUAL">ANNUAL</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Monthly Price (₩)</label>
                        <input required type="number" value={formData.monthly_price} onChange={e => setFormData({ ...formData, monthly_price: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: 'auto' }} />
                            Active Plan
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Saving...' : (plan ? 'Update Plan' : 'Create Plan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PaymentStatusModal = ({ invoice, onClose, onSuccess }) => {
    const [status, setStatus] = useState(invoice.payment_status || 'PENDING');
    const [loading, setLoading] = useState(false);

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/invoices/update-status`, {
                invoice_id: invoice.invoice_id,
                payment_status: status
            });
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Update Payment Status</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Update payment for <strong>{invoice.customer.name}</strong> ({invoice.billing_month})
                    </p>
                    <div className="form-group">
                        <label htmlFor="payment-status-select">Payment Status</label>
                        <select
                            id="payment-status-select"
                            value={status}
                            onChange={handleStatusChange}
                        >
                            <option value="PAID">PAID (Completed)</option>
                            <option value="PENDING">PENDING (Awaiting)</option>
                            <option value="FAILED">FAILED (Error)</option>
                            <option value="REFUNDED">REFUNDED</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default App;
