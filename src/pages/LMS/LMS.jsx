import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserClassesAPI } from '../../api/StudentInfo/Profile/users';
import Header from '../../components/Header/Header';
import './LMS.css';

function LMS({ view }) { // Nhận biến view từ App.jsx gửi sang
  const navigate = useNavigate();


  // Phân trang (Tối đa 10 môn trên 1 trang - bấm chuyển trang không đổi URL)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mảng màu sắc cho khối hình chữ nhật
  const bgColors = ['#ff9f43', '#0abde3', '#10ac84', '#ee5253', '#5f27cd', '#ff6b6b', '#48dbfb', '#1dd1a1', '#00d2d3', '#54a0ff'];

  // State cho dữ liệu từ API
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy thông tin user từ localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Gọi API lấy danh sách classes khi vào tab Courses
  useEffect(() => {
    if (view === 'courses') {
      fetchCourses();
    }
  }, [view]);

  // Reset về trang 1 khi thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserClassesAPI();
      // Map dữ liệu từ API sang format hiển thị
      const classes = Array.isArray(res.data) ? res.data : [];
      setCoursesData(classes.map(cls => ({
        id: cls.class_id || cls.id,
        code: cls.class_code || cls.course_code || '',
        title: cls.class_name || cls.course_name || `Lớp ${cls.class_id || cls.id}`,
        faculty: cls.faculty_name || cls.department || ''
      })));
    } catch (err) {
      console.error('Lỗi tải danh sách lớp học:', err);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredCourses = coursesData.filter(course => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      (course.title && course.title.toLowerCase().includes(query)) ||
      (course.code && course.code.toLowerCase().includes(query)) ||
      (course.faculty && course.faculty.toLowerCase().includes(query)) ||
      String(course.id).toLowerCase().includes(query)
    );
  });

  // Chia mảng dữ liệu theo trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;

  const handleCourseClick = (courseId) => {
    // Chuyển sang URL chi tiết của khóa học đó
    navigate(`/lms/course/${courseId}`);
  };

  return (
    <div className="lms-container">
      
      {/* NAVBAR PHÍA TRÊN */}
      <Header view={view} />

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="lms-content">
        {view === 'home' ? (
          <div>
            <h2>Trang Chủ LMS</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Chào mừng {currentUser.user_name || 'bạn'} quay lại hệ thống học tập trực tuyến!
            </p>
          </div>
        ) : (
          
          // --- DIỆN MẠO TAB CÁC KHÓA HỌC CỦA TÔI ---
          <div>
            <h1 className="courses-page-title">Các khóa học của tôi</h1>
            
            <div className="courses-main-box">
              <div className="courses-banner-header">Tổng quan về khóa học</div>
              
              <div className="courses-controls-row">
                <input 
                  type="text" 
                  className="search-box-input" 
                  placeholder="Tìm kiếm môn học theo tên, mã môn..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <h2 className="semester-section-title">• Học kỳ (Semester) 2/2025-2026</h2>

              {/* Loading state */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  ⏳ Đang tải danh sách lớp học...
                </div>
              )}

              {/* Error state */}
              {error && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#c00', background: '#fee', borderRadius: '8px', margin: '10px 0' }}>
                  {error}
                  <br />
                  <button onClick={fetchCourses} style={{ marginTop: '10px', padding: '6px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>
                    Thử lại
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && filteredCourses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  {searchQuery.trim() ? '🔍 Không tìm thấy môn học phù hợp với từ khóa.' : '📭 Bạn chưa được đăng ký vào lớp học nào.'}
                </div>
              )}

              {/* Danh sách courses */}
              {!loading && !error && currentCourses.map((course, index) => {
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
              {filteredCourses.length > itemsPerPage && (
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