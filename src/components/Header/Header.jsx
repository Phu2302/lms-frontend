import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAPI } from '../../api/auth/auth';
import { useToast } from '../Toast/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

function Header({ view }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout, isStudent } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy chữ cái đại diện cho Avatar
  const getInitials = () => {
    if (!user) return 'U';
    if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase();
    }
    if (user.user_name) {
      return user.user_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Vai trò hiển thị
  const getRoleLabel = () => {
    const roleStr = String(user?.role || '1');
    if (roleStr === '2') return { text: 'Giảng viên', bg: '#2b6cb0' };
    if (roleStr === '3') return { text: 'Quản trị viên', bg: '#805ad5' };
    return { text: 'Sinh viên', bg: '#008b44' };
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    logout();
    showToast('Đã đăng xuất thành công.', 'info');
    navigate('/');
  };

  const roleInfo = getRoleLabel();

  return (
    <nav className="lms-navbar">
      <div className="navbar-left">
        <div className="nav-logo" onClick={() => navigate('/lms')} style={{ cursor: 'pointer' }}>
          BHX
        </div>

        <button
          className={`nav-item ${view === 'home' ? 'active' : ''}`}
          onClick={() => navigate('/lms')}
        >
          Trang chủ
        </button>

        <button
          className={`nav-item ${view === 'courses' ? 'active' : ''}`}
          onClick={() => navigate('/lms/course')}
        >
          Các khóa học của tôi
        </button>

        <button
          className={`nav-item ${view === 'schedule' ? 'active' : ''}`}
          onClick={() => navigate('/lms/schedule')}
        >
          Thời khóa biểu
        </button>

        <button
          className={`nav-item ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => navigate('/lms/calendar')}
        >
          Lịch
        </button>
      </div>

      <div className="navbar-right">
        <button
          className="portal-home-link-btn"
          onClick={() => navigate('/')}
          title="Quay lại Trang chủ Cổng thông tin myBH"
          style={{
            background: '#008b44',
            color: '#ffffff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '0px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Trang chủ
        </button>
        <button
          className="nav-notification"
          onClick={() => showToast('Bạn chưa có thông báo mới.', 'info')}
          title="Thông báo"
        >
          🔔
        </button>

        <div className="avatar-wrapper" ref={dropdownRef}>
          <div
            className="nav-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
            title={user?.user_name || 'Tài khoản'}
          >
            {getInitials()}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-user-header">
                <strong className="dropdown-user-name">
                  {user?.last_name && user?.first_name
                    ? `${user.last_name} ${user.first_name}`
                    : user?.user_name || 'Người dùng'}
                </strong>
                <span className="role-badge" style={{ backgroundColor: roleInfo.bg }}>
                  {roleInfo.text}
                </span>
              </div>

              <hr className="dropdown-divider" />

              <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/'); }}>
                Trang chủ Cổng thông tin
              </button>
              <button className="dropdown-item" onClick={handleProfileClick}>
                👤 Profile
              </button>

              <button className="dropdown-item logout" onClick={handleLogout}>
                🚪 Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
