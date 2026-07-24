import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { logoutAPI } from '../../api/auth/auth';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const currentUser = user || (userString ? JSON.parse(userString) : null);
  const userRole = String(currentUser?.role || '1');

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    logout();
    showToast('Đã đăng xuất thành công.', 'info');
  };

  const handleServiceClick = (serviceName) => {
    if (token) {
      if (serviceName === 'Thông tin sinh viên' || serviceName === 'Đăng ký in giấy xác nhận') {
        if (userRole === '2') {
          showToast('Khu vực "Thông tin sinh viên" không dành cho Giảng viên!', 'error');
          return;
        }
        if (serviceName === 'Thông tin sinh viên') {
          navigate('/student-info?tab=info');
          return;
        }
        if (serviceName === 'Đăng ký in giấy xác nhận') {
          navigate('/student-info?tab=service', { state: { defaultTab: 'service' } });
          return;
        }
      }
      if (serviceName === 'Đăng ký môn học') {
        if (userRole === '2') {
          showToast('Chức năng "Đăng ký môn học" không dành cho Giảng viên!', 'error');
          return;
        }
        navigate('/course-registration');
        return;
      }
      if (serviceName === 'Quản lý giảng dạy') {
        if (userRole === '1') {
          showToast('Khu vực "Hỗ trợ & Quản lý giảng dạy" chỉ dành riêng cho Giảng viên và Admin!', 'error');
          return;
        }
        navigate('/teaching-support');
        return;
      }
      if (serviceName === 'Nhập điểm trực tuyến') {
        if (userRole === '1') {
          showToast('Chức năng "Nhập điểm trực tuyến" chỉ dành riêng cho Giảng viên và Admin!', 'error');
          return;
        }
        navigate('/online-grading');
        return;
      }
      if (serviceName === 'Duyệt Dịch Vụ Sinh Viên') {
        navigate('/admin?tab=services');
        return;
      }
      if (serviceName === 'Quản Lý Đào Tạo') {
        navigate('/admin?tab=academic');
        return;
      }
      if (serviceName === 'Điều chỉnh đăng ký môn học') {
        navigate('/admin?tab=course-adjust');
        return;
      }
      if (serviceName === 'LMS') {
        navigate('/lms');
        return;
      }
    }
    navigate('/login', { state: { targetService: serviceName } });
  };

  const isAdminUser = token && userRole === '3';

  return (
    <div className="mybk-container">
      <div className="mybk-header">
        <div className="mybk-logo">BHX</div>
        <div className="mybk-title">
          <h1>HỆ THỐNG TIỆN ÍCH TRỰC TUYẾN (MY-BHX)</h1>
        </div>

        <div className="homepage-user-controls" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {token && currentUser ? (
            <>
              <span className="homepage-welcome" style={{ fontSize: '14px', color: '#005a2b', fontWeight: 'bold' }}>
                Xin chào, {currentUser.first_name || currentUser.user_name}
              </span>

              <button
                className="homepage-logout-btn"
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid #008b44', color: '#008b44', borderRadius: '4px', padding: '7px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <button
              className="homepage-login-btn"
              onClick={() => navigate('/login')}
              style={{ background: '#008b44', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              🔑 Đăng Nhập
            </button>
          )}
        </div>
      </div>

      <div className="mybk-grid">
        {/* Cột 1: General */}
        <div className="mybk-column">
          <h2>General</h2>
          <button className="service-btn" onClick={() => handleServiceClick('LMS')}>
            🌐 LMS (Hệ thống học tập)
          </button>
          <button className="service-btn" onClick={() => handleServiceClick('Thông tin sinh viên')}>
            📖 Thông tin sinh viên
          </button>
        </div>

        {/* Cột 2: Giảng viên & Phòng Đào Tạo */}
        <div className="mybk-column">
          <h2>{isAdminUser ? 'Giảng viên & Phòng đào tạo' : 'Giảng viên'}</h2>
          <button className="service-btn" onClick={() => handleServiceClick('Quản lý giảng dạy')}>
            🛠️ Hỗ trợ & Quản lý giảng dạy
          </button>
          <button className="service-btn" onClick={() => handleServiceClick('Nhập điểm trực tuyến')}>
            📝 Nhập điểm trực tuyến
          </button>

          {/* Nếu là Admin (Role 3) -> Hiển thị thêm 3 modules của Admin (Tổng cộng 9 modules trên HomePage) */}
          {isAdminUser && (
            <>
              <h3 className="admin-section-title">Phòng Đào Tạo / Admin</h3>
              <button className="service-btn" onClick={() => handleServiceClick('Duyệt Dịch Vụ Sinh Viên')}>
                📋 Duyệt Dịch Vụ Sinh Viên
              </button>
              <button className="service-btn" onClick={() => handleServiceClick('Quản Lý Đào Tạo')}>
                🛠️ Quản Lý Đào Tạo / Giảng Viên
              </button>
              <button className="service-btn" onClick={() => handleServiceClick('Điều chỉnh đăng ký môn học')}>
                📑 Điều chỉnh đăng ký môn học
              </button>
            </>
          )}
        </div>

        {/* Cột 3: Dịch vụ sinh viên */}
        <div className="mybk-column">
          <h2>Dịch vụ sinh viên</h2>
          <button className="service-btn" onClick={() => handleServiceClick('Đăng ký môn học')}>
            ✏️ Đăng ký môn học
          </button>
          <button className="service-btn" onClick={() => handleServiceClick('Đăng ký in giấy xác nhận')}>
            🖨️ Đăng ký in giấy xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;