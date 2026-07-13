import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CourseDetail.css';

function CourseDetail() {
  const { courseId } = useParams(); // Lấy mã môn học từ URL (ví dụ: CO3005)
  const navigate = useNavigate();

  // State quản lý Tab nào đang bật (mặc định là 'khoahoc')
  const [activeTab, setActiveTab] = useState('khoahoc');

  // State quản lý trạng thái đóng/mở của 3 khối Accordion (Mặc định khối đầu tiên mở = true, 2 khối sau đóng = false)
  const [openSections, setOpenSections] = useState([true, false, false]);

  // Hàm đảo ngược trạng thái đóng/mở khi click vào Header của Accordion
  const toggleSection = (index) => {
    const updatedSections = [...openSections];
    updatedSections[index] = !updatedSections[index];
    setOpenSections(updatedSections);
  };

  return (
    <div className="course-detail-container">
      
      {/* TẬN DỤNG LẠI THANH NAVBAR NGANG TRÊN CÙNG ĐỂ ĐỒ ÁN ĐỒNG BỘ */}
      <nav className="lms-navbar">
        <div className="navbar-left">
          <div className="nav-logo">BHX</div>
          <button className="nav-item" onClick={() => navigate('/lms')}>Trang chủ</button>
          <button className="nav-item active" onClick={() => navigate('/lms/course')}>Các khóa học của tôi</button>
        </div>
        <div className="navbar-right">
          <button className="nav-notification" onClick={() => alert('Không có thông báo.')}>🔔</button>
          <div className="nav-avatar" style={{ cursor: 'default' }}>SV</div>
        </div>
      </nav>

      {/* NỘI DUNG CHI TIẾT LỚP HỌC */}
      <div className="course-detail-body">
        
        {/* Nút quay lại danh sách nhanh */}
        <button 
          onClick={() => navigate('/lms/course')} 
          style={{ marginBottom: '15px', cursor: 'pointer', padding: '5px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          ← Trở về danh sách môn
        </button>

        {/* Tên môn học đầy đủ lấy theo mã môn trên URL */}
        <h1 className="course-detail-title">
          Principles of Programming Languages ({courseId || 'CO3005'})_NGUYỄN HỨA PHÙNG (CLC_HK252) [CC04,CC05]
        </h1>

        {/* THANH CHỨA TÁC VỤ TAB (Khóa học / Điểm) */}
        <div className="tabs-bar">
          <button 
            className={`tab-button ${activeTab === 'khoahoc' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('khoahoc')}
          >
            Khóa học
          </button>
          <button 
            className={`tab-button ${activeTab === 'diem' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('diem')}
          >
            Điểm
          </button>
        </div>

        {/* NỘI DUNG HIỂN THỊ DƯỚI TAB */}
        {activeTab === 'khoahoc' ? (
          
          // --- DIỆN MẠO TAB KHÓA HỌC (CHỨA CÁC ACCORDION) ---
          <div className="accordion-wrapper">
            
            {/* ACCORDION 1: SYNTAX ANALYSIS (ĐẦY ĐỦ NHƯ ẢNH MẪU) */}
            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleSection(0)}>
                <div className="accordion-header-left">
                  <span className={`accordion-arrow ${openSections[0] ? 'open' : 'closed'}`}>
                    {openSections[0] ? '▼' : '▶'}
                  </span>
                  <span className="accordion-title">Syntax Analysis</span>
                </div>
              </div>
              
              {/* Nội dung xổ xuống nếu mở */}
              {openSections[0] && (
                <div className="accordion-content">
                  <div className="content-row" onClick={() => alert('Đang tải file tài liệu PDF...')}>
                    <span className="content-icon">📄</span>
                    <span>Tips ko rớt PPL của Nguyễn Hứa Phùng</span>
                  </div>
                  <div className="content-row" onClick={() => navigate('/lms/quiz/syntax-quiz')}>
                    <span className="content-icon">📝</span>
                    <span>Syntax Quiz</span>
                  </div>
                  <div className="content-row" onClick={() => alert('Đang vào diễn đàn thảo luận học thuật...')}>
                    <span className="content-icon">💬</span>
                    <span>Forum</span>
                  </div>
                  <div className="content-row" onClick={() => navigate('/lms/assignment/proj3')}>
                    <span className="content-icon">📤</span>
                    <span>Group project submission</span>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 2: TRỐNG THEO YÊU CẦU */}
            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleSection(1)}>
                <div className="accordion-header-left">
                  <span className={`accordion-arrow ${openSections[1] ? 'open' : 'closed'}`}>
                    {openSections[1] ? '▼' : '▶'}
                  </span>
                  <span className="accordion-title">Semantic Analysis (Bài giảng số 2)</span>
                </div>
              </div>
              {openSections[1] && (
                <div className="accordion-content">
                  <div className="empty-content-text">Chưa có tài liệu hoặc hoạt động nào cho chương này.</div>
                </div>
              )}
            </div>

            {/* ACCORDION 3: TRỐNG THEO YÊU CẦU */}
            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleSection(2)}>
                <div className="accordion-header-left">
                  <span className={`accordion-arrow ${openSections[2] ? 'open' : 'closed'}`}>
                    {openSections[2] ? '▼' : '▶'}
                  </span>
                  <span className="accordion-title">Code Generation & Optimization (Bài giảng số 3)</span>
                </div>
              </div>
              {openSections[2] && (
                <div className="accordion-content">
                  <div className="empty-content-text">Giảng viên chưa cập nhật bài học cho chương này.</div>
                </div>
              )}
            </div>

          </div>

        ) : (
          // --- DIỆN MẠO TAB ĐIỂM SỐ ---
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
            <h3>Bảng điểm chi tiết môn học</h3>
            <p style={{ marginTop: '10px', color: '#666' }}>Chưa có dữ liệu điểm số đồng bộ cho học kỳ này.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default CourseDetail;
