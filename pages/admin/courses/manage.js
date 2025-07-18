import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';
import Link from 'next/link';
import { serializeDbRows, safeProps } from '../../../lib/serializer';

const CourseManagementPage = ({ user, courses: initialCourses }) => {
    const [courses, setCourses] = useState(initialCourses);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');

    const filteredCourses = courses.filter(course => {
        const matchesFilter = filter === 'all' || course.status === filter;
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ لن يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCourses(courses.filter(c => c.id !== courseId));
                setMessage('✅ تم حذف الدورة بنجاح');
            } else {
                setMessage('⚠️ خطأ في حذف الدورة');
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const handlePublishCourse = async (courseId) => {
        try {
            const response = await fetch(`/api/courses/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id: courseId })
            });

            if (response.ok) {
                setCourses(courses.map(c => 
                    c.id === courseId ? { ...c, status: 'published', is_published: true } : c
                ));
                setMessage('✅ تم نشر الدورة بنجاح');
            } else {
                setMessage('⚠️ خطأ في نشر الدورة');
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const handleLaunchCourse = async (courseId) => {
        if (!confirm('هل أنت متأكد من بدء انطلاق الدورة؟ لن يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/launch`, {
                method: 'POST'
            });

            if (response.ok) {
                setCourses(courses.map(c => 
                    c.id === courseId ? { ...c, status: 'active', is_launched: true } : c
                ));
                setMessage('✅ تم بدء انطلاق الدورة بنجاح');
            } else {
                setMessage('⚠️ خطأ في بدء انطلاق الدورة');
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const handleStatusChange = async (courseId, newStatus) => {
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setCourses(courses.map(c => 
                    c.id === courseId ? { ...c, status: newStatus } : c
                ));
                setMessage('✅ تم تحديث حالة الدورة بنجاح');
            } else {
                setMessage('⚠️ خطأ في تحديث حالة الدورة');
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const handleUnpublishCourse = async (courseId) => {
        if (!confirm('هل أنت متأكد من إلغاء نشر هذه الدورة؟ سيتم إلغاء جميع التسجيلات المعلقة.')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/unpublish`, {
                method: 'POST'
            });

            if (response.ok) {
                setCourses(courses.map(c => 
                    c.id === courseId ? { ...c, status: 'draft', is_published: false } : c
                ));
                setMessage('✅ تم إلغاء نشر الدورة بنجاح');
            } else {
                const result = await response.json();
                setMessage('⚠️ ' + (result.message || 'خطأ في إلغاء النشر'));
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': { text: 'مسودة', color: '#6c757d' },
            'published': { text: 'منشورة', color: '#007bff' },
            'active': { text: 'نشطة', color: '#28a745' },
            'completed': { text: 'مكتملة', color: '#17a2b8' }
        };
        
        const badge = badges[status] || badges['draft'];
        return (
            <span style={{ 
                background: badge.color, 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '0.8rem' 
            }}>
                {badge.text}
            </span>
        );
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .management-header { 
                    display: flex; justify-content: space-between; align-items: center; 
                    margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; 
                }
                .controls { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .search-input { 
                    padding: 10px; border: 1px solid #ddd; border-radius: 5px; 
                    width: 300px; font-family: var(--font-tajawal);
                }
                .filter-select { 
                    padding: 10px; border: 1px solid #ddd; border-radius: 5px; 
                    font-family: var(--font-tajawal);
                }
                .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
                .course-card { 
                    background: #fff; padding: 20px; border-radius: 8px; box-shadow: var(--shadow-md);
                    border-left: 4px solid var(--primary-color);
                }
                .course-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .course-title { margin: 0; color: var(--primary-color); font-size: 1.2rem; }
                .course-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
                .meta-item { display: flex; flex-direction: column; }
                .meta-label { font-size: 0.8rem; color: #6c757d; margin-bottom: 2px; }
                .meta-value { font-weight: 500; }
                .course-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 15px; }
                .btn { 
                    padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; 
                    font-size: 0.85rem; text-decoration: none; display: inline-block; text-align: center;
                }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn-warning { background: var(--warning-color); color: white; }
                .btn-danger { background: var(--danger-color); color: white; }
                .btn-info { background: var(--info-color); color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .message-bar { 
                    padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 15px;
                    background: #d4edda; color: #155724; border: 1px solid #c3e6cb;
                }
                .stats-summary { 
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
                    gap: 15px; margin-bottom: 20px;
                }
                .stat-card { 
                    background: #fff; padding: 15px; border-radius: 8px; box-shadow: var(--shadow-sm);
                    text-align: center;
                }
                .stat-number { font-size: 2rem; font-weight: bold; color: var(--primary-color); }
                .stat-label { color: #6c757d; font-size: 0.9rem; }
                .enrollment-info { 
                    background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;
                    font-size: 0.9rem;
                }
            `}</style>
            
            <div className="management-header">
                <h1><i className="fas fa-cogs fa-fw"></i> إدارة الدورات الشاملة</h1>
                <Link href="/admin/courses/new" className="btn btn-primary">
                    ➕ إنشاء دورة جديدة
                </Link>
            </div>

            {message && <div className="message-bar">{message}</div>}

            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-number">{courses.length}</div>
                    <div className="stat-label">إجمالي الدورات</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{courses.filter(c => c.status === 'active').length}</div>
                    <div className="stat-label">دورات نشطة</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{courses.filter(c => c.status === 'published').length}</div>
                    <div className="stat-label">دورات منشورة</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{courses.filter(c => c.status === 'draft').length}</div>
                    <div className="stat-label">مسودات</div>
                </div>
            </div>

            <div className="controls">
                <input 
                    type="text" 
                    className="search-input"
                    placeholder="🔍 البحث في الدورات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <select 
                    className="filter-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">جميع الدورات</option>
                    <option value="draft">مسودات</option>
                    <option value="published">منشورة</option>
                    <option value="active">نشطة</option>
                    <option value="completed">مكتملة</option>
                </select>
            </div>

            <div className="courses-grid">
                {Array.isArray(filteredCourses) ? filteredCourses.map(course => (
                    <div key={course.id} className="course-card">
                        <div className="course-header">
                            <h3 className="course-title">{course.name}</h3>
                            {getStatusBadge(course.status)}
                        </div>
                        
                        <p>{course.description}</p>
                        
                        <div className="course-meta">
                            <div className="meta-item">
                                <span className="meta-label">تاريخ الإنشاء</span>
                                <span className="meta-value">
                                    {new Date(course.created_at).toLocaleDateString('ar-SA')}
                                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">مدة الدورة</span>
                                <span className="meta-value">{course.duration_days || 'غير محدد'} يوم</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">تاريخ البدء</span>
                                <span className="meta-value">
                                    {course.start_date ? new Date(course.start_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">المشاركين</span>
                                <span className="meta-value">{course.enrollment_count || 0} مشارك</span>
                            </div>
                        </div>

                        {course.auto_launch_settings && (
                            <div className="enrollment-info">
                                <strong>إعدادات الانطلاق التلقائي:</strong>
                                {course.auto_launch_settings.auto_launch_on_max_capacity && ' • عند اكتمال العدد الأقصى'}
                                {course.auto_launch_settings.auto_launch_on_optimal_capacity && ' • عند العدد المثالي'}
                                {course.auto_launch_settings.auto_launch_on_min_capacity && ' • عند الحد الأدنى'}
                            </div>
                        )}

                        <div className="course-actions">
                            <Link href={`/admin/courses/${course.id}/edit`} className="btn btn-primary">
                                ✏️ تعديل
                            </Link>
                            <Link href={`/admin/courses/${course.id}/schedule`} className="btn btn-info">
                                📅 الجدولة
                            </Link>
                            <Link href={`/courses/${course.id}`} className="btn btn-secondary">
                                👁️ عرض
                            </Link>
                            
                            {course.status === 'draft' && (
                                <button 
                                    onClick={() => handlePublishCourse(course.id)}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        fontFamily: 'Tajawal, Arial, sans-serif',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        textDecoration: 'none',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#218838';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#28a745';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    📢 نشر
                                </button>
                            )}
                            
                            {course.status === 'published' && !course.is_launched && (
                                <>
                                    <button 
                                        className="btn btn-warning"
                                        onClick={() => handleLaunchCourse(course.id)}
                                    >
                                        🚀 انطلاق
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => handleUnpublishCourse(course.id)}
                                    >
                                        📝 إلغاء النشر
                                    </button>
                                </>
                            )}
                            
                            {course.status === 'active' && (
                                <button 
                                    className="btn btn-info"
                                    onClick={() => handleStatusChange(course.id, 'completed')}
                                >
                                    ✅ إكمال
                                </button>
                            )}
                            
                            <button 
                                className="btn btn-danger"
                                onClick={() => handleDeleteCourse(course.id)}
                            >
                                🗑️ حذف
                            </button>
                        </div>
                    </div>
                )) : []}
            </div>

            {(!Array.isArray(filteredCourses) || filteredCourses.length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    <i className="fas fa-search fa-3x" style={{ marginBottom: '20px' }}></i>
                    <h3>لا توجد دورات تطابق البحث</h3>
                    <p>جرب تغيير مصطلحات البحث أو الفلتر</p>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    try {
        const coursesResult = await pool.query(`
            SELECT 
                c.*,
                u.full_name as created_by_name,
                COUNT(e.id) as enrollment_count
            FROM courses c
            LEFT JOIN users u ON c.created_by = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status IN ('active', 'waiting_start')
            GROUP BY c.id, u.full_name
            ORDER BY c.created_at DESC
        `);

        // Serialize database rows safely
        const courses = serializeDbRows(coursesResult.rows).map(course => ({
            ...course,
            enrollment_count: parseInt(course.enrollment_count) || 0
        }));

        return {
            props: safeProps({
                user: context.user,
                courses: courses
            })
        };
    } catch (error) {
        console.error('Error fetching courses:', error);
        return {
            props: safeProps({
                user: context.user,
                courses: []
            })
        };
    }
}, { roles: ['admin', 'head'] });

export default CourseManagementPage;