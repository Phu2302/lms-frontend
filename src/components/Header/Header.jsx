import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAPI } from '../../api/auth/auth';

function Header({ view }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = currentUser.user_name ? currentUser.user_name.substring(0, 2).toUpperCase() : 'SV';

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

  return (
    <nav className="lms-navbar">
      <div className="navbar-left">
        <div className="nav-logo">BHX</div>
        
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
        <button className="nav-notification" onClick={() => alert('Không có thông báo.')}>🔔</button>
        <div className="avatar-wrapper">
          <div className="nav-avatar" onClick={() => setShowDropdown(!showDropdown)}>{userInitials}</div>
          {showDropdown && (
            <div className="dropdown-menu">
              <button className="dropdown-item">👤 Profile</button>
              <button className="dropdown-item logout" onClick={handleLogout}>🚪 Log out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
