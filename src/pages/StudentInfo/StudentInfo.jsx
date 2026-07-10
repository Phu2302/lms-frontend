import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentInfo.css';

function StudentInfo() {
  const navigate = useNavigate();

  // Dữ liệu giả lập sinh viên Bách Khoa
  const [studentData] = useState({
    mssv: '183667',
    hoDem: 'Cristiano',
    ten: 'Ronaldo',
    ngaySinh: '31/02/2000',
    gioiTinh: 'Nam',
    lop: 'CC04',
    khoa: 'Khoa học và Kỹ thuật Máy tính',
    nganh: 'Khoa học Máy tính',
    bacDaoTao: 'Đại học chính quy',
    khoaHoc: '2023',
    email: 'ronaldo.cristiano@hcmut.edu.vn',
    queQuan: 'Bồ Đào Nha'
  });

  return (
    <div className="mybh-layout">
      
      {/* 1. NAVBAR NGANG PHÍA TRÊN */}
      <nav className="mybh-top-nav">
        <div className="nav-brand-box" onClick={() => navigate('/menu')} style={{ cursor: 'pointer' }}>
          myBH
        </div>
        <div className="nav-tabs-wrapper">
          <button className="nav-tab-btn active">Thông tin sinh viên</button>
          <button className="nav-tab-btn" onClick={() => alert('Chuyển sang phân hệ Thời khóa biểu')}>
            Thời khoá biểu
          </button>
          <button className="nav-tab-btn" onClick={() => alert('Chuyển sang phân hệ Lịch thi')}>
            Lịch thi
          </button>
        </div>
      </nav>

      {/* TẦNG DƯỚI: SIDEBAR VÀ NỘI DUNG CHÍNH */}
      <div className="mybh-main-body">
        
        {/* 2. SIDEBAR DỌC BÊN TRÁI */}
        <aside className="mybh-sidebar">
          <div className="sidebar-logo-container">BK</div>
          
          <div className="sidebar-menu-list">
            <button className="sidebar-item-btn active">
              ☰ Sinh viên
            </button>
            <button className="sidebar-item-btn" onClick={() => alert('Chuyển sang Dịch vụ')}>
              ☰ Dịch vụ
            </button>
            <button className="sidebar-item-btn" onClick={() => alert('Chuyển sang Bảng điểm')}>
              ☰ Bảng điểm
            </button>
          </div>
        </aside>

        {/* 3. VÙNG NỘI DUNG CHÍNH BÊN PHẢI */}
        <main className="mybh-content-area">
          <div className="info-card-wrapper">
            
            <div className="info-card-header">Thông tin cá nhân</div>
            
            <div className="info-card-body">
              
              {/* Ảnh đại diện */}
              <div className="student-avatar-box">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
                  alt="Avatar Sinh Viên" 
                />
              </div>

              {/* Lưới thông tin 5 cột chuẩn bố cục */}
              <div className="student-info-grid">
                
                {/* HÀNG 1 (Đúng theo ảnh chụp) */}
                <div className="info-field-item">
                  <span className="info-field-label">Mã số sinh viên</span>
                  <span className="info-field-value">{studentData.mssv}</span>
                </div>
                
                <div className="info-field-item">
                  <span className="info-field-label">Họ và tên lót</span>
                  <span className="info-field-value">{studentData.hoDem}</span>
                </div>
                
                <div className="info-field-item">
                  <span className="info-field-label">Tên</span>
                  <span className="info-field-value">{studentData.ten}</span>
                </div>
                
                <div className="info-field-item">
                  <span className="info-field-label">Ngày sinh</span>
                  <span className="info-field-value">{studentData.ngaySinh}</span>
                </div>
                
                <div className="info-field-item">
                  <span className="info-field-label">Giới tính</span>
                  <span className="info-field-value">{studentData.gioiTinh}</span>
                </div>

                {/* HÀNG 2 */}
                <div className="info-field-item">
                  <span className="info-field-label">Lớp danh nghĩa</span>
                  <span className="info-field-value">{studentData.lop}</span>
                </div>

                <div className="info-field-item">
                  <span className="info-field-label">Khóa học</span>
                  <span className="info-field-value">{studentData.khoaHoc}</span>
                </div>

                <div className="info-field-item">
                  <span className="info-field-label">Bậc đào tạo</span>
                  <span className="info-field-value">{studentData.bacDaoTao}</span>
                </div>

                <div className="info-field-item">
                  <span className="info-field-label">Quê quán</span>
                  <span className="info-field-value">{studentData.queQuan}</span>
                </div>

                <div className="info-field-item">
                  <span className="info-field-label">Trạng thái</span>
                  <span className="style" style={{ color: '#008b44', fontWeight: 'bold' }}>Đang học</span>
                </div>

                {/* HÀNG 3 (Dành cho các trường thông tin dài) */}
                <div className="info-field-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-field-label">Khoa quản lý</span>
                  <span className="info-field-value">{studentData.khoa}</span>
                </div>

                <div className="info-field-item" style={{ gridColumn: 'span 1' }}>
                  <span className="info-field-label">Ngành học</span>
                  <span className="info-field-value">{studentData.nganh}</span>
                </div>

                <div className="info-field-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-field-label">Email sinh viên</span>
                  <span className="info-field-value">{studentData.email}</span>
                </div>

              </div>

            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default StudentInfo;