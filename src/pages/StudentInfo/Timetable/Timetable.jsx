import React, { useState, useEffect } from 'react';
import './Timetable.css';

function Timetable() {
  const [selectedSemester, setSelectedSemester] = useState('20232');
  const [timetableData, setTimetableData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Giả lập gọi API lấy dữ liệu thời khóa biểu
  useEffect(() => {
    setIsLoading(true);
    // TODO: Thay thế bằng API fetch data thật sau này
    // Ví dụ: axios.get(`/api/timetable?semester=${selectedSemester}`).then(...)
    setTimeout(() => {
      const mockData = {
        '20232': {
          semesterName: '20232 - Học kỳ 2 Năm học 2023 - 2024',
          totalCredits: 14,
          studentName: 'NGUYỄN VĂN A (1234567)',
          schedule: [
            { id: 1, maMH: 'SA0001', tenMH: 'Sinh hoạt Sinh viên', tinChi: 0, nhom: 'QT01', thu: '--', tiet: '--', gioHoc: '--', phong: 'CS-LTK', coSo: 'BK-CS1', tuan: '02|03|04|05|--|--|08|09|10|--|12|13|14|15|--|--|--|--|20|21|22|23|' },
            { id: 2, maMH: 'MI1003', tenMH: 'Giáo dục Quốc phòng', tinChi: 0, nhom: 'A02', thu: '--', tiet: '--', gioHoc: '--', phong: 'CS-LTK', coSo: 'BK-CS1', tuan: '--|--|--|--|--|--|--|--|--|--|--|--|--|--|16|17|18|19|' },
            { id: 3, maMH: 'CO1023', tenMH: 'Hệ thống số', tinChi: 3, nhom: 'CC02', thu: '2', tiet: '2 - 3', gioHoc: '7:00 - 8:50', phong: 'B4-303', coSo: 'BK-CS1', tuan: '02|03|04|05|--|--|08|09|10|--|12|13|14|15|--|--|--|--|20|21|22|23|' },
            { id: 4, maMH: 'CO1006', tenMH: 'Nhập môn Điện toán (Th)', tinChi: 0, nhom: 'CC03', thu: '2', tiet: '8 - 12', gioHoc: '13:00 - 17:50', phong: 'C6-509', coSo: 'BK-CS1', tuan: '--|--|--|--|--|--|--|--|--|--|12|--|14|--|--|--|--|--|20|--|22|' },
            { id: 5, maMH: 'PE1041', tenMH: 'Cầu lông (Học phần 2)', tinChi: 0, nhom: 'CC05', thu: '3', tiet: '2 - 4', gioHoc: '7:00 - 9:50', phong: 'B12-SAN1', coSo: 'BK-CS1', tuan: '02|03|04|05|--|--|08|09|10|--|12|13|14|15|--|--|--|--|20|21|22|23|' },
            { id: 6, maMH: 'CO1024', tenMH: 'Hệ thống số (TN)', tinChi: 0, nhom: 'CC03', thu: '3', tiet: '8 - 12', gioHoc: '13:00 - 17:50', phong: 'C6-105', coSo: 'BK-CS1', tuan: '--|--|--|--|--|--|--|--|--|--|12|13|14|15|--|--|--|--|20|21|' },
            { id: 7, maMH: 'MT1003', tenMH: 'Giải tích 1', tinChi: 4, nhom: 'CC03', thu: '4', tiet: '4 - 6', gioHoc: '9:00 - 11:50', phong: 'B10-203', coSo: 'BK-CS1', tuan: '02|03|04|05|--|--|08|09|10|--|12|13|14|15|--|--|--|--|20|21|22|23|' },
            { id: 8, maMH: 'MT1004', tenMH: 'Giải tích 1 (BT)', tinChi: 0, nhom: 'CC02', thu: '4', tiet: '11 - 12', gioHoc: '16:00 - 17:50', phong: 'B4-305', coSo: 'BK-CS1', tuan: '--|03|--|05|--|--|--|09|--|--|--|13|--|15|--|--|--|--|--|21|--|23|' },
            { id: 9, maMH: 'CO1005', tenMH: 'Nhập môn Điện toán', tinChi: 3, nhom: 'CC02', thu: '5', tiet: '10 - 11', gioHoc: '15:00 - 16:50', phong: 'B1-212', coSo: 'BK-CS1', tuan: '02|03|04|05|--|--|08|09|10|--|12|13|14|15|--|--|--|--|20|21|22|23|' },
            { id: 10, maMH: 'PH1004', tenMH: 'Vật lý 1 (BT)', tinChi: 0, nhom: 'CC02', thu: '6', tiet: '2 - 3', gioHoc: '7:00 - 8:50', phong: 'C6-401', coSo: 'BK-CS1', tuan: '--|--|04|--|--|--|08|--|10|--|12|--|14|--|--|--|--|--|20|--|22|' }
          ]
        },
        '20241': {
          semesterName: '20241 - Học kỳ 1 Năm học 2024 - 2025',
          totalCredits: 0,
          studentName: 'NGUYỄN VĂN A (1234567)',
          schedule: []
        }
      };
      
      setTimetableData(mockData[selectedSemester] || { schedule: [], totalCredits: 0, studentName: 'NGUYỄN VĂN A (1234567)' });
      setIsLoading(false);
    }, 300); // Giả lập độ trễ mạng
  }, [selectedSemester]);

  if (!timetableData) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="timetable-container">
      <h2 className="timetable-title">THỜI KHÓA BIỂU HỌC KỲ</h2>
      <div className="timetable-student-info">
        Họ tên: <strong>{timetableData.studentName}</strong>
      </div>
      
      <div className="timetable-note">
        <strong>Ghi chú:</strong> Các môn học có trong Thời khóa biểu là kết quả đăng ký môn học chính thức. Sinh viên chỉ được thực hiện Đồ án, Thực tập, Luận văn tốt nghiệp, ... và được ghi điểm vào cuối học kỳ khi các môn này có trong Thời khóa biểu (có phân nhóm). Với các môn không có Thứ, Tiết, Phòng: sinh viên liên hệ Bộ môn/Khoa để được hướng dẫn.
      </div>

      <div className="timetable-controls">
        <select 
          className="semester-select" 
          value={selectedSemester} 
          onChange={(e) => setSelectedSemester(e.target.value)}
          disabled={isLoading}
        >
          <option value="20232">20232 - Học kỳ 2 Năm học 2023 - 2024</option>
          <option value="20241">20241 - Học kỳ 1 Năm học 2024 - 2025</option>
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
              <th>HỌC KỲ</th>
              <th>MÃ MH</th>
              <th>TÊN MÔN HỌC</th>
              <th>TÍN CHỈ</th>
              <th>NHÓM - TỔ</th>
              <th>THỨ</th>
              <th>TIẾT</th>
              <th>GIỜ HỌC</th>
              <th>PHÒNG</th>
              <th>CƠ SỞ</th>
              <th>TUẦN HỌC</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="11" className="empty-message">Đang tải dữ liệu...</td>
              </tr>
            ) : timetableData.schedule.length > 0 ? (
              timetableData.schedule.map(item => (
                <tr key={item.id}>
                  <td>{selectedSemester}</td>
                  <td>{item.maMH}</td>
                  <td>{item.tenMH}</td>
                  <td>{item.tinChi}</td>
                  <td>{item.nhom}</td>
                  <td>{item.thu}</td>
                  <td>{item.tiet}</td>
                  <td>{item.gioHoc}</td>
                  <td>{item.phong}</td>
                  <td>{item.coSo}</td>
                  <td className="tuan-hoc">{item.tuan}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="empty-message">Không có dữ liệu thời khóa biểu cho học kỳ này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="timetable-footer">
        <div className="total-credits">Tổng số tín chỉ đăng ký: <strong>{timetableData.totalCredits}</strong></div>
      </div>
    </div>
  );
}

export default Timetable;
