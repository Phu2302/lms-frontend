import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginAPI } from '../../api/auth/auth';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || location.state?.from;
  const targetService = location.state?.targetService || 'LMS';

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Đăng Nhập - BK LMS';
  }, []);

  // Nếu đã có JWT token → tự động chuyển hướng, không cần đăng nhập lại
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currentUser?.role || '1');

    if (token) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
        return;
      }

      if (targetService === 'Nhập điểm trực tuyến') {
        navigate('/online-grading', { replace: true });
        return;
      } else if (targetService === 'Quản lý giảng dạy') {
        navigate('/teaching-support', { replace: true });
        return;
      }
      if (targetService === 'Các khóa học của tôi') {
        navigate('/lms/course', { replace: true });
      } else if (targetService === 'Thông tin sinh viên') {
        navigate('/student-info?tab=info', { replace: true });
      } else if (targetService === 'Đăng ký in giấy xác nhận') {
        navigate('/student-info?tab=service', { replace: true, state: { defaultTab: 'service' } });
      } else if (targetService === 'Đăng ký môn học') {
        navigate('/course-registration', { replace: true });
      } else {
        navigate('/lms', { replace: true });
      }
    }
  }, [navigate, targetService, redirectUrl]);

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

      // Lưu token và thông tin user vào localStorage đồng thời cập nhật AuthContext state
      login(res.data.token, res.data.user);

      // Điều hướng dựa trên role từ backend
      const userRole = String(res.data.user.role);

      if ((targetService === 'Thông tin sinh viên' || targetService === 'Đăng ký in giấy xác nhận') && (userRole === '2' || userRole === '3')) {
        setError('LỖI TRUY CẬP: Khu vực "Thông tin sinh viên" chỉ dành riêng cho Sinh Viên! Giảng viên và Admin không có quyền truy cập.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // Điều hướng động theo redirect parameter hoặc dịch vụ đã chọn
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (targetService === 'Các khóa học của tôi') {
        navigate('/lms/course');
      } else if (targetService === 'Thông tin sinh viên') {
        navigate('/student-info?tab=info');
      } else if (targetService === 'Đăng ký in giấy xác nhận') {
        navigate('/student-info?tab=service', { state: { defaultTab: 'service' } });
      } else if (targetService === 'Đăng ký môn học') {
        navigate('/course-registration');
      } else if (targetService === 'Nhập điểm trực tuyến') {
        navigate('/online-grading');
      } else if (targetService === 'Quản lý giảng dạy') {
        navigate('/teaching-support');
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