import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentInfo.css';

// Import các component con
import Timetable from './Timetable/Timetable';
import ExamSchedule from './ExamSchedule/ExamSchedule';
import Transcript from './Transcript/Transcript';
import Service from './Service/Service';

function StudentInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  // Trạng thái quản lý Sidebar (Sinh viên, Dịch vụ, Bảng điểm)
  const [activeSidebar, setActiveSidebar] = useState(location.state?.defaultTab || 'student');
  
  // Trạng thái quản lý Navbar (Thông tin, Thời khóa biểu, Lịch thi)
  // Chỉ ý nghĩa khi activeSidebar === 'student'
  const [activeNav, setActiveNav] = useState('info');

  // Dữ liệu giả lập sinh viên Bách Khoa (Phần Thông tin)
  const [studentData] = useState({
    mssv: '1234567',
    hoDem: 'Nguyễn Văn',
    ten: 'A',
    ngaySinh: '15/08/2004',
    gioiTinh: 'Nam',
    lop: 'IT01',
    khoa: 'Khoa Công nghệ Thông tin',
    nganh: 'Kỹ thuật Phần mềm',
    bacDaoTao: 'Đại học chính quy',
    khoaHoc: '2022',
    email: 'nguyenvana.1234567@hcmut.edu.vn',
    queQuan: 'Hà Nội'
  });

  return (
    <div className="mybh-layout">
      
      {/* 1. NAVBAR NGANG PHÍA TRÊN */}
      <nav className="mybh-top-nav">
        <div className="nav-brand-box" onClick={() => navigate('/menu')} style={{ cursor: 'pointer' }}>
          myBH
        </div>
        <div className="nav-tabs-wrapper">
          {/* Các mục con của "Sinh viên" chỉ hiển thị khi chọn "Sinh viên" ở Sidebar */}
          {activeSidebar === 'student' && (
            <>
              <button 
                className={`nav-tab-btn ${activeNav === 'info' ? 'active' : ''}`}
                onClick={() => setActiveNav('info')}
              >
                Thông tin sinh viên
              </button>
              <button 
                className={`nav-tab-btn ${activeNav === 'timetable' ? 'active' : ''}`} 
                onClick={() => setActiveNav('timetable')}
              >
                Thời khoá biểu
              </button>
              <button 
                className={`nav-tab-btn ${activeNav === 'exams' ? 'active' : ''}`} 
                onClick={() => setActiveNav('exams')}
              >
                Lịch thi
              </button>
            </>
          )}
          
          {/* Đối với Bảng điểm và Dịch vụ */}
          {activeSidebar === 'transcript' && (
            <div style={{ color: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', fontWeight: 'bold' }}>
              Tra cứu bảng điểm
            </div>
          )}
          {activeSidebar === 'service' && (
            <div style={{ color: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', fontWeight: 'bold' }}>
              Dịch vụ sinh viên
            </div>
          )}
        </div>
      </nav>

      {/* TẦNG DƯỚI: SIDEBAR VÀ NỘI DUNG CHÍNH */}
      <div className="mybh-main-body">
        
        {/* 2. SIDEBAR DỌC BÊN TRÁI */}
        <aside className="mybh-sidebar">
          <div className="sidebar-logo-container">BK</div>
          
          <div className="sidebar-menu-list">
            <button 
              className={`sidebar-item-btn ${activeSidebar === 'student' ? 'active' : ''}`}
              onClick={() => setActiveSidebar('student')}
            >
              ☰ Sinh viên
            </button>
            <button 
              className={`sidebar-item-btn ${activeSidebar === 'service' ? 'active' : ''}`} 
              onClick={() => setActiveSidebar('service')}
            >
              ☰ Dịch vụ
            </button>
            <button 
              className={`sidebar-item-btn ${activeSidebar === 'transcript' ? 'active' : ''}`} 
              onClick={() => setActiveSidebar('transcript')}
            >
              ☰ Bảng điểm
            </button>
          </div>
        </aside>

        {/* 3. VÙNG NỘI DUNG CHÍNH BÊN PHẢI */}
        <main className="mybh-content-area">
          <div className="info-card-wrapper">
            
            <div className="info-card-header">
              {activeSidebar === 'student' && activeNav === 'info' && 'Thông tin cá nhân'}
              {activeSidebar === 'student' && activeNav === 'timetable' && 'Thời khóa biểu trong tuần'}
              {activeSidebar === 'student' && activeNav === 'exams' && 'Lịch thi học kỳ'}
              {activeSidebar === 'transcript' && 'Kết quả học tập'}
              {activeSidebar === 'service' && 'Dịch vụ trực tuyến'}
            </div>
            
            <div className="info-card-body">
              
              {/* Nếu chọn Sidebar là Sinh viên -> Kiểm tra xem Nav đang là gì */}
              {activeSidebar === 'student' && activeNav === 'info' && (
                <>
                  <div className="student-avatar-box">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
                      alt="Avatar Sinh Viên" 
                    />
                  </div>

                  <div className="student-info-grid">
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
                </>
              )}

              {activeSidebar === 'student' && activeNav === 'timetable' && (
                <Timetable />
              )}

              {activeSidebar === 'student' && activeNav === 'exams' && (
                <ExamSchedule />
              )}

              {/* Nếu chọn Sidebar là Bảng điểm */}
              {activeSidebar === 'transcript' && (
                <Transcript />
              )}

              {/* Nếu chọn Sidebar là Dịch vụ */}
              {activeSidebar === 'service' && (
                <Service />
              )}

            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default StudentInfo;