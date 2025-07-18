import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import pool from '../../lib/db';
import { withAuth } from '../../lib/withAuth';
import { useRouter } from 'next/router';

const EditUserModal = ({ user, isOpen, onClose, onSave, onPromote }) => {
    const [formData, setFormData] = useState(user);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [promoteRole, setPromoteRole] = useState('student');
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    useEffect(() => {
        setFormData(user || {});
    }, [user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailsChange = (e) => {
        setFormData(prev => ({ ...prev, details: e.target.value }));
    };

    const handleDetailFieldChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [key]: value
            }
        }));
    };

    const addNewField = () => {
        if (newFieldKey.trim() && newFieldValue.trim()) {
            setFormData(prev => ({
                ...prev,
                details: {
                    ...prev.details,
                    [newFieldKey]: newFieldValue
                }
            }));
            setNewFieldKey('');
            setNewFieldValue('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let details;
        try {
            details = formData.details || {};
        } catch (error) {
            setMessage({ text: 'JSON في حقل التفاصيل غير صالح.', type: 'error' });
            return;
        }
        const result = await onSave({ ...formData, details });
        setMessage(result);
    };
    
    const handlePromote = async () => {
        if (!confirm(`هل أنت متأكد من ترقية هذا المستخدم إلى دور "${promoteRole}"؟`)) return;
        const result = await onPromote(user.id, promoteRole);
        setMessage(result);
    };

    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <span className="close-button" onClick={onClose}>×</span>
                <h2>تعديل بيانات المستخدم</h2>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={formData?.id || ''} />
                    <div className="form-group">
                        <label>الاسم الكامل</label>
                        <input type="text" name="full_name" value={formData?.full_name || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" name="email" value={formData?.email || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>رقم الهاتف</label>
                        <input type="tel" name="phone" value={formData?.phone || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>الدور</label>
                        <select name="role" value={formData?.role || ''} onChange={handleChange} required>
                            <option value="student">student</option>
                            <option value="parent">parent</option>
                            <option value="teacher">teacher</option>
                            <option value="worker">worker</option>
                            <option value="head">head</option>
                            <option value="finance">finance</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>تفاصيل إضافية (JSON)</label>
                        <div className="details-editor">
                            {formData.details && typeof formData.details === 'object' ? (
                                Object.entries(formData.details).map(([key, value]) => {
                                    const displayValue = Array.isArray(value) 
                                        ? value.join(', ') 
                                        : (typeof value === 'object' && value !== null)
                                            ? JSON.stringify(value)
                                            : String(value || '');
                                    
                                    return (
                                        <div key={key} className="detail-field">
                                            <label>{key}:</label>
                                            <input 
                                                type="text" 
                                                value={displayValue} 
                                                onChange={(e) => handleDetailFieldChange(key, e.target.value)}
                                            />
                                        </div>
                                    );
                                })
                            ) : null}
                        </div>
                        <div className="add-field">
                            <input 
                                type="text" 
                                placeholder="اسم الحقل الجديد"
                                value={newFieldKey}
                                onChange={(e) => setNewFieldKey(e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="قيمة الحقل"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                            />
                            <button type="button" onClick={addNewField}>إضافة حقل</button>
                        </div>
                    </div>
                    <hr style={{ margin: '20px 0' }} />
                    <button type="submit" className="btn-save">حفظ التعديلات</button>
                </form>
                <h4><i className="fas fa-level-up-alt"></i> ترقية المستخدم</h4>
                <div className="form-group">
                    <label>ترقية إلى دور جديد:</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="form-control" style={{ flexGrow: 1 }} value={promoteRole} onChange={e => setPromoteRole(e.target.value)}>
                            <option value="student">student</option>
                            <option value="parent">parent</option>
                            <option value="teacher">teacher</option>
                            <option value="worker">worker</option>
                            <option value="head">head</option>
                            <option value="finance">finance</option>
                            <option value="admin">admin</option>
                        </select>
                        <button type="button" onClick={handlePromote} className="btn btn-warning">ترقية الآن</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AdminUsersPage = ({ user, users }) => {
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = users.filter(u => {
            return u.full_name.toLowerCase().includes(lowercasedFilter) || u.email.toLowerCase().includes(lowercasedFilter);
        });
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const openEditModal = (userToEdit) => {
        setSelectedUser(userToEdit);
        setIsModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (userData) => {
        try {
            const response = await fetch(`/api/users/${userData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                setTimeout(closeEditModal, 1500);
                return { text: result.message, type: 'success' };
            } else {
                return { text: result.message, type: 'error' };
            }
        } catch (err) {
            return { text: 'خطأ في الاتصال أو صيغة JSON غير صحيحة.', type: 'error' };
        }
    };
    
    const handlePromoteUser = async (userId, newRole) => {
        try {
            const response = await fetch(`/api/users/${userId}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newRole })
            });
            const result = await response.json();
            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                return { text: result.message, type: 'success' };
            } else {
                return { text: result.message, type: 'error' };
            }
        } catch (err) {
            return { text: 'حدث خطأ في الاتصال.', type: 'error' };
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .table-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .search-box { width: 300px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
                .users-table { width: 100%; border-collapse: collapse; }
                .users-table th, .users-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
                .users-table th { background-color: #f7f9fc; font-weight: 600; }
                .action-btn { margin: 0 5px; cursor: pointer; border: none; background: none; font-size: 1rem; }
                .edit-btn { color: #3498db; }
                .modal { display: flex; justify-content: center; align-items: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.7); }
                .modal-content { background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; border-radius: 8px; width: 80%; max-width: 500px; }
                .close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
                .message.success { color: #155724; background-color: #d4edda; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
                .message.error { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
                .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                .details-editor { margin-bottom: 15px; }
                .detail-field { display: flex; align-items: center; margin-bottom: 10px; }
                .detail-field label { margin-right: 10px; min-width: 100px; }
                .detail-field input { flex: 1; }
                .add-field { display: flex; gap: 10px; margin-top: 10px; }
                .add-field input { flex: 1; }
                .btn-save { background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
                .btn-warning { background-color: #ffc107; color: #212529; }
                .form-control { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                .table-responsive-wrapper { overflow-x: auto; }
            `}</style>
            <h1><i className="fas fa-users-cog fa-fw"></i> إدارة المستخدمين</h1>
            <div className="table-container">
                <div className="table-controls">
                    <input 
                        type="text" 
                        className="search-box" 
                        placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="table-responsive-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>الاسم الكامل</th>
                                <th>البريد الإلكتروني</th>
                            <th>الهاتف</th>
                            <th>الدور</th>
                            <th>تاريخ التسجيل</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.full_name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone}</td>
                                <td>{u.role}</td>
                                <td>-</td>
                                <td>
                                    <button className="action-btn edit-btn" onClick={() => openEditModal(u)} title="تعديل">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            <EditUserModal 
                user={selectedUser}
                isOpen={isModalOpen}
                onClose={closeEditModal}
                onSave={handleSaveUser}
                onPromote={handlePromoteUser}
            />
        </Layout>
    );
};

export default AdminUsersPage;


export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const usersResult = await pool.query('SELECT id, full_name, email, phone, role, details FROM users ORDER BY id DESC');

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            users: usersResult.rows.map(u => JSON.parse(JSON.stringify({ ...u, details: u.details || {} })))
        }
    };
}, { roles: ['admin'] });