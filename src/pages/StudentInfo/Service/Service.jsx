import React, { useState } from 'react';
import './Service.css';

function Service() {
  const [studentData] = useState({
    hoTen: 'NGUYỄN VĂN A',
    mssv: '1234567',
    ngaySinh: '15/08/2004',
    noiSinh: 'Thành phố Hà Nội',
    hoKhau: 'Quận Đống Đa, Thành phố Hà Nội',
    bacHoc: 'Đại học',
    hinhThuc: 'Chính quy',
    khoa: 'Khoa Công nghệ Thông tin',
    cccd: '001204000123',
    ngayCap: '--',
    noiCap: '--'
  });

  const [pendingRequests] = useState([]);

  const [completedRequests] = useState([
    { id: 1, maPhieu: 'CNSV.1234567.1', noiNhan: 'Bổ túc hồ sơ cho địa phương', noiDung: 'Phiếu đăng ký đã xử lý (đợi nhận kết quả tại nơi đăng ký nhận)', tinhTrang: 'Đã xử lý', ngayDangKy: '13/05/2024 18:18' },
    { id: 2, maPhieu: 'CNSV.1234567.2', noiNhan: 'Bổ túc hồ sơ cho cơ quan', noiDung: 'Phiếu đăng ký đã xử lý (đợi nhận kết quả tại nơi đăng ký nhận)', tinhTrang: 'Đã xử lý', ngayDangKy: '15/07/2024 15:28' },
    { id: 3, maPhieu: 'CNSV.1234567.3', noiNhan: 'Bổ túc hồ sơ cho cơ quan', noiDung: 'Phiếu đăng ký đã xử lý (đợi nhận kết quả tại nơi đăng ký nhận)', tinhTrang: 'Đã xử lý', ngayDangKy: '10/12/2025 11:59' },
    { id: 4, maPhieu: 'CNSV.1234567.4', noiNhan: 'Bổ túc hồ sơ cho cơ quan', noiDung: 'Phiếu đăng ký đã xử lý (đợi nhận kết quả tại nơi đăng ký nhận)', tinhTrang: 'Đã xử lý', ngayDangKy: '22/05/2026 13:52' }
  ]);

  return (
    <div className="service-container">
      <h2 className="service-main-title">Đăng ký xác nhận sinh viên</h2>

      {/* 1. Kiểm tra thông tin cá nhân */}
      <section className="service-section">
        <h3 className="service-section-title">1. Kiểm tra thông tin cá nhân</h3>
        <div className="service-info-grid">
          <div className="service-info-row">
            <div className="service-info-label">Họ và tên</div>
            <div className="service-info-value font-bold">{studentData.hoTen}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Mã sinh viên</div>
            <div className="service-info-value font-bold">{studentData.mssv}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Ngày sinh</div>
            <div className="service-info-value">{studentData.ngaySinh}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Nơi sinh</div>
            <div className="service-info-value">{studentData.noiSinh}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Hộ khẩu thường trú</div>
            <div className="service-info-value">{studentData.hoKhau}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Bậc học</div>
            <div className="service-info-value">{studentData.bacHoc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Hình thức</div>
            <div className="service-info-value">{studentData.hinhThuc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Khoa/TT đào tạo</div>
            <div className="service-info-value">{studentData.khoa}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Số Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{studentData.cccd}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Ngày cấp Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{studentData.ngayCap}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Nơi cấp Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{studentData.noiCap}</div>
          </div>
        </div>
        <p className="service-note text-italic">
          Thông tin này sẽ được dùng để in giấy chứng nhận, nếu thông tin không đúng bạn có thể cập nhật tại đây.
        </p>
        <p className="service-note text-red font-bold">
          Trường hợp đăng ký nhận tại CS2 sinh viên nhận sau 1 ngày làm việc sau khi đã in.
        </p>
      </section>

      {/* 2. Nhập thông tin đăng ký */}
      <section className="service-section">
        <h3 className="service-section-title">2. Nhập thông tin đăng ký</h3>
        <div className="service-form">
          <div className="form-group">
            <label>Đợt đăng ký:</label>
            <input type="text" value="Xác nhận sinh viên - Học kỳ 3 Năm học 2025 - 2026" disabled className="form-input disabled-input" />
          </div>
          <div className="form-group">
            <label>Lý do xin xác nhận:</label>
            <input type="text" placeholder="Nhập lý do..." className="form-input" />
          </div>
          <div className="form-group">
            <label>Nhận kết quả tại:</label>
            <select className="form-input">
              <option value="">-- Chọn cơ sở nhận --</option>
              <option value="cs1">Cơ sở 1</option>
              <option value="cs2">Cơ sở 2</option>
            </select>
          </div>
          <button className="btn-submit">Đăng ký</button>
        </div>
      </section>

      {/* 3. Phiếu đang chờ xử lý */}
      <section className="service-section">
        <h3 className="service-section-title">3. Phiếu đang chờ xử lý</h3>
        <div className="table-responsive">
          <table className="student-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã phiếu</th>
                <th>Nội dung đăng ký</th>
                <th>Tình trạng xử lý</th>
                <th>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu}</td>
                    <td>{req.noiDung}</td>
                    <td>{req.tinhTrang}</td>
                    <td>{req.ngayDangKy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-message">Hiện tại chưa có phiếu đăng ký</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Nhận kết quả đăng ký */}
      <section className="service-section">
        <h3 className="service-section-title">4. Nhận kết quả đăng ký</h3>
        <div className="table-responsive">
          <table className="student-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã phiếu</th>
                <th>Nơi nhận kết quả</th>
                <th>Nội dung đăng ký</th>
                <th>Tình trạng xử lý</th>
                <th>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {completedRequests.length > 0 ? (
                completedRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu}</td>
                    <td>{req.noiNhan}</td>
                    <td>{req.noiDung}</td>
                    <td className="status-success">{req.tinhTrang}</td>
                    <td>{req.ngayDangKy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-message">Chưa có kết quả đăng ký</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Service;
