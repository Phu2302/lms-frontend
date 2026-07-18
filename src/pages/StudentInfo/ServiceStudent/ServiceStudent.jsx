import React, { useState, useEffect } from 'react';
import { getUserProfileAPI } from '../../../api/StudentInfo/Profile/users';
import { getUserRequestsAPI, createStudentRequestAPI } from '../../../api/StudentInfo/ServiceStudent/requests';
import './ServiceStudent.css';

function ServiceStudent() {
  const [studentData, setStudentData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [profileRes, requestsRes] = await Promise.all([
        getUserProfileAPI(),
        getUserRequestsAPI().catch(err => {
          console.warn('API /users/requests not implemented yet, using empty array.');
          return { data: [] };
        })
      ]);
      setStudentData(profileRes.data);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching service data:', err);
      setError('Không thể tải thông tin cá nhân. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert('Vui lòng chọn lý do xin xác nhận!');
      return;
    }
    if (!location) {
      alert('Vui lòng chọn cơ sở nhận kết quả!');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudentRequestAPI({
        reason: reason.trim(),
        location: location === 'cs1' ? 'Cơ sở 1' : 'Cơ sở 2'
      });
      setReason('');
      setLocation('');
      alert('Đăng ký giấy xác nhận sinh viên thành công!');
      // Reload requests list
      const requestsRes = await getUserRequestsAPI();
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error creating request:', err);
      alert(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !studentData) {
    return <div className="service-loading">Đang tải dữ liệu...</div>;
  }

  // Tách danh sách phiếu đang xử lý và đã hoàn thành
  const pendingRequests = requests.filter(r => r.tinhTrang === 'Đang xử lý' || r.status === 'PENDING');
  const completedRequests = requests.filter(r => r.tinhTrang === 'Đã xử lý' || r.status === 'COMPLETED');

  // Format thông tin sinh viên hiển thị
  const displayInfo = {
    hoTen: studentData ? `${studentData.last_name || ''} ${studentData.first_name || studentData.user_name || ''}`.toUpperCase() : 'N/A',
    mssv: studentData?.user_id || 'N/A',
    ngaySinh: studentData?.date_of_birth || 'N/A',
    noiSinh: studentData?.hometown || 'N/A',
    hoKhau: studentData?.address || 'N/A',
    bacHoc: studentData?.education_level || 'Đại học',
    hinhThuc: 'Chính quy',
    khoa: studentData?.faculty_name || 'N/A',
    cccd: studentData?.cccd || 'N/A',
    ngayCap: studentData?.cccd_date || '--',
    noiCap: studentData?.cccd_location || '--'
  };

  return (
    <div className="service-container">
      <h2 className="service-main-title">Đăng ký xác nhận sinh viên</h2>

      {error && <div className="service-error-banner">{error}</div>}

      {/* 1. Kiểm tra thông tin cá nhân */}
      <section className="service-section">
        <h3 className="service-section-title">1. Kiểm tra thông tin cá nhân</h3>
        <div className="service-info-grid">
          <div className="service-info-row">
            <div className="service-info-label">Họ và tên</div>
            <div className="service-info-value font-bold">{displayInfo.hoTen}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Mã sinh viên</div>
            <div className="service-info-value font-bold">{displayInfo.mssv}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Ngày sinh</div>
            <div className="service-info-value">{displayInfo.ngaySinh}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Nơi sinh</div>
            <div className="service-info-value">{displayInfo.noiSinh}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Hộ khẩu thường trú</div>
            <div className="service-info-value">{displayInfo.hoKhau}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Bậc học</div>
            <div className="service-info-value">{displayInfo.bacHoc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Hình thức</div>
            <div className="service-info-value">{displayInfo.hinhThuc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Khoa/TT đào tạo</div>
            <div className="service-info-value">{displayInfo.khoa}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Số Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{displayInfo.cccd}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Ngày cấp Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{displayInfo.ngayCap}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Nơi cấp Thẻ căn cước/CCCD</div>
            <div className="service-info-value">{displayInfo.noiCap}</div>
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
        <form className="service-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label>Đợt đăng ký:</label>
            <input type="text" value="Xác nhận sinh viên - Học kỳ 3 Năm học 2025 - 2026" disabled className="form-input disabled-input" />
          </div>
          <div className="form-group">
            <label>Lý do xin xác nhận:</label>
            <select 
              className="form-input" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
            >
              <option value="">-- Chọn lý do xin xác nhận --</option>
              <option value="Xin hoãn nghĩa vụ quân sự">Xin hoãn nghĩa vụ quân sự</option>
              <option value="Bổ túc hồ sơ cho cơ quan nơi cha/mẹ làm việc">Bổ túc hồ sơ cho cơ quan nơi cha/mẹ làm việc</option>
              <option value="Làm thủ tục vay vốn tín dụng sinh viên">Làm thủ tục vay vốn tín dụng sinh viên</option>
              <option value="Làm thẻ xe buýt tháng">Làm thẻ xe buýt tháng</option>
              <option value="Xin học bổng của các tổ chức/doanh nghiệp ngoài trường">Xin học bổng của các tổ chức/doanh nghiệp ngoài trường</option>
              <option value="Làm hồ sơ xin miễn giảm học phí hoặc nhận trợ cấp xã hội">Làm hồ sơ xin miễn giảm học phí hoặc nhận trợ cấp xã hội</option>
              <option value="Làm thủ tục xin Visa đi nước ngoài">Làm thủ tục xin Visa đi nước ngoài</option>
              <option value="Bổ túc hồ sơ xin thực tập hoặc xin việc làm thêm">Bổ túc hồ sơ xin thực tập hoặc xin việc làm thêm</option>
              <option value="Làm thẻ căn cước / Cập nhật thông tin cư trú">Làm thẻ căn cước / Cập nhật thông tin cư trú</option>
              <option value="Mở tài khoản ngân hàng hoặc đăng ký các gói ưu đãi sinh viên">Mở tài khoản ngân hàng hoặc đăng ký các gói ưu đãi sinh viên</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nhận kết quả tại:</label>
            <select 
              className="form-input" 
              value={location} 
              onChange={e => setLocation(e.target.value)}
            >
              <option value="">-- Chọn cơ sở nhận --</option>
              <option value="cs1">Cơ sở 1</option>
              <option value="cs2">Cơ sở 2</option>
            </select>
          </div>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi đăng ký...' : 'Đăng ký'}
          </button>
        </form>
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
                  <tr key={req.id || req.request_id || idx}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu || req.request_code}</td>
                    <td>{req.noiDung || req.reason}</td>
                    <td>{req.tinhTrang || req.status}</td>
                    <td>{req.ngayDangKy || req.created_at}</td>
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
                  <tr key={req.id || req.request_id || idx}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu || req.request_code}</td>
                    <td>{req.noiNhan || req.location}</td>
                    <td>{req.noiDung || req.reason}</td>
                    <td className="status-success">{req.tinhTrang || req.status}</td>
                    <td>{req.ngayDangKy || req.created_at}</td>
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

export default ServiceStudent;
