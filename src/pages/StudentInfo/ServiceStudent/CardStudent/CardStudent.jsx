import React, { useState, useEffect } from 'react';
import { getUserProfileAPI } from '../../../../api/StudentInfo/Profile/users';
import { getUserRequestsAPI, createStudentRequestAPI } from '../../../../api/StudentInfo/ServiceStudent/requests';
import { useToast } from '../../../../components/Toast/ToastContext';
import './CardStudent.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

function CardStudent() {
  const { showToast } = useToast();
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
          console.warn('API /users/requests not implemented yet, returning empty list.');
          return { data: [] };
        })
      ]);
      setStudentData(profileRes.data);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching card student data:', err);
      setError('Không thể tải thông tin cá nhân. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!reason) {
      showToast('Vui lòng chọn lý do in thẻ sinh viên!', 'error');
      return;
    }
    if (!location) {
      showToast('Vui lòng chọn cơ sở nhận kết quả!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudentRequestAPI({
        reason: `[In thẻ SV] ${reason}`.trim(),
        location: location === 'cs1' ? 'Cơ sở 1' : 'Cơ sở 2'
      });
      setReason('');
      setLocation('');
      showToast('Đăng ký in thẻ sinh viên thành công!', 'success');
      const requestsRes = await getUserRequestsAPI();
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error creating card request:', err);
      showToast(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại sau.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !studentData) {
    return <div className="service-loading">Đang tải dữ liệu...</div>;
  }

  const displayReason = (reasonText) => {
    if (!reasonText) return '--';
    if (reasonText.startsWith('[In thẻ SV] ')) {
      return reasonText.substring('[In thẻ SV] '.length);
    }
    return reasonText;
  };

  const cardFilteredRequests = requests.filter(r => {
    const reasonText = r.noiDung || r.reason || '';
    return reasonText.startsWith('[In thẻ SV]');
  });

  const pendingRequests = cardFilteredRequests.filter(r => r.tinhTrang === 'Đang xử lý' || r.status === 'PENDING' || r.status === 'Đang xử lý');
  const completedRequests = cardFilteredRequests.filter(r => r.tinhTrang === 'Đã xử lý' || r.status === 'COMPLETED' || r.status === 'Đã xử lý');

  const displayInfo = {
    hoTen: studentData ? `${studentData.last_name || ''} ${studentData.first_name || studentData.user_name || ''}`.toUpperCase() : 'N/A',
    mssv: studentData?.user_id || 'N/A',
    ngaySinh: studentData?.date_of_birth || 'N/A',
    noiSinh: studentData?.hometown || 'N/A',
    hoKhau: studentData?.address || 'N/A',
    bacHoc: studentData?.education_level || 'Đại học',
    hinhThuc: 'Chính quy',
    khoa: studentData?.faculty_name || 'N/A',
  };

  return (
    <div className="service-container">
      <h2 className="service-main-title">Đăng ký in thẻ sinh viên</h2>

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
            <div className="service-info-label">Mã số sinh viên</div>
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
            <div className="service-info-label">Bậc đào tạo</div>
            <div className="service-info-value">{displayInfo.bacHoc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Hình thức đào tạo</div>
            <div className="service-info-value">{displayInfo.hinhThuc}</div>
          </div>
          <div className="service-info-row">
            <div className="service-info-label">Khoa</div>
            <div className="service-info-value">{displayInfo.khoa}</div>
          </div>
        </div>
        <p className="service-note text-italic">
          Thông tin này sẽ được dùng để in thẻ sinh viên, nếu thông tin không đúng bạn vui lòng liên hệ phòng Đào Tạo.
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
            <input 
              type="text" 
              value="In thẻ sinh viên - Học kỳ 3 Năm học 2025 - 2026" 
              disabled 
              className="form-input disabled-input" 
            />
          </div>
          <div className="form-group">
            <label>Lý do in thẻ sinh viên:</label>
            <select 
              className="form-input" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
            >
              <option value="">-- Chọn lý do in thẻ sinh viên --</option>
              <option value="Bị mất thẻ">Bị mất thẻ</option>
              <option value="Thẻ bị hỏng/mất góc/hỏng chip">Thẻ bị hỏng / mất góc / hỏng chip</option>
              <option value="Thẻ bị mờ thông tin/hình ảnh">Thẻ bị mờ thông tin / hình ảnh</option>
              <option value="Thay đổi thông tin cá nhân">Thay đổi thông tin cá nhân</option>
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
                    <td>{displayReason(req.noiDung || req.reason)}</td>
                    <td>{req.tinhTrang || req.status}</td>
                    <td>{formatDate(req.ngayDangKy || req.created_at)}</td>
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
                    <td>{displayReason(req.noiDung || req.reason)}</td>
                    <td className="status-success">{req.tinhTrang || req.status}</td>
                    <td>{formatDate(req.ngayDangKy || req.created_at)}</td>
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

export default CardStudent;
