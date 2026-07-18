import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginAPI } from '../../api/auth/auth';
import './LoginPage.css';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const targetService = location.state?.targetService || 'LMS';

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu đã có JWT token → tự động chuyển hướng, không cần đăng nhập lại
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (targetService === 'Thông tin sinh viên') {
        navigate('/student-info', { replace: true });
      } else if (targetService === 'Đăng ký in giấy xác nhận') {
        navigate('/student-info', { replace: true, state: { defaultTab: 'service' } });
      } else if (targetService === 'Đăng ký môn học') {
        navigate('/course-registration', { replace: true });
      } else {
        navigate('/lms', { replace: true });
      }
    }
  }, [navigate, targetService]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user || !pass) {
      setError('Vui lòng điền đầy đủ tài khoản mật khẩu!');
      return;
    }

    setLoading(true);

    try {
      // Gọi API đăng nhập thật từ backend
      const res = await loginAPI(user, pass);

      // Lưu token và thông tin user vào localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Điều hướng dựa trên role từ backend hoặc targetService
      const userRole = String(res.data.user.role);

      if (targetService === 'Thông tin sinh viên' && userRole === '2') {
        // role 2 = giảng viên → chặn giảng viên xem thông tin sinh viên
        setError('LỖI TRUY CẬP: Khu vực này chỉ dành riêng cho Sinh Viên!');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // Điều hướng động theo dịch vụ đã chọn
      if (targetService === 'Thông tin sinh viên') {
        navigate('/student-info');
      } else if (targetService === 'Đăng ký in giấy xác nhận') {
        navigate('/student-info', { state: { defaultTab: 'service' } });
      } else if (targetService === 'Đăng ký môn học') {
        navigate('/course-registration');
      } else {
        navigate('/lms');
      }
    } catch (err) {
      // Hiển thị lỗi từ backend
      const errorMsg = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container theme-user">
      <div className="login-box">
        <h3>CỔNG ĐĂNG NHẬP HỆ THỐNG</h3>
        <p style={{ fontSize: '13px', textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Đang xác thực để vào: <strong>{targetService}</strong>
        </p>
        
        {error && (
          <div style={{
            background: '#fee',
            color: '#c00',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '13px',
            textAlign: 'center',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          <div className="input-grp">
            <label>Tài khoản</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="Nhập tài khoản..." />
          </div>
          <div className="input-grp">
            <label>Mật khẩu</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nhập mật khẩu..." />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Xác Nhận Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;