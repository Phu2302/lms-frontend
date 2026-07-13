import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseRegistration.css';

function CourseRegistration() {
  const navigate = useNavigate();

  // State quản lý xem đang ở màn hình danh sách đợt hay chi tiết 1 đợt
  const [activePeriod, setActivePeriod] = useState(null);

  // Danh sách các đợt đăng ký môn học
  const [periods] = useState([
    { 
      id: 'HK261_D1', 
      name: 'Đăng ký các học phần có nhu cầu học HK1/2026-2027 tất cả diện sinh viên - học viên', 
      startDate: '02/06/2026 10:00', 
      endDate: '16/06/2026 15:00' 
    }
  ]);

  // Phiếu đăng ký (các môn đã đăng ký)
  const [registeredCourses] = useState([
    { maMH: 'CO3005', tenMH: 'Nguyên lý Ngôn ngữ Lập trình', nhom: 'CC04', tinChi: 4 },
    { maMH: 'IM1019', tenMH: 'Tiếp thị Căn bản', nhom: 'CC03', tinChi: 3 },
    { maMH: 'SP1039', tenMH: 'Lịch sử Đảng Cộng sản Việt Nam', nhom: 'CC05', tinChi: 2 }
  ]);

  // Render màn hình Danh sách đợt đăng ký
  if (!activePeriod) {
    return (
      <div className="cr-layout">
        <nav className="cr-top-nav">
          <div className="nav-brand-box" onClick={() => navigate('/menu')} style={{ cursor: 'pointer' }}>
            myBH
          </div>
          <div className="cr-nav-title">Đăng ký môn học</div>
        </nav>
        <div className="cr-main-content">
          <div className="cr-card">
            <h2>DANH SÁCH ĐỢT ĐĂNG KÝ MÔN HỌC</h2>
            <table className="cr-table mt-15">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Đợt Đăng ký</th>
                  <th>Thời gian đăng ký</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period, index) => (
                  <tr key={period.id}>
                    <td>{index + 5}</td>
                    <td>
                      <strong>{period.id}</strong>
                      <br/>
                      <span className="cr-text-small">{period.name}</span>
                    </td>
                    <td>{period.startDate} - {period.endDate}</td>
                    <td>
                      <button className="cr-btn-primary" onClick={() => setActivePeriod(period)}>
                        Vào đăng ký
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render màn hình Chi tiết 1 đợt đăng ký
  return (
    <div className="cr-layout">
      {/* Header màu xanh của đợt */}
      <div className="cr-period-header">
        <button className="cr-back-btn" onClick={() => setActivePeriod(null)}>🔙 Trở về</button>
        <span className="cr-period-title">
          ĐĂNG KÝ/ HIỆU CHỈNH ({activePeriod.id}) {activePeriod.name}
        </span>
      </div>

      <div className="cr-main-content">
        <div className="cr-detail-grid">
          
          {/* Cột trái: Lịch đăng ký */}
          <div className="cr-left-panel">
            <h3 className="cr-panel-title">Lịch đăng ký</h3>
            <table className="cr-table cr-table-small">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: 'red', fontWeight: 'bold' }}>✖</td>
                  <td>{activePeriod.startDate}</td>
                  <td>{activePeriod.endDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cột phải: Chọn môn học & Tìm kiếm */}
          <div className="cr-right-panel">
            <h3 className="cr-panel-title">Chọn môn học đăng ký</h3>
            <div className="cr-search-wrapper">
              <input 
                type="text" 
                className="cr-search-input" 
                placeholder="Mã môn học/Tên môn học (Để trống => toàn bộ lớp môn học - RẤT CHẬM!!!)" 
              />
              <button className="cr-search-btn">🔍</button>
            </div>
            <p className="cr-search-msg">
              Chưa tìm kiếm / Môn học bạn đang tìm kiếm hiện không được mở cho đăng ký.
            </p>
          </div>
        </div>

        {/* Phiếu đăng ký (nằm dưới cùng) */}
        <div className="cr-card mt-20">
          <h3 className="cr-panel-title">Phiếu đăng ký</h3>
          <table className="cr-table">
            <thead>
              <tr>
                <th>Mã MH</th>
                <th>Tên môn học</th>
                <th>Nhóm/Tổ</th>
                <th>Số TC</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {registeredCourses.length > 0 ? (
                registeredCourses.map((course, idx) => (
                  <tr key={idx}>
                    <td>{course.maMH}</td>
                    <td>{course.tenMH}</td>
                    <td>{course.nhom}</td>
                    <td>{course.tinChi}</td>
                    <td>
                      <button className="cr-btn-danger">Xóa</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-message">Bạn chưa đăng ký môn học nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CourseRegistration;
