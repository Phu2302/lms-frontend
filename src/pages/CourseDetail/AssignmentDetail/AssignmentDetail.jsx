import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AssignmentDetail.css';

function AssignmentDetail() {
  const navigate = useNavigate();
  const { assignmentId } = useParams(); // Lấy ID bài tập từ URL nếu cần

  // Cấu hình cứng ngày kết thúc (Deadline) lấy từ ảnh mẫu của bạn: 07:00:00 ngày 18/04/2026
  const deadlineDate = new Date('2026-04-18T07:00:00');

  // State lưu trữ chuỗi văn bản hiển thị thời gian còn lại/quá hạn
  const [timeRemainingText, setTimeRemainingText] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  // Hàm tính toán khoảng cách thời gian giữa Hiện tại và Deadline
  const calculateTime = () => {
    const now = new Date(); // Lấy thời gian thực tại thời điểm chạy trên máy
    const diffMs = deadlineDate - now; // Tính số miligiây chênh lệch

    if (diffMs < 0) {
      // Trường hợp: Đã quá hạn bài nộp (diffMs âm)
      setIsOverdue(true);
      const absDiff = Math.abs(diffMs);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemainingText(`Bài tập đã quá hạn: ${days} ngày ${hours} giờ`);
    } else {
      // Trường hợp: Vẫn còn hạn nộp bài
      setIsOverdue(false);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemainingText(`Bạn còn: ${days} ngày ${hours} giờ để hoàn thành`);
    }
  };

  // Tự động tính toán lại thời gian khi trang vừa được load lên
  useEffect(() => {
    calculateTime();
  }, []);

  return (
    <div className="assignment-container">
      
      {/* THANH NAVBAR ĐỒNG BỘ HỆ THỐNG */}
      <nav className="lms-navbar">
        <div className="navbar-left">
          <div className="nav-logo">BHX</div>
          <button className="nav-item" onClick={() => navigate('/lms')}>Trang chủ</button>
          <button className="nav-item active" onClick={() => navigate('/lms/course')}>Các khóa học của tôi</button>
        </div>
        <div className="navbar-right">
          <div className="nav-avatar">SV</div>
        </div>
      </nav>

      {/* THÂN TRANG CHI TIẾT BÀI TẬP */}
      <div className="assignment-body">
        
        {/* Nút quay lại trang bài học trước đó */}
        <button 
          onClick={() => window.history.back()} 
          style={{ marginBottom: '15px', cursor: 'pointer', padding: '5px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          ← Trở về môn học
        </button>

        <div className="assignment-course-title">
          Principles of Programming Languages (CO3005)_NGUYỄN HỨA PHÙNG (CLC_HK252) [CC04,CC05]
        </div>

        <div className="assignment-main-title">
          <span className="assignment-title-icon">📤</span>
          <span>Proj#3-Automation testing (Thu 7-Apr - extended 16:30 Sun 17-May)</span>
        </div>

        {/* Hộp thông tin chi tiết mốc thời gian */}
        <div className="info-box">
          <div className="info-line"><strong>Mở lúc:</strong> Thứ Hai, ngày 2 tháng 3 năm 2026, 00:00</div>
          <div className="info-line"><strong>Kết thức:</strong> Thứ Bảy, ngày 18 tháng 4 năm 2026, 07:00</div>
          
          <ul className="req-list">
            <li>• Group project submission: 4 types of files</li>
            <li>• Presentation (.PPTX)</li>
            <li>• WORD (.DOCX)</li>
            <li>• VIDEO (.mp4)</li>
          </ul>
        </div>

        {/* Nút tác vụ nộp bài */}
        <button className="submit-assignment-btn" onClick={() => alert('Mở cửa sổ chọn file từ máy tính...')}>
          Nộp bài
        </button>

        {/* Khung bảng trạng thái nộp bài */}
        <div className="status-table-title">Trạng thái nộp bài</div>
        
        <table className="status-table">
          <tbody>
            <tr>
              <td className="label-cell">Trạng thái nộp bài</td>
              <td className="value-cell">Chưa có bài nộp nào được tải lên</td>
            </tr>
            <tr>
              <td className="label-cell">Trạng thái chấm điểm</td>
              <td className="value-cell">Chưa chấm điểm</td>
            </tr>
            <tr>
              <td className="label-cell">Thời gian còn lại</td>
              {/* Áp dụng class màu sắc tùy thuộc vào việc bài tập đã quá hạn hay chưa */}
              <td className={`value-cell ${isOverdue ? 'text-overdue' : 'text-remaining'}`}>
                {timeRemainingText}
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default AssignmentDetail;