import React, { useState, useEffect } from 'react';
import './Transcript.css';

function Transcript() {
  const [transcriptData, setTranscriptData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const studentName = 'NGUYỄN VĂN A (1234567)';

  useEffect(() => {
    setIsLoading(true);
    // Giả lập API fetch toàn bộ bảng điểm các học kỳ
    setTimeout(() => {
      const mockSemesters = [
        {
          id: '20231',
          semesterName: 'Năm học 2023 - 2024 / Học kỳ 1',
          diemTichLuyChung: 7.5,
          tinChiTichLuyChung: 18,
          diemTichLuyHK: 7.5,
          tinChiTichLuyHK: 18,
          grades: [
            { id: 1, maMH: 'MI1003', tenMH: 'Giáo dục Quốc phòng', diemTK: 8.0, tinChi: 0, dat: 'Đạt', tinhTrang: '', nhom: 'A02', ghiChu: '' },
            { id: 2, maMH: 'MT1003', tenMH: 'Giải tích 1', diemTK: 7.0, tinChi: 4, dat: 'Đạt', tinhTrang: '', nhom: 'CC03', ghiChu: '' },
            { id: 3, maMH: 'CO1005', tenMH: 'Nhập môn Điện toán', diemTK: 8.5, tinChi: 3, dat: 'Đạt', tinhTrang: '', nhom: 'CC02', ghiChu: '' },
          ]
        },
        {
          id: '20232',
          semesterName: 'Năm học 2023 - 2024 / Học kỳ 2',
          diemTichLuyChung: 7.8,
          tinChiTichLuyChung: 34,
          diemTichLuyHK: 8.1,
          tinChiTichLuyHK: 16,
          grades: [
            { id: 4, maMH: 'SP1039', tenMH: 'Lịch sử Đảng Cộng sản Việt Nam', diemTK: 8.2, tinChi: 2, dat: 'Đạt', tinhTrang: '', nhom: 'CC05', ghiChu: '' },
            { id: 5, maMH: 'CO3109', tenMH: 'Thực tập Đồ án môn học Đa ngành', diemTK: 7.5, tinChi: 1, dat: 'Đạt', tinhTrang: '', nhom: 'CC05', ghiChu: '' },
            { id: 6, maMH: 'CO3015', tenMH: 'Kiểm tra Phần mềm', diemTK: 8.5, tinChi: 3, dat: 'Đạt', tinhTrang: '', nhom: 'CC01', ghiChu: '' },
          ]
        },
        {
          id: '20241',
          semesterName: 'Năm học 2024 - 2025 / Học kỳ 1',
          diemTichLuyChung: 8.0,
          tinChiTichLuyChung: 51,
          diemTichLuyHK: 8.4,
          tinChiTichLuyHK: 17,
          grades: [
            { id: 7, maMH: 'IM1019', tenMH: 'Tiếp thị Căn bản', diemTK: 8.0, tinChi: 3, dat: 'Đạt', tinhTrang: '', nhom: 'CC03', ghiChu: '' },
            { id: 8, maMH: 'CO3005', tenMH: 'Nguyên lý Ngôn ngữ Lập trình', diemTK: 8.5, tinChi: 4, dat: 'Đạt', tinhTrang: '', nhom: 'CC04', ghiChu: '' },
            { id: 9, maMH: 'IM1025', tenMH: 'Quản lý Dự án cho Kỹ sư', diemTK: 8.7, tinChi: 3, dat: 'Đạt', tinhTrang: '', nhom: 'CC03', ghiChu: '' },
          ]
        }
      ];
      setTranscriptData(mockSemesters);
      setIsLoading(false);
    }, 300);
  }, []);

  return (
    <div className="transcript-container">
      <h2 className="transcript-title">BẢNG ĐIỂM SINH VIÊN</h2>
      <div className="transcript-student-info">
        Họ tên: <strong>{studentName}</strong>
      </div>
      
      <div className="transcript-controls">
        <div className="search-box">
          <label>Tìm kiếm: </label>
          <input type="text" className="search-input" placeholder="Nhập tên hoặc mã môn..." />
        </div>
      </div>

      <div className="table-responsive">
        <table className="student-data-table transcript-table">
          <thead>
            <tr>
              <th>Stt</th>
              <th>Mã môn học</th>
              <th>Tên môn học</th>
              <th>Điểm tổng kết</th>
              <th>Tín chỉ</th>
              <th>Đạt</th>
              <th>Tình trạng</th>
              <th>Nhóm</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" className="empty-message">Đang tải dữ liệu...</td>
              </tr>
            ) : transcriptData.length > 0 ? (
              transcriptData.map((semester) => (
                <React.Fragment key={semester.id}>
                  <tr className="summary-row">
                    <td colSpan="3"><strong>{semester.semesterName}</strong></td>
                    <td><strong>{semester.diemTichLuyChung}</strong></td>
                    <td><strong>{semester.tinChiTichLuyChung}</strong></td>
                    <td colSpan="4">Tích lũy chung</td>
                  </tr>
                  <tr className="summary-row">
                    <td colSpan="3"></td>
                    <td><strong>{semester.diemTichLuyHK}</strong></td>
                    <td><strong>{semester.tinChiTichLuyHK}</strong></td>
                    <td colSpan="4">Tích lũy học kỳ</td>
                  </tr>
                  {semester.grades.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.maMH}</td>
                      <td>{item.tenMH}</td>
                      <td className="grade-highlight">{item.diemTK}</td>
                      <td>{item.tinChi}</td>
                      <td>{item.dat}</td>
                      <td>{item.tinhTrang}</td>
                      <td>{item.nhom}</td>
                      <td>{item.ghiChu}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="empty-message">Chưa có dữ liệu bảng điểm.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transcript;
