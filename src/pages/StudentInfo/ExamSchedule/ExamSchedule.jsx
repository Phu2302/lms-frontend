import React, { useState, useEffect } from 'react';
import { getUserExamsAPI } from '../../../api/StudentInfo/ExamSchedule/exams';
import './ExamSchedule.css';

function ExamSchedule() {
  const [selectedSemester, setSelectedSemester] = useState('20252');
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy thông tin sinh viên từ localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = `${currentUser.user_name?.toUpperCase() || 'SINH VIÊN'} (${currentUser.user_id || ''})`;

  useEffect(() => {
    fetchExams();
  }, [selectedSemester]);

  const fetchExams = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getUserExamsAPI(selectedSemester);
      setExams(res.data || []);
    } catch (err) {
      console.error('Error fetching exam schedule:', err);
      setError('Không thể tải lịch thi từ hệ thống (API /users/exams chưa có sẵn).');
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="exam-schedule-container">
      <h2 className="exam-schedule-title">LỊCH KIỂM TRA - THI HỌC KỲ</h2>
      <div className="exam-schedule-student-info">
        Họ tên: <strong>{studentName}</strong>
      </div>
      
      <div className="exam-schedule-controls">
        <select 
          className="semester-select" 
          value={selectedSemester} 
          onChange={(e) => setSelectedSemester(e.target.value)}
          disabled={isLoading}
        >
          <option value="20252">20252 - Học kỳ 2 Năm học 2025 - 2026</option>
          <option value="20251">20251 - Học kỳ 1 Năm học 2025 - 2026</option>
        </select>
      </div>

      {error && <div className="exam-error-message">{error}</div>}

      <div className="table-responsive">
        <table className="student-data-table">
          <thead>
            <tr>
              <th>Học kỳ</th>
              <th>Môn học</th>
              <th>Nhóm lớp</th>
              <th>Ngày thi</th>
              <th>Loại thi</th>
              <th>Cơ sở</th>
              <th>Mã phòng</th>
              <th>Thứ</th>
              <th>Giờ bắt đầu</th>
              <th>Tổng số phút</th>
              <th>Cập nhật cuối cùng vào lúc</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="11" className="empty-message">Đang tải dữ liệu...</td>
              </tr>
            ) : exams.length > 0 ? (
              exams.map((item, idx) => (
                <tr key={item.id || item.exam_id || idx}>
                  <td>{item.hocKy || item.semester_id}</td>
                  <td>{item.monHoc || item.course_name}</td>
                  <td>{item.nhom || item.class_code}</td>
                  <td>{item.ngayThi || item.exam_date}</td>
                  <td>{item.loaiThi || item.exam_type}</td>
                  <td>{item.coSo || item.location}</td>
                  <td>{item.phong || item.room_name}</td>
                  <td>{item.thu || item.day_of_week}</td>
                  <td>{item.gioBatDau || item.start_time}</td>
                  <td>{item.thoiGian || item.duration}</td>
                  <td>{item.capNhat || item.updated_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="empty-message">
                  Không có dữ liệu lịch thi cho học kỳ này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExamSchedule;
