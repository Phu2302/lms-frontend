import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getUserProfileAPI } from '../../api/StudentInfo/Profile/users';
import { logoutAPI } from '../../api/auth/auth';
import ExamSchedule from './ExamSchedule/ExamSchedule';
import ServiceStudent from './ServiceStudent/ServiceStudent';
import Scoreboard from './Scoreboard/Scoreboard';
import Timetable from './Timetable/Timetable';
import { useToast } from '../../components/Toast/ToastContext';
import './StudentInfo.css';

function StudentInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  let initialTab = searchParams.get('tab') || location.state?.defaultTab || 'info';
  if (initialTab === 'service') initialTab = 'service_cert';
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  useEffect(() => {
    const titles = {
      info: 'Thông tin sinh viên - BK LMS',
      service_cert: 'Đăng ký in giấy xác nhận - BK LMS',
      service_card: 'Đăng ký in thẻ sinh viên - BK LMS',
      service_withdraw: 'Đăng ký rút môn học - BK LMS',
      service_appeal: 'Đăng ký phúc khảo điểm - BK LMS',
      exam: 'Lịch thi sinh viên - BK LMS',
      scoreboard: 'Bảng điểm sinh viên - BK LMS',
      schedule: 'Thời khóa biểu sinh viên - BK LMS'
    };
    document.title = titles[activeSubTab] || 'Thông tin sinh viên - BK LMS';
  }, [activeSubTab]);

  const handleSubTabChange = (tabName) => {
    setActiveSubTab(tabName);
    setSearchParams({ tab: tabName }, { replace: true });
  };

  useEffect(() => {
    let tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'service') tabFromUrl = 'service_cert';
    if (tabFromUrl && tabFromUrl !== activeSubTab) {
      setActiveSubTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Dữ liệu sinh viên từ API
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gọi API lấy profile khi component mount & Kiểm tra phân quyền
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currentUser?.role || '1');

    if (userRole === '2' || userRole === '3') {
      showToast('Trang "Thông tin sinh viên" chỉ dành riêng cho Sinh viên. Giảng viên và Admin không được phép truy cập!', 'error');
      navigate(userRole === '2' ? '/online-grading' : '/lms', { replace: true });
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserProfileAPI();
      setStudentData(res.data);
    } catch (err) {
      console.error('Lỗi tải thông tin sinh viên:', err);
      setError('Không thể tải thông tin sinh viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getSidebarCategory = (tab) => {
    if (tab === 'info' || tab === 'exam') return 'student';
    if (tab === 'schedule') return 'timetable';
    if (tab === 'service_cert' || tab === 'service_card' || tab === 'service_withdraw' || tab === 'service_appeal') return 'services';
    if (tab === 'scoreboard') return 'grades';
    return 'student';
  };

  return (
    <div className="mybh-layout">

      {/* 1. NAVBAR NGANG PHÍA TRÊN */}
      <nav className="mybh-top-nav">
        <div className="nav-brand-box" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          myBH
        </div>
        <div className="nav-tabs-wrapper">
          {getSidebarCategory(activeSubTab) === 'student' && (
            <>
              <button
                className={`nav-tab-btn ${activeSubTab === 'info' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('info')}
              >
                Thông tin sinh viên
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'exam' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('exam')}
              >
                Lịch thi
              </button>
            </>
          )}
          {getSidebarCategory(activeSubTab) === 'timetable' && (
            <button
              className={`nav-tab-btn ${activeSubTab === 'schedule' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('schedule')}
            >
              Thời khoá biểu
            </button>
          )}
          {getSidebarCategory(activeSubTab) === 'services' && (
            <>
              <button
                className={`nav-tab-btn ${activeSubTab === 'service_cert' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('service_cert')}
              >
                Đăng ký giấy xác nhận
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'service_card' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('service_card')}
              >
                Đăng ký in thẻ sinh viên
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'service_withdraw' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('service_withdraw')}
              >
                Đăng ký rút môn học
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'service_appeal' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('service_appeal')}
              >
                Đăng ký phúc khảo điểm
              </button>
            </>
          )}
          {getSidebarCategory(activeSubTab) === 'grades' && (
            <button
              className={`nav-tab-btn ${activeSubTab === 'scoreboard' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('scoreboard')}
            >
              Bảng điểm
            </button>
          )}
        </div>
        <div className="nav-logout-wrapper" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '20px' }}>
          <button 
            className="nav-home-btn" 
            onClick={() => navigate('/')} 
            style={{ background: '#008b44', color: '#fff', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Trang chủ
          </button>
          <button className="nav-logout-btn" onClick={handleLogout} style={{ borderRadius: '0px' }}>Đăng xuất</button>
        </div>
      </nav>

      {/* TẦNG DƯỚI: SIDEBAR VÀ NỘI DUNG CHÍNH */}
      <div className="mybh-main-body">

        {/* 2. SIDEBAR DỌC BÊN TRÁI */}
        <aside className="mybh-sidebar">
          <div className="sidebar-logo-container">BK</div>

          <div className="sidebar-menu-list">
            <button
              className={`sidebar-item-btn ${activeSubTab === 'info' || activeSubTab === 'exam' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('info')}
            >
              ☰ Sinh viên
            </button>
            <button
              className={`sidebar-item-btn ${activeSubTab === 'schedule' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('schedule')}
            >
              ☰ Thời khóa biểu
            </button>
            <button
              className={`sidebar-item-btn ${activeSubTab === 'service_cert' || activeSubTab === 'service_card' || activeSubTab === 'service_withdraw' || activeSubTab === 'service_appeal' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('service_cert')}
            >
              ☰ Dịch vụ sinh viên
            </button>
            <button
              className={`sidebar-item-btn ${activeSubTab === 'scoreboard' ? 'active' : ''}`}
              onClick={() => handleSubTabChange('scoreboard')}
            >
              ☰ Bảng điểm
            </button>
          </div>
        </aside>

        {/* 3. VÙNG NỘI DUNG CHÍNH BÊN PHẢI */}
        <main className="mybh-content-area">
          {activeSubTab === 'info' ? (
            <div className="info-card-wrapper">
              <div className="info-card-header">Thông tin cá nhân</div>

              <div className="info-card-body">

                {/* Loading state */}
                {loading && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    ⏳ Đang tải thông tin sinh viên...
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#c00', background: '#fee', borderRadius: '8px' }}>
                    {error}
                    <br />
                    <button onClick={fetchProfile} style={{ marginTop: '10px', padding: '6px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>
                      Thử lại
                    </button>
                  </div>
                )}

                {/* Hiển thị dữ liệu khi có */}
                {!loading && !error && studentData && (
                  <>
                    {/* Ảnh đại diện */}
                    <div className="student-avatar-box">
                      <img
                        src={studentData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"}
                        alt="Avatar Sinh Viên"
                      />
                    </div>

                    {/* Lưới thông tin 5 cột chuẩn bố cục */}
                    <div className="student-info-grid">

                      {/* HÀNG 1 */}
                      <div className="info-field-item">
                        <span className="info-field-label">Mã số sinh viên</span>
                        <span className="info-field-value">{studentData.user_id || studentData.mssv || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Họ và tên lót</span>
                        <span className="info-field-value">{studentData.last_name || studentData.hoDem || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Tên</span>
                        <span className="info-field-value">{studentData.first_name || studentData.ten || studentData.user_name || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Ngày sinh</span>
                        <span className="info-field-value">{studentData.date_of_birth || studentData.ngaySinh || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Giới tính</span>
                        <span className="info-field-value">{studentData.gender || 'N/A'}</span>
                      </div>

                      {/* HÀNG 2 */}
                      <div className="info-field-item">
                        <span className="info-field-label">Lớp</span>
                        <span className="info-field-value">{studentData.class_name || studentData.lop || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Khóa học</span>
                        <span className="info-field-value">{studentData.enrollment_year || studentData.khoaHoc || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Bậc đào tạo</span>
                        <span className="info-field-value">{studentData.education_level || studentData.bacDaoTao || 'Đại học chính quy'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Quê quán</span>
                        <span className="info-field-value">{studentData.address || studentData.hometown || studentData.queQuan || 'N/A'}</span>
                      </div>

                      <div className="info-field-item">
                        <span className="info-field-label">Trạng thái</span>
                        <span className="info-field-value" style={{ color: '#008b44', fontWeight: 'bold' }}>
                          {studentData.status || 'Đang học'}
                        </span>
                      </div>

                      {/* HÀNG 3 */}
                      <div className="info-field-item" style={{ gridColumn: 'span 2' }}>
                        <span className="info-field-label">Khoa quản lý</span>
                        <span className="info-field-value">{studentData.faculty_name || studentData.khoa || 'N/A'}</span>
                      </div>

                      <div className="info-field-item" style={{ gridColumn: 'span 1' }}>
                        <span className="info-field-label">Ngành học</span>
                        <span className="info-field-value">{studentData.major || studentData.nganh || 'N/A'}</span>
                      </div>

                      <div className="info-field-item" style={{ gridColumn: 'span 2' }}>
                        <span className="info-field-label">Email sinh viên</span>
                        <span className="info-field-value">{studentData.email || 'N/A'}</span>
                      </div>

                    </div>
                  </>
                )}

              </div>
            </div>
          ) : activeSubTab === 'schedule' ? (
            <Timetable />
          ) : activeSubTab === 'exam' ? (
            <ExamSchedule />
          ) : activeSubTab === 'service_cert' ? (
            <ServiceStudent type="cert" />
          ) : activeSubTab === 'service_card' ? (
            <ServiceStudent type="card" />
          ) : activeSubTab === 'service_withdraw' ? (
            <ServiceStudent type="withdraw" />
          ) : activeSubTab === 'service_appeal' ? (
            <ServiceStudent type="appeal" />
          ) : activeSubTab === 'scoreboard' ? (
            <Scoreboard />
          ) : null}
        </main>

      </div>
    </div>
  );
}

export default StudentInfo;