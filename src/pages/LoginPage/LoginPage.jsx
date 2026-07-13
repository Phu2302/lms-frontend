import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = location.state?.role || 'sinhvien';
  const targetService = location.state?.targetService || 'LMS';

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    if (!user || !pass) {
      alert('Vui lòng điền đầy đủ tài khoản mật khẩu!');
      return;
    }

    // --- LOGIC PHÂN QUYỀN VÀ DI TRÚ ĐÍCH ĐẾN ---
    
    // 1. Quyền Admin tối cao: Cho đi mọi ngõ ngách
    if (role === 'admin') {
      alert(`[ADMIN] Đăng nhập thành công! Đang vào: ${targetService}`);
      if (targetService === 'Thông tin sinh viên') {
        navigate('/student-info');
      } else {
        navigate('/lms');
      }
      return;
    }

    // 2. Kiểm tra chặn Giảng viên xem trộm thông tin riêng tư của Sinh viên
    if ((targetService === 'Thông tin sinh viên' || targetService === 'Đăng ký môn học' || targetService === 'Đăng ký in giấy xác nhận sinh viên') && role === 'giangvien') {
      alert('LỖI TRUY CẬP: Khu vực này chỉ dành riêng cho Sinh Viên!');
      navigate('/');
      return;
    }

    // 3. Kiểm tra chặn Sinh viên nhảy vào phân hệ của Giảng viên
    if ((targetService === 'Quản lý giảng dạy' || targetService === 'Nhập điểm trực tuyến') && role === 'sinhvien') {
      alert('LỖI TRUY CẬP: Dịch vụ này chỉ dành riêng cho Giảng Viên!');
      navigate('/');
      return;
    }

    // 4. Nếu vượt qua bộ lọc thành công -> Điều hướng động theo đúng dịch vụ đã bấm ban đầu
    alert(`Đăng nhập thành công với vai trò ${role.toUpperCase()}!`);
    
    if (targetService === 'Thông tin sinh viên') {
      navigate('/student-info'); 
    } else if (targetService === 'Đăng ký in giấy xác nhận sinh viên') {
      navigate('/student-info', { state: { defaultTab: 'service' } });
    } else if (targetService === 'Đăng ký môn học') {
      navigate('/course-registration');
    } else {
      navigate('/lms'); // Nhảy vào hệ thống học tập LMS
    }
  };

  const roleNames = { sinhvien: 'SINH VIÊN', giangvien: 'GIẢNG VIÊN', admin: 'ADMIN QUẢN TRỊ' };

  return (
    <div className={`login-container ${role === 'admin' ? 'theme-admin' : 'theme-user'}`}>
      <div className="login-box">
        <h3>CỔNG ĐĂNG NHẬP: {roleNames[role]}</h3>
        <p style={{ fontSize: '13px', textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Đang xác thực để vào: <strong>{targetService}</strong>
        </p>

        <form onSubmit={handleLoginSubmit}>
          <div className="input-grp">
            <label>Tài khoản</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="Nhập tài khoản..." />
          </div>
          <div className="input-grp">
            <label>Mật khẩu</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nhập mật khẩu..." />
          </div>
          <button type="submit" className="submit-btn">Xác Nhận Đăng Nhập</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;