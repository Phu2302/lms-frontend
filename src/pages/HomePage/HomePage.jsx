import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastContext';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // dịch vụ nào cũng phải bị chặn lại nếu không đúng role!
  const handleServiceClick = (serviceName) => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currentUser?.role || '1');

    if (token) {
      if (serviceName === 'Thông tin sinh viên' || serviceName === 'Đăng ký in giấy xác nhận') {
        if (userRole === '2' || userRole === '3') {
          showToast('Khu vực "Thông tin sinh viên" chỉ dành riêng cho Sinh viên. Giảng viên và Admin không có quyền truy cập!', 'error');
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
        if (userRole === '2' || userRole === '3') {
          showToast('Chức năng "Đăng ký môn học" chỉ dành riêng cho Sinh viên!', 'error');
          return;
        }
        navigate('/course-registration');
        return;
      }
      if (serviceName === 'Quản lý giảng dạy') {
        navigate('/teaching-support');
        return;
      }
      if (serviceName === 'LMS') {
        navigate('/lms');
        return;
      }
      if (serviceName === 'Nhập điểm trực tuyến') {
        navigate('/online-grading');
        return;
      }
    }
    navigate('/login', { state: { targetService: serviceName } });
  };

  return (
    <div className="mybk-container">
      <div className="mybk-header">
        <div className="mybk-logo">BHX</div>
        <div className="mybk-title">
          <h1>HỆ THỐNG TIỆN ÍCH TRỰC TUYẾN (MY-BHX)</h1>
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

        {/* Cột 2: Giảng viên */}
        <div className="mybk-column">
          <h2>Giảng viên</h2>
          <button className="service-btn" onClick={() => handleServiceClick('Quản lý giảng dạy')}>
            🛠️ Hỗ trợ & Quản lý giảng dạy
          </button>
          <button className="service-btn" onClick={() => handleServiceClick('Nhập điểm trực tuyến')}>
            📝 Nhập điểm trực tuyến
          </button>
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