import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './RolePage.css';

function RolePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Nhận tên dịch vụ được truyền sang từ trang chủ
  const targetService = location.state?.targetService || 'Hệ thống';

  const handleSelectRole = (role) => {
    // Chuyển tiếp sang trang login kèm thông tin vai trò và đích đến
    navigate('/login', { state: { role: role, targetService: targetService } });
  };

  return (
    <div className="role-container">
      <div className="role-box">
        <h2>XÁC THỰC VAI TRÒ TRUY CẬP</h2>
        <p>Bạn đang vào dịch vụ: <strong>{targetService}</strong>. Vui lòng chọn đúng vai trò của bạn:</p>
        
        {/* Vùng chứa 3 hộp màu vàng nằm ngang */}
        <div className="role-options">
          
          {/* Hộp Sinh Viên */}
          <button className="role-card" onClick={() => handleSelectRole('sinhvien')}>
            <div className="role-card-icon">👨‍🎓</div>
            <div className="role-card-text">Sinh Viên</div>
          </button>

          {/* Hộp Giảng Viên */}
          <button className="role-card" onClick={() => handleSelectRole('giangvien')}>
            <div className="role-card-icon">👩‍🏫</div>
            <div className="role-card-text">Giảng Viên</div>
          </button>

          {/* Hộp Admin */}
          <button className="role-card" onClick={() => handleSelectRole('admin')}>
            <div className="role-card-icon">🛡️</div>
            <div className="role-card-text">Quản Trị Viên</div>
          </button>

        </div>
      </div>
    </div>
  );
}

export default RolePage;