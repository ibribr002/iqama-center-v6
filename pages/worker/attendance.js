import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const WorkerAttendancePage = ({ user }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [todayStatus, setTodayStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendanceData();
        checkTodayStatus();
    }, [currentMonth, loadAttendanceData, checkTodayStatus]);

    const generateMockAttendance = useCallback(() => {
        const data = [];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Skip weekends for work days
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                data.push({
                    date: dateStr,
                    status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent'),
                    checkIn: Math.random() > 0.1 ? '08:' + String(Math.floor(Math.random() * 60)).padStart(2, '0') : null,
                    checkOut: Math.random() > 0.1 ? '17:' + String(Math.floor(Math.random() * 60)).padStart(2, '0') : null,
                    notes: Math.random() > 0.8 ? 'ملاحظة تجريبية' : null
                });
            }
        }
        return data;
    }, [currentMonth]);

    const loadAttendanceData = useCallback(async () => {
        try {
            // Mock attendance data - replace with actual API call
            const mockData = generateMockAttendance();
            setAttendanceData(mockData);
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    }, [generateMockAttendance]);

    const checkTodayStatus = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = attendanceData.find(record => record.date === today);
        setTodayStatus(todayRecord);
    }, [attendanceData]);


    const checkIn = async () => {
        try {
            const now = new Date();
            const newRecord = {
                id: Date.now(),
                date: now.toISOString().split('T')[0],
                check_in_time: now.toISOString(),
                status: now.getHours() > 9 ? 'late' : 'present',
                location: 'المكتب الرئيسي'
            };
            
            setTodayStatus(newRecord);
            // Update attendance data
            setAttendanceData(prev => {
                const filtered = prev.filter(record => record.date !== newRecord.date);
                return [...filtered, newRecord];
            });
        } catch (error) {
            console.error('Error checking in:', error);
        }
    };

    const checkOut = async () => {
        try {
            const now = new Date();
            const updatedRecord = {
                ...todayStatus,
                check_out_time: now.toISOString(),
                total_hours: ((now - new Date(todayStatus.check_in_time)) / (1000 * 60 * 60)).toFixed(2)
            };
            
            setTodayStatus(updatedRecord);
            setAttendanceData(prev => 
                prev.map(record => 
                    record.date === updatedRecord.date ? updatedRecord : record
                )
            );
        } catch (error) {
            console.error('Error checking out:', error);
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            'present': 'حاضر',
            'late': 'متأخر',
            'absent': 'غائب',
            'half_day': 'نصف يوم',
            'sick': 'إجازة مرضية',
            'vacation': 'إجازة'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'present': '#28a745',
            'late': '#ffc107',
            'absent': '#dc3545',
            'half_day': '#17a2b8',
            'sick': '#6f42c1',
            'vacation': '#20c997'
        };
        return colors[status] || '#6c757d';
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        const time = new Date(timeStr);
        return time.toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(currentMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    const getMonthStats = () => {
        const presentDays = attendanceData.filter(record => record.status === 'present').length;
        const lateDays = attendanceData.filter(record => record.status === 'late').length;
        const absentDays = attendanceData.filter(record => record.status === 'absent').length;
        const totalHours = attendanceData
            .filter(record => record.total_hours)
            .reduce((sum, record) => sum + parseFloat(record.total_hours), 0);

        return { presentDays, lateDays, absentDays, totalHours: totalHours.toFixed(1) };
    };

    const stats = getMonthStats();

    return (
        <Layout user={user}>
            <style jsx>{`
                .attendance-container {
                    padding: 20px;
                }
                .page-header {
                    background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .page-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .check-in-section {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                    text-align: center;
                }
                .current-status {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .status-item {
                    text-align: center;
                }
                .status-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 5px;
                }
                .status-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #333;
                }
                .check-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .check-btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .check-btn.check-in {
                    background: #28a745;
                    color: white;
                }
                .check-btn.check-in:hover {
                    background: #218838;
                    transform: translateY(-2px);
                }
                .check-btn.check-out {
                    background: #dc3545;
                    color: white;
                }
                .check-btn.check-out:hover {
                    background: #c82333;
                    transform: translateY(-2px);
                }
                .check-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #20c997;
                    margin-bottom: 5px;
                }
                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }
                .month-navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .nav-btn {
                    background: #17a2b8;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                .nav-btn:hover {
                    background: #138496;
                }
                .current-month {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #333;
                }
                .attendance-table {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .table th,
                .table td {
                    padding: 12px 15px;
                    text-align: right;
                    border-bottom: 1px solid #eee;
                }
                .table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #495057;
                }
                .table tbody tr:hover {
                    background: #f8f9fa;
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: white;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                @media (max-width: 768px) {
                    .current-status {
                        flex-direction: column;
                    }
                    .check-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    .month-navigation {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .table {
                        font-size: 0.9rem;
                    }
                    .table th,
                    .table td {
                        padding: 8px 10px;
                    }
                }
                .table-responsive-wrapper { overflow-x: auto; }
            `}</style>

            <div className="attendance-container">
                <div className="page-header">
                    <h1><i className="fas fa-clock fa-fw"></i> الحضور والانصراف</h1>
                    <p>تسجيل ومتابعة أوقات الحضور والانصراف</p>
                </div>

                {/* Check In/Out Section */}
                <div className="check-in-section">
                    <h2>تسجيل الحضور اليوم</h2>
                    <div className="current-status">
                        <div className="status-item">
                            <div className="status-label">وقت الدخول</div>
                            <div className="status-value">
                                {todayStatus?.check_in_time ? formatTime(todayStatus.check_in_time) : '-'}
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">وقت الخروج</div>
                            <div className="status-value">
                                {todayStatus?.check_out_time ? formatTime(todayStatus.check_out_time) : '-'}
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">إجمالي الساعات</div>
                            <div className="status-value">
                                {todayStatus?.total_hours ? `${todayStatus.total_hours} ساعة` : '-'}
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-label">الحالة</div>
                            <div className="status-value" style={{ color: getStatusColor(todayStatus?.status) }}>
                                {todayStatus ? getStatusText(todayStatus.status) : 'لم يتم التسجيل'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="check-buttons">
                        <button 
                            className="check-btn check-in"
                            onClick={checkIn}
                            disabled={todayStatus?.check_in_time}
                        >
                            <i className="fas fa-sign-in-alt"></i>
                            {todayStatus?.check_in_time ? 'تم تسجيل الدخول' : 'تسجيل الدخول'}
                        </button>
                        <button 
                            className="check-btn check-out"
                            onClick={checkOut}
                            disabled={!todayStatus?.check_in_time || todayStatus?.check_out_time}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            {todayStatus?.check_out_time ? 'تم تسجيل الخروج' : 'تسجيل الخروج'}
                        </button>
                    </div>
                </div>

                {/* Monthly Statistics */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">{stats.presentDays}</div>
                        <div className="stat-label">أيام الحضور</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.lateDays}</div>
                        <div className="stat-label">أيام التأخير</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.absentDays}</div>
                        <div className="stat-label">أيام الغياب</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.totalHours}</div>
                        <div className="stat-label">إجمالي الساعات</div>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="month-navigation">
                    <button className="nav-btn" onClick={() => navigateMonth(-1)}>
                        <i className="fas fa-chevron-right"></i> الشهر السابق
                    </button>
                    <div className="current-month">
                        {currentMonth.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                    </div>
                    <button className="nav-btn" onClick={() => navigateMonth(1)}>
                        الشهر التالي <i className="fas fa-chevron-left"></i>
                    </button>
                </div>

                {/* Attendance Table */}
                <div className="attendance-table table-responsive-wrapper">
                    {loading ? (
                        <div className="loading">
                            <i className="fas fa-spinner fa-spin fa-2x"></i>
                            <p>جاري تحميل بيانات الحضور...</p>
                        </div>
                    ) : attendanceData.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-calendar-times fa-3x" style={{ color: '#ddd', marginBottom: '15px' }}></i>
                            <p>لا توجد بيانات حضور لهذا الشهر</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>وقت الدخول</th>
                                    <th>وقت الخروج</th>
                                    <th>إجمالي الساعات</th>
                                    <th>الحالة</th>
                                    <th>الموقع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map(record => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.date).toLocaleDateString('ar-EG')}</td>
                                        <td>{formatTime(record.check_in_time)}</td>
                                        <td>{formatTime(record.check_out_time)}</td>
                                        <td>{record.total_hours ? `${record.total_hours} ساعة` : '-'}</td>
                                        <td>
                                            <span 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(record.status) }}
                                            >
                                                {getStatusText(record.status)}
                                            </span>
                                        </td>
                                        <td>{record.location || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    
    if (user.role !== 'worker') {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        };
    }

    return {
        props: {
            user: JSON.parse(JSON.stringify(user))
        }
    };
}, { roles: ['worker'] });

export default WorkerAttendancePage;