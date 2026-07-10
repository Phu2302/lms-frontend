import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LMS.css';

function LMS({ view }) { // Nhận biến view từ App.jsx gửi sang
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Phân trang (Tối đa 10 môn trên 1 trang - bấm chuyển trang không đổi URL)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mảng màu sắc cho khối hình chữ nhật
  const bgColors = ['#ff9f43', '#0abde3', '#10ac84', '#ee5253', '#5f27cd', '#ff6b6b', '#48dbfb', '#1dd1a1', '#00d2d3', '#54a0ff'];

  // Mock dữ liệu 12 môn học
  const [coursesData] = useState([
    { id: 'CO3005', title: 'Principles of Programming Languages (CO3005)_NGUYỄN HỨA PHÙNG (CLC_HK252) [CC04,CC05]', faculty: 'Khoa Học Máy Tính' },
    { id: 'MT2013', title: 'Probability and Statistics (MT2013)_NGUYỄN TIẾN DŨNG (CLC_HK242) [CC02,CC10,CC12]', faculty: 'Toán ứng Dụng' },
    { id: 'CO2007', title: 'Computer Architecture (CO2007)_PHẠM QUỐC CƯỜNG (CLC_HK241) [CC01,CC02,CC03,CC04,CC05]', faculty: 'Khoa Học Máy Tính' },
    { id: 'CO1001', title: 'Nhập môn Điện toán (CO1001)_TRẦN MINH TRIẾT (CLC_HK252)', faculty: 'Khoa Học Máy Tính' },
    { id: 'CO2011', title: 'Mạng máy tính (CO2011)_LÊ VĂN TRUNG (CLC_HK252)', faculty: 'Kỹ Thuật Máy Tính' },
    { id: 'CO2013', title: 'Hệ điều hành (CO2013)_NGUYỄN BẢO TRUNG (CLC_HK252)', faculty: 'Khoa Học Máy Tính' },
    { id: 'CO3001', title: 'Cơ sở dữ liệu (CO3001)_PHẠM NGUYỄN CƯƠNG (CLC_HK252)', faculty: 'Hệ thống thông tin' },
    { id: 'CO3003', title: 'Kỹ thuật phần mềm (CO3003)_TRẦN NGỌC BẢO (CLC_HK252)', faculty: 'Công nghệ phần mềm' },
    { id: 'CO3007', title: 'Trí tuệ nhân tạo (CO3007)_VŨ HẢI QUÂN (CLC_HK252)', faculty: 'Khoa Học Máy Tính' },
    { id: 'CO3009', title: 'An ninh mạng (CO3009)_ĐẶNG TRẦN KHÁNH (CLC_HK252)', faculty: 'Kỹ Thuật Máy Tính' },
    { id: 'MT1001', title: 'Giải tích 1 (MT1001)_LÊ THỊ THU HÀ (CLC_HK252)', faculty: 'Toán ứng Dụng' },
    { id: 'MT1003', title: 'Đại số tuyến tính (MT1003)_NGUYỄN ĐÌNH HUY (CLC_HK252)', faculty: 'Toán ứng Dụng' }
  ]);

  // Chia mảng dữ liệu theo trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = coursesData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(coursesData.length / itemsPerPage);

  const handleCourseClick = (courseId) => {
    // Chuyển sang URL chi tiết của khóa học đó
    navigate(`/lms/course/${courseId}`);
  };

  return (
    <div className="lms-container">
      
      {/* NAVBAR PHÍA TRÊN */}
      <nav className="lms-navbar">
        <div className="navbar-left">
          <div className="nav-logo">BHX</div>
          
          {/* Bấm vào chữ Trang chủ thì đổi URL về /lms */}
          <button 
            className={`nav-item ${view === 'home' ? 'active' : ''}`} 
            onClick={() => navigate('/lms')}
          >
            Trang chủ
          </button>
          
          {/* Bấm vào chữ Khóa học thì đổi URL về /lms/course */}
          <button 
            className={`nav-item ${view === 'courses' ? 'active' : ''}`} 
            onClick={() => { navigate('/lms/course'); setCurrentPage(1); }}
          >
            Các khóa học của tôi
          </button>
        </div>

        <div className="navbar-right">
          <button className="nav-notification" onClick={() => alert('Không có thông báo.')}>🔔</button>
          <div className="avatar-wrapper">
            <div className="nav-avatar" onClick={() => setShowDropdown(!showDropdown)}>SV</div>
            {showDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item">👤 Profile</button>
                <button className="dropdown-item logout" onClick={() => navigate('/')}>🚪 Log out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="lms-content">
        {view === 'home' ? (
          <div>
            <h2>Trang Chủ LMS</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>Chào mừng bạn quay lại hệ thống học tập trực tuyến!</p>
          </div>
        ) : (
          
          // --- DIỆN MẠO TAB CÁC KHÓA HỌC CỦA TÔI ---
          <div>
            <h1 className="courses-page-title">Các khóa học của tôi</h1>
            
            <div className="courses-main-box">
              <div className="courses-banner-header">Tổng quan về khóa học</div>
              
              <div className="courses-controls-row">
                <input type="text" className="search-box-input" placeholder="Tìm kiếm môn học..." />
              </div>

              <h2 className="semester-section-title">• Học kỳ (Semester) 2/2025-2026</h2>

              {currentCourses.map((course, index) => {
                const globalIndex = indexOfFirstItem + index;
                const assignedColor = bgColors[globalIndex % bgColors.length];

                return (
                  <div key={course.id} className="course-row-item">
                    
                    {/* KHỐI HÌNH CHỮ NHẬT: Thêm sự kiện onClick để bấm vào hộp cũng chuyển trang được luôn */}
                    <div 
                      className="course-thumbnail-placeholder" 
                      style={{ backgroundColor: assignedColor }}
                      onClick={() => handleCourseClick(course.id)}
                    ></div>
                    
                    <div className="course-info-block">
                      <div className="course-link-title" onClick={() => handleCourseClick(course.id)}>
                        {course.title}
                      </div>
                      <p className="course-faculty-text">{course.faculty}</p>
                    </div>
                  </div>
                );
              })}

              {/* ĐIỀU KHIỂN CHUYỂN TRANG (Nội bộ trang, không đổi URL) */}
              {coursesData.length > itemsPerPage && (
                <div className="pagination-row">
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trang trước
                  </button>
                  <span className="page-info">Trang {currentPage} / {totalPages}</span>
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Trang sau
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default LMS;