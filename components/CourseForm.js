import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const CourseForm = ({ course: initialCourse, allUsers = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [course, setCourse] = useState({
        name: '',
        description: '',
        content_outline: '',
        duration_days: 7,
        start_date: '',
        days_per_week: 5,
        hours_per_day: 2.0,
        details: {
            cost: 0,
            currency: 'EGP',
            max_seats: 15,
            teachers: [],
            target_roles: [],
            prerequisites: []
        },
        participant_config: {
            level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
            level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
            level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
        },
        auto_launch_settings: {
            auto_launch_on_max_capacity: false,
            auto_launch_on_optimal_capacity: false,
            auto_launch_on_min_capacity: false
        }
    });
    const router = useRouter();

    useEffect(() => {
        if (initialCourse) {
            // Parse JSON fields safely
            const parseJsonField = (field, defaultValue) => {
                if (typeof field === 'string') {
                    try {
                        return JSON.parse(field);
                    } catch (e) {
                        return defaultValue;
                    }
                }
                return field || defaultValue;
            };

            setCourse({
                ...initialCourse,
                name: initialCourse.name || '',
                description: initialCourse.description || '',
                duration_days: initialCourse.duration_days || 7,
                start_date: initialCourse.start_date || '',
                days_per_week: initialCourse.days_per_week || 5,
                hours_per_day: initialCourse.hours_per_day || 2.0,
                content_outline: initialCourse.content_outline || '',
                details: parseJsonField(initialCourse.details, {
                    cost: 0,
                    currency: 'EGP',
                    max_seats: 15,
                    teachers: [],
                    target_roles: [],
                    prerequisites: []
                }),
                participant_config: parseJsonField(initialCourse.participant_config, {
                    level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
                    level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
                    level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
                }),
                auto_launch_settings: parseJsonField(initialCourse.auto_launch_settings, {
                    auto_launch_on_max_capacity: false,
                    auto_launch_on_optimal_capacity: false,
                    auto_launch_on_min_capacity: false
                })
            });
        }
    }, [initialCourse]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourse(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailsChange = (e) => {
        const { name, value, type } = e.target;
        setCourse(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [name]: type === 'number' ? parseInt(value, 10) : value
            }
        }));
    };

    const handleTeachersChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setCourse(prev => ({
            ...prev,
            details: { ...prev.details, teachers: selectedOptions }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted explicitly by user click'); // Debug log
        
        // Ensure this is a real submit event, not accidental
        if (e.type !== 'submit') {
            console.log('Prevented non-submit event:', e.type);
            return;
        }
        
        const url = initialCourse ? `/api/courses/${initialCourse.id}` : '/api/courses/create-advanced';
        const method = initialCourse ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(course)
            });

            const result = await response.json();
            if (response.ok) {
                alert('✅ تم حفظ الدورة بنجاح!');
                
                if (initialCourse) {
                    // For editing existing course - redirect to schedule page
                    router.push(`/admin/courses/${initialCourse.id}/schedule`);
                } else {
                    // For creating new course - use returned ID
                    if (result.id) {
                        router.push(`/admin/courses/${result.id}/schedule`);
                    } else {
                        console.error('Course ID is missing:', result);
                        alert('⚠️ تم حفظ الدورة لكن حدث خطأ في التوجيه. يرجى الذهاب لقائمة الدورات.');
                        router.push('/admin/courses/manage');
                    }
                }
            } else {
                alert('⚠️ خطأ: ' + result.message);
            }
        } catch (err) {
            alert('🚫 خطأ في الاتصال بالخادم.');
        }
    };

    const handleParticipantConfigChange = (level, field, value) => {
        setCourse(prev => ({
            ...prev,
            participant_config: {
                ...prev.participant_config,
                [level]: {
                    ...prev.participant_config[level],
                    [field]: value
                }
            }
        }));
    };

    const handleAutoLaunchChange = (setting, value) => {
        console.log('Auto launch change:', setting, value); // Debug log
        setCourse(prev => ({
            ...prev,
            auto_launch_settings: {
                ...prev.auto_launch_settings,
                [setting]: value
            }
        }));
    };

    const nextStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };
    
    const prevStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // فلترة المستخدمين لعرض المعلمين فقط
    const teacherUsers = allUsers.filter(u => u.role === 'teacher');

    const renderStep1 = () => (
        <div className="step-content">
            <h3 style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                margin: 0,
                padding: '25px 30px',
                fontSize: '1.4rem',
                fontWeight: 600,
                textAlign: 'center',
                borderRadius: 0
            }}>📋 المعلومات الأساسية للدورة</h3>
            <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '25px',
                padding: '30px',
                background: '#fafbfc'
            }}>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="name" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>🏷️ اسم الدورة</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={course.name} 
                        onChange={handleChange} 
                        required 
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #0ea5e9',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 700,
                            color: '#0c4a6e'
                        }}
                    />
                </div>

                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="description" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>📝 وصف الدورة السريع</label>
                    <textarea 
                        id="description" 
                        name="description" 
                        value={course.description} 
                        onChange={handleChange} 
                        rows="3"
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #38bdf8',
                            borderRadius: '16px',
                            fontSize: '1.2rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            minHeight: '100px',
                            lineHeight: '1.8',
                            fontWeight: 500,
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="content_outline" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>📚 جدول محتويات الدورة</label>
                    <textarea 
                        id="content_outline" 
                        name="content_outline" 
                        value={course.content_outline} 
                        onChange={handleChange} 
                        rows="5" 
                        placeholder="اكتب محتويات الدورة بالتفصيل..."
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #eab308',
                            borderRadius: '16px',
                            fontSize: '1.2rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            minHeight: '140px',
                            lineHeight: '1.8',
                            fontWeight: 500,
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="duration_days" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>📅 مدة الدورة (بالأيام)</label>
                    <input 
                        type="number" 
                        id="duration_days" 
                        name="duration_days" 
                        value={course.duration_days} 
                        onChange={handleChange} 
                        min="1" 
                        max="365"
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #22c55e',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 700,
                            color: '#15803d',
                            textAlign: 'center'
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="start_date" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>🗓️ تاريخ بدء الدورة</label>
                    <input 
                        type="date" 
                        id="start_date" 
                        name="start_date" 
                        value={course.start_date} 
                        onChange={handleChange}
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #a855f7',
                            borderRadius: '16px',
                            fontSize: '1.2rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: '#7c3aed'
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="days_per_week" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>📆 عدد أيام الدورة في الأسبوع</label>
                    <select 
                        id="days_per_week" 
                        name="days_per_week" 
                        value={course.days_per_week} 
                        onChange={handleChange}
                        style={{
                            padding: '18px 24px',
                            border: '3px solid #22c55e',
                            borderRadius: '16px',
                            fontSize: '1.2rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 700,
                            color: '#15803d',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="1">يوم واحد</option>
                        <option value="2">يومان</option>
                        <option value="3">ثلاثة أيام</option>
                        <option value="4">أربعة أيام</option>
                        <option value="5">خمسة أيام</option>
                        <option value="6">ستة أيام</option>
                        <option value="7">سبعة أيام</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="hours_per_day" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>⏰ مدة اليوم (بالساعات)</label>
                    <input 
                        type="number" 
                        id="hours_per_day" 
                        name="hours_per_day" 
                        value={course.hours_per_day} 
                        onChange={handleChange} 
                        step="0.5" 
                        min="0.5" 
                        max="12"
                        style={{
                            padding: '16px 20px',
                            border: '3px solid #22c55e',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: '#15803d',
                            textAlign: 'center'
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="cost" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>💰 التكلفة</label>
                    <input 
                        type="number" 
                        id="cost" 
                        name="cost" 
                        value={course.details?.cost || ''} 
                        onChange={handleDetailsChange}
                        style={{
                            padding: '16px 20px',
                            border: '3px solid #f59e0b',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #fef7cd 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: '#d97706',
                            textAlign: 'center'
                        }}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="currency" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>💱 العملة</label>
                    <select 
                        id="currency" 
                        name="currency" 
                        value={course.details?.currency || 'EGP'} 
                        onChange={handleDetailsChange}
                        style={{
                            padding: '16px 20px',
                            border: '3px solid #f59e0b',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #fef7cd 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: '#d97706',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="EGP">جنيه مصري (EGP)</option>
                        <option value="SAR">ريال سعودي (SAR)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="max_seats" style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>👥 العدد الأقصى للمقاعد</label>
                    <input 
                        type="number" 
                        id="max_seats" 
                        name="max_seats" 
                        value={course.details?.max_seats || ''} 
                        onChange={handleDetailsChange} 
                        min="1"
                        style={{
                            padding: '16px 20px',
                            border: '3px solid #f59e0b',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            background: 'linear-gradient(135deg, #fef7cd 0%, #ffffff 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: '#d97706',
                            textAlign: 'center'
                        }}
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3 style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                margin: 0,
                padding: '25px 30px',
                fontSize: '1.4rem',
                fontWeight: 600,
                textAlign: 'center',
                borderRadius: 0
            }}>👥 تكوين المشاركين حسب الدرجات</h3>
            <div style={{ padding: '30px', background: '#fafbfc' }}>
                <p style={{
                    color: '#64748b',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    marginBottom: '30px',
                    fontFamily: 'Tajawal, Cairo, sans-serif',
                    lineHeight: '1.6'
                }}>حدد الأصناف والأعداد المطلوبة لكل درجة من درجات المشاركين</p>
            
                {Object.entries(course.participant_config).map(([level, config]) => (
                    <div key={level} style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '16px',
                        marginBottom: '25px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '2px solid #e2e8f0'
                    }}>
                        <h4 style={{
                            margin: '0 0 20px 0',
                            color: '#1e293b',
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            textAlign: 'center',
                            padding: '15px',
                            background: level === 'level_1' ? 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)' :
                                       level === 'level_2' ? 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)' :
                                       'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                            borderRadius: '12px',
                            border: level === 'level_1' ? '2px solid #f59e0b' :
                                   level === 'level_2' ? '2px solid #3b82f6' :
                                   '2px solid #10b981'
                        }}>
                            {level === 'level_1' && '🎯 درجة 1 - المشرف'}
                            {level === 'level_2' && '👨‍🏫 درجة 2 - المسؤول'}
                            {level === 'level_3' && '🎓 درجة 3 - المتلقي'}
                        </h4>
                    
                    <div className="form-grid">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                marginBottom: '12px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontFamily: 'Tajawal, Cairo, sans-serif'
                            }}>📝 اسم الدرجة</label>
                            <input 
                                type="text" 
                                value={config.name} 
                                onChange={(e) => handleParticipantConfigChange(level, 'name', e.target.value)}
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontFamily: 'Tajawal, Cairo, sans-serif',
                                    background: '#ffffff',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                marginBottom: '12px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontFamily: 'Tajawal, Cairo, sans-serif'
                            }}>🎯 الأدوار المستهدفة</label>
                            <div style={{
                                padding: '14px 18px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                background: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                {[
                                    { value: 'admin', label: '👨‍💼 مدير' },
                                    { value: 'head', label: '👨‍💻 رئيس قسم' },
                                    { value: 'teacher', label: '👨‍🏫 معلم' },
                                    { value: 'student', label: '🎓 طالب' },
                                    { value: 'parent', label: '👨‍👩‍👧‍👦 ولي أمر' },
                                    { value: 'worker', label: '👷‍♂️ عامل' }
                                ].map(role => (
                                    <label key={role.value} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s ease',
                                        fontSize: '0.95rem',
                                        fontFamily: 'Tajawal, Cairo, sans-serif',
                                        backgroundColor: config.roles.includes(role.value) ? '#f0f9ff' : 'transparent',
                                        border: config.roles.includes(role.value) ? '1px solid #3b82f6' : '1px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!config.roles.includes(role.value)) {
                                            e.target.style.backgroundColor = '#f8fafc';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!config.roles.includes(role.value)) {
                                            e.target.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={config.roles.includes(role.value)}
                                            onChange={(e) => {
                                                const newRoles = e.target.checked
                                                    ? [...config.roles, role.value]
                                                    : config.roles.filter(r => r !== role.value);
                                                handleParticipantConfigChange(level, 'roles', newRoles);
                                            }}
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                cursor: 'pointer',
                                                accentColor: '#3b82f6'
                                            }}
                                        />
                                        <span>{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                marginBottom: '12px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontFamily: 'Tajawal, Cairo, sans-serif'
                            }}>📊 الحد الأدنى</label>
                            <input 
                                type="number" 
                                value={config.min} 
                                onChange={(e) => handleParticipantConfigChange(level, 'min', parseInt(e.target.value))}
                                min="0"
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid #10b981',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontFamily: 'Tajawal, Cairo, sans-serif',
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#15803d'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                marginBottom: '12px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontFamily: 'Tajawal, Cairo, sans-serif'
                            }}>📈 الحد الأقصى</label>
                            <input 
                                type="number" 
                                value={config.max} 
                                onChange={(e) => handleParticipantConfigChange(level, 'max', parseInt(e.target.value))}
                                min="1"
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid #ef4444',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontFamily: 'Tajawal, Cairo, sans-serif',
                                    background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#dc2626'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                marginBottom: '12px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontFamily: 'Tajawal, Cairo, sans-serif'
                            }}>⭐ العدد المثالي</label>
                            <input 
                                type="number" 
                                value={config.optimal} 
                                onChange={(e) => handleParticipantConfigChange(level, 'optimal', parseInt(e.target.value))}
                                min="1"
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontFamily: 'Tajawal, Cairo, sans-serif',
                                    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#2563eb'
                                }}
                            />
                        </div>
                    </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h3 style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                margin: 0,
                padding: '25px 30px',
                fontSize: '1.4rem',
                fontWeight: 600,
                textAlign: 'center',
                borderRadius: 0
            }}>🚀 إعدادات النشر والانطلاق</h3>
            
            <div style={{ padding: '30px', background: '#fafbfc' }}>
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '16px',
                    marginBottom: '25px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '2px solid #e2e8f0'
                }}>
                    <label style={{
                        marginBottom: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Tajawal, Cairo, sans-serif'
                    }}>👨‍🏫 المعلمون المكلفون</label>
                    
                    {teacherUsers.length > 0 ? (
                        <div style={{
                            padding: '16px 20px',
                            border: '3px solid #3b82f6',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {teacherUsers.map(teacher => (
                                <label key={teacher.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    fontSize: '1rem',
                                    fontFamily: 'Tajawal, Cairo, sans-serif',
                                    backgroundColor: (course.details?.teachers || []).includes(teacher.id.toString()) 
                                        ? '#dbeafe' 
                                        : 'transparent',
                                    border: (course.details?.teachers || []).includes(teacher.id.toString()) 
                                        ? '1px solid #3b82f6' 
                                        : '1px solid transparent',
                                    fontWeight: (course.details?.teachers || []).includes(teacher.id.toString()) 
                                        ? 600 
                                        : 400
                                }}
                                onMouseEnter={(e) => {
                                    if (!(course.details?.teachers || []).includes(teacher.id.toString())) {
                                        e.target.style.backgroundColor = '#f1f5f9';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!(course.details?.teachers || []).includes(teacher.id.toString())) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={(course.details?.teachers || []).includes(teacher.id.toString())}
                                        onChange={(e) => {
                                            const currentTeachers = course.details?.teachers || [];
                                            const teacherId = teacher.id.toString();
                                            const newTeachers = e.target.checked
                                                ? [...currentTeachers, teacherId]
                                                : currentTeachers.filter(id => id !== teacherId);
                                            
                                            setCourse(prev => ({
                                                ...prev,
                                                details: { 
                                                    ...prev.details, 
                                                    teachers: newTeachers 
                                                }
                                            }));
                                        }}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            cursor: 'pointer',
                                            accentColor: '#3b82f6'
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '1.1rem' }}>👨‍🏫</span>
                                            <span style={{
                                                color: '#1e293b',
                                                fontWeight: 'inherit'
                                            }}>{teacher.full_name}</span>
                                        </div>
                                        {teacher.email && (
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: '#64748b',
                                                marginTop: '2px',
                                                marginRight: '24px'
                                            }}>
                                                📧 {teacher.email}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '1rem',
                            fontFamily: 'Tajawal, Cairo, sans-serif',
                            border: '2px dashed #cbd5e0',
                            borderRadius: '12px',
                            background: '#f8fafc'
                        }}>
                            ⚠️ لا يوجد معلمون متاحون في النظام
                        </div>
                    )}
                </div>

            <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '16px',
                marginTop: '25px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                border: '2px solid #e2e8f0'
            }}>
                <h4 style={{
                    margin: '0 0 20px 0',
                    color: '#1e293b',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    fontFamily: 'Tajawal, Cairo, sans-serif',
                    textAlign: 'center',
                    padding: '15px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '2px solid #3b82f6'
                }}>⚙️ إعدادات الانطلاق التلقائي</h4>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {[
                        {
                            key: 'auto_launch_on_max_capacity',
                            icon: '🎯',
                            title: 'انطلاق تلقائي عند اكتمال العدد الأقصى',
                            description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للعدد الأقصى قبل تاريخ البدء',
                            color: '#ef4444'
                        },
                        {
                            key: 'auto_launch_on_optimal_capacity',
                            icon: '⭐',
                            title: 'انطلاق تلقائي عند بلوغ العدد المثالي',
                            description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للعدد المثالي قبل البدء بيوم واحد',
                            color: '#3b82f6'
                        },
                        {
                            key: 'auto_launch_on_min_capacity',
                            icon: '📊',
                            title: 'انطلاق تلقائي عند بلوغ الحد الأدنى',
                            description: 'تنطلق الدورة تلقائياً عند وصول التسجيلات للحد الأدنى قبل البدء بيوم واحد',
                            color: '#10b981'
                        }
                    ].map(setting => (
                        <label key={setting.key} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '16px',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            border: course.auto_launch_settings[setting.key] 
                                ? `2px solid ${setting.color}` 
                                : '2px solid #e2e8f0',
                            backgroundColor: course.auto_launch_settings[setting.key] 
                                ? `${setting.color}10` 
                                : '#ffffff',
                            boxShadow: course.auto_launch_settings[setting.key] 
                                ? `0 4px 12px ${setting.color}20` 
                                : '0 2px 4px rgba(0, 0, 0, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                            if (!course.auto_launch_settings[setting.key]) {
                                e.target.style.backgroundColor = '#f8fafc';
                                e.target.style.borderColor = '#cbd5e0';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!course.auto_launch_settings[setting.key]) {
                                e.target.style.backgroundColor = '#ffffff';
                                e.target.style.borderColor = '#e2e8f0';
                            }
                        }}
                        >
                            <input
                                type="checkbox"
                                checked={course.auto_launch_settings[setting.key] || false}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleAutoLaunchChange(setting.key, e.target.checked);
                                }}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: setting.color,
                                    marginTop: '2px'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '6px'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>{setting.icon}</span>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        color: '#1e293b',
                                        fontFamily: 'Tajawal, Cairo, sans-serif'
                                    }}>{setting.title}</span>
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    color: '#64748b',
                                    lineHeight: '1.4',
                                    fontFamily: 'Tajawal, Cairo, sans-serif'
                                }}>{setting.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            </div>
        </div>
    );

    return (
        <div className="course-form-container">
            <style jsx>{`
                .course-form-container {
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }
                
                .step-content {
                    padding: 0;
                }
                
                .step-content h3 {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                    padding: 25px 30px;
                    font-size: 1.4rem;
                    font-weight: 600;
                    text-align: center;
                    border-radius: 0;
                }
                .modern-form { background: #fff; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-lg); }
                .step-indicator { display: flex; justify-content: center; margin-bottom: 30px; }
                .step { padding: 10px 20px; margin: 0 5px; border-radius: 20px; background: #f8f9fa; color: #6c757d; }
                .step.active { background: var(--primary-color); color: white; }
                .step.completed { background: var(--success-color); color: white; }
                .form-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 25px; 
                    padding: 30px;
                    background: #fafbfc;
                }
                
                .full-width { 
                    grid-column: 1 / -1; 
                }
                
                .form-group { 
                    display: flex; 
                    flex-direction: column; 
                    position: relative;
                }
                
                .form-group label { 
                    margin-bottom: 15px !important; 
                    font-weight: 700 !important; 
                    color: #1e293b !important; 
                    font-size: 1.3rem !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    font-family: 'Tajawal', 'Cairo', sans-serif !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                    padding: 8px 0 !important;
                }
                
                .form-group input, 
                .form-group textarea, 
                .form-group select {
                    padding: 18px 24px !important; 
                    border: 3px solid #e2e8f0 !important; 
                    border-radius: 16px !important; 
                    font-size: 1.2rem !important;
                    font-family: 'Tajawal', 'Cairo', sans-serif !important;
                    background: #ffffff !important;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .form-group input:focus, 
                .form-group textarea:focus, 
                .form-group select:focus {
                    outline: none !important; 
                    border-color: #667eea !important; 
                    box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1) !important;
                    transform: translateY(-2px) scale(1.02) !important;
                    background: #ffffff !important;
                }
                
                .form-group input:hover:not(:focus), 
                .form-group textarea:hover:not(:focus), 
                .form-group select:hover:not(:focus) {
                    border-color: #cbd5e0;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
                }
                
                .form-group textarea {
                    resize: vertical !important;
                    min-height: 120px !important;
                    line-height: 1.8 !important;
                    font-weight: 500 !important;
                }
                
                .form-group input[type="number"] {
                    text-align: center !important;
                    font-weight: 700 !important;
                    font-size: 1.3rem !important;
                }
                
                .form-group select {
                    cursor: pointer;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                    background-position: left 12px center;
                    background-repeat: no-repeat;
                    background-size: 16px;
                    padding-left: 40px;
                }
                
                .form-group input::placeholder,
                .form-group textarea::placeholder {
                    color: #9ca3af;
                    font-style: italic;
                }
                
                /* Special styling for specific fields */
                .form-group input[name="name"] {
                    font-size: 1.4rem !important;
                    font-weight: 700 !important;
                    background: linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%) !important;
                    border-color: #0ea5e9 !important;
                    color: #0c4a6e !important;
                }
                
                .form-group textarea[name="description"] {
                    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%) !important;
                    border-color: #38bdf8 !important;
                    min-height: 100px !important;
                }
                
                .form-group textarea[name="content_outline"] {
                    background: linear-gradient(135deg, #fefce8 0%, #ffffff 100%) !important;
                    border-color: #eab308 !important;
                    min-height: 140px !important;
                    font-weight: 500 !important;
                }
                
                .form-group input[name="duration_days"],
                .form-group select[name="days_per_week"],
                .form-group input[name="hours_per_day"] {
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%) !important;
                    border-color: #22c55e !important;
                    font-weight: 700 !important;
                    color: #15803d !important;
                    text-align: center !important;
                }
                
                .form-group input[name="start_date"] {
                    background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%) !important;
                    border-color: #a855f7 !important;
                    font-weight: 600 !important;
                    color: #7c3aed !important;
                }
                
                .form-group input[name="cost"],
                .form-group select[name="currency"],
                .form-group input[name="max_seats"] {
                    background: linear-gradient(135deg, #fef7cd 0%, #ffffff 100%) !important;
                    border-color: #f59e0b !important;
                    font-weight: 600 !important;
                    color: #d97706 !important;
                }
                
                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                        padding: 20px;
                    }
                    
                    .form-group label {
                        font-size: 1rem;
                    }
                    
                    .form-group input, 
                    .form-group textarea, 
                    .form-group select {
                        padding: 14px 16px;
                        font-size: 1rem;
                    }
                }
                .participant-level-config { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .participant-level-config h4 { margin-top: 0; color: var(--primary-color); }
                .auto-launch-settings { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
                .checkbox-group label { flex-direction: row; align-items: center; cursor: pointer; }
                .checkbox-group input { width: auto; margin-right: 10px; cursor: pointer; }
                .step-description { color: #6c757d; margin-bottom: 20px; }
                .navigation-buttons { display: flex; justify-content: space-between; margin-top: 30px; }
                .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn:hover { transform: translateY(-2px); }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            `}</style>
            
            <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    1. المعلومات الأساسية
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                    2. تكوين المشاركين
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                    3. إعدادات النشر
                </div>
            </div>

            <form 
                onSubmit={handleSubmit} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.type !== 'submit') {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                onMouseOver={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
            >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <div className="navigation-buttons">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            prevStep(e);
                        }}
                        onMouseEnter={(e) => e.stopPropagation()}
                        disabled={currentStep === 1}
                    >
                        السابق ←
                    </button>
                    
                    {currentStep < 3 ? (
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                nextStep(e);
                            }}
                            onMouseEnter={(e) => e.stopPropagation()}
                        >
                            → التالي
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            className="btn btn-success"
                            onMouseEnter={(e) => e.stopPropagation()}
                            onMouseLeave={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                console.log('Submit button clicked');
                                e.stopPropagation();
                            }}
                        >
                            {initialCourse ? '💾 تحديث الدورة والانتقال للجدولة' : '➕ إنشاء الدورة والانتقال للجدولة'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CourseForm;