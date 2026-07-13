import React, { useState, useEffect } from 'react';
import './ExamSchedule.css';

function ExamSchedule() {
  const [selectedSemester, setSelectedSemester] = useState('20252');
  const [examData, setExamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Giả lập gọi API lấy dữ liệu lịch thi
  useEffect(() => {
    setIsLoading(true);
    // TODO: Thay thế bằng API fetch data thật sau này
    // Ví dụ: axios.get(`/api/exams?semester=${selectedSemester}`).then(...)
    setTimeout(() => {
      const mockData = {
        '20252': {
          semesterName: '20252 - Học kỳ 2 Năm học 2025 - 2026',
          studentName: 'NGUYỄN VĂN A (1234567)',
          exams: [
            { id: 1, hocKy: '20252', monHoc: 'IM1019 - Tiếp thị Căn bản', nhom: 'CC03_B_Thi', ngayThi: '2026-06-02', loaiThi: 'CK', coSo: 'BK-CS1', phong: 'B1-306', thu: '3', gioBatDau: '07g00', thoiGian: '70', capNhat: '2026-04-15 12:04:00' },
            { id: 2, hocKy: '20252', monHoc: 'SP1039 - Lịch sử Đảng Cộng sản Việt Nam', nhom: 'CC05_D_Thi', ngayThi: '2026-05-20', loaiThi: 'CK', coSo: 'BK-CS1', phong: 'B1-308', thu: '4', gioBatDau: '09g30', thoiGian: '50', capNhat: '2026-04-15 12:04:00' },
            { id: 3, hocKy: '20252', monHoc: 'CO3005 - Nguyên lý Ngôn ngữ Lập trình', nhom: 'CC04_B_Thi', ngayThi: '2026-06-04', loaiThi: 'CK', coSo: 'BK-CS1', phong: 'B6-303', thu: '5', gioBatDau: '09g30', thoiGian: '90', capNhat: '2026-04-15 12:04:00' },
            { id: 4, hocKy: '20252', monHoc: 'IM1025 - Quản lý Dự án cho Kỹ sư', nhom: 'CC03_A_Ktr', ngayThi: '2026-03-18', loaiThi: 'GK', coSo: 'BK-CS1', phong: 'B4-502', thu: '4', gioBatDau: '09g00', thoiGian: '50', capNhat: '2026-02-12 10:02:00' },
            { id: 5, hocKy: '20252', monHoc: 'IM1025 - Quản lý Dự án cho Kỹ sư', nhom: 'CC03_A_Thi', ngayThi: '2026-06-02', loaiThi: 'CK', coSo: 'BK-CS1', phong: 'B4-403', thu: '3', gioBatDau: '13g00', thoiGian: '70', capNhat: '2026-04-15 12:04:00' },
            { id: 6, hocKy: '20252', monHoc: 'CO3005 - Nguyên lý Ngôn ngữ Lập trình', nhom: 'CC04_B_Ktr', ngayThi: '2026-03-17', loaiThi: 'GK', coSo: 'BK-CS1', phong: 'B4-501', thu: '3', gioBatDau: '13g00', thoiGian: '60', capNhat: '2026-02-12 10:02:00' },
            { id: 7, hocKy: '20252', monHoc: 'CO3015 - Kiểm tra Phần mềm', nhom: 'CC01_B_Thi', ngayThi: '2026-06-05', loaiThi: 'CK', coSo: 'BK-CS1', phong: 'B4-305', thu: '6', gioBatDau: '15g30', thoiGian: '100', capNhat: '2026-04-15 12:04:00' }
          ]
        },
        '20251': {
          semesterName: '20251 - Học kỳ 1 Năm học 2025 - 2026',
          studentName: 'NGUYỄN VĂN A (1234567)',
          exams: []
        }
      };
      
      setExamData(mockData[selectedSemester] || { exams: [], studentName: 'NGUYỄN VĂN A (1234567)' });
      setIsLoading(false);
    }, 300);
  }, [selectedSemester]);

  if (!examData) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="exam-schedule-container">
      <h2 className="exam-schedule-title">LỊCH KIỂM TRA - THI HỌC KỲ</h2>
      <div className="exam-schedule-student-info">
        Họ tên: <strong>{examData.studentName}</strong>
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
        
        <div className="search-box">
          <label>Tìm kiếm: </label>
          <input type="text" className="search-input" />
        </div>
      </div>

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
            ) : examData.exams.length > 0 ? (
              examData.exams.map(item => (
                <tr key={item.id}>
                  <td>{item.hocKy}</td>
                  <td>{item.monHoc}</td>
                  <td>{item.nhom}</td>
                  <td>{item.ngayThi}</td>
                  <td>{item.loaiThi}</td>
                  <td>{item.coSo}</td>
                  <td>{item.phong}</td>
                  <td>{item.thu}</td>
                  <td>{item.gioBatDau}</td>
                  <td>{item.thoiGian}</td>
                  <td>{item.capNhat}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="empty-message">Không có dữ liệu lịch thi cho học kỳ này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExamSchedule;
