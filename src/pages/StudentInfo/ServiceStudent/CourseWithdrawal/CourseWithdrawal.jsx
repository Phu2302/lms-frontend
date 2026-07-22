import React, { useState, useEffect } from 'react';
import { getUserClassesAPI } from '../../../../api/StudentInfo/Profile/users';
import { getUserRequestsAPI, createStudentRequestAPI } from '../../../../api/StudentInfo/ServiceStudent/requests';
import { useToast } from '../../../../components/Toast/ToastContext';
import './CourseWithdrawal.css';

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

function CourseWithdrawal() {
  const { showToast } = useToast();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [note, setNote] = useState('');

  const registrationPeriod = 'Đăng ký rút môn học học kỳ 3 Năm học 2025 - 2026';
  const registrationTime = '22/07/2026 - 15/08/2026';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [classesRes, requestsRes] = await Promise.all([
        getUserClassesAPI().catch(err => {
          console.warn('API /users/classes error:', err);
          return { data: [] };
        }),
        getUserRequestsAPI().catch(err => {
          console.warn('API /users/requests error:', err);
          return { data: [] };
        })
      ]);
      setEnrolledClasses(classesRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching course withdrawal data:', err);
      setError('Không thể tải danh sách môn học. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (classId) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClassIds(enrolledClasses.map(c => c.class_id || c.id));
    } else {
      setSelectedClassIds([]);
    }
  };

  const handleRegisterWithdrawal = async (e) => {
    e.preventDefault();
    if (selectedClassIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một môn học cần rút!', 'error');
      return;
    }

    const selectedCourses = enrolledClasses.filter(c => selectedClassIds.includes(c.class_id || c.id));
    const courseNamesStr = selectedCourses.map(c => `${c.course_name || c.name || 'Môn học'} (${c.course_code || c.code || ''})`).join(', ');

    const fullReason = `[Rút môn học] Các môn xin rút: ${courseNamesStr}${note ? `. Ghi chú: ${note}` : ''}`;

    setIsSubmitting(true);
    try {
      await createStudentRequestAPI({
        reason: fullReason,
        location: 'Phòng Đào Tạo'
      });
      showToast('Đăng ký rút môn học thành công!', 'success');
      setSelectedClassIds([]);
      setNote('');
      
      // Reload requests
      const requestsRes = await getUserRequestsAPI();
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error submitting withdrawal request:', err);
      showToast(err.response?.data?.error || 'Đăng ký rút môn thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayReasonContent = (reasonText) => {
    if (!reasonText) return '--';
    if (reasonText.startsWith('[Rút môn học] ')) {
      return reasonText.substring('[Rút môn học] '.length);
    }
    return reasonText;
  };

  // Filter requests for Course Withdrawal
  const withdrawalRequests = requests.filter(r => {
    const reasonText = r.noiDung || r.reason || '';
    return reasonText.startsWith('[Rút môn học]');
  });

  const pendingRequests = withdrawalRequests.filter(r => r.tinhTrang === 'Đang xử lý' || r.status === 'PENDING' || r.status === 'Đang xử lý');
  const completedRequests = withdrawalRequests.filter(r => r.tinhTrang === 'Đã xử lý' || r.status === 'COMPLETED' || r.status === 'Đã xử lý');

  if (isLoading) {
    return <div className="service-loading">Đang tải danh sách môn học...</div>;
  }

  return (
    <div className="service-container withdrawal-container">
      <h2 className="service-main-title">Đăng ký rút môn học</h2>

      {error && <div className="service-error-banner">{error}</div>}

      {/* 1. Chọn môn rút */}
      <section className="service-section">
        <h3 className="service-section-title">1. Chọn môn rút</h3>
        
        <form onSubmit={handleRegisterWithdrawal}>
          <div className="withdrawal-info-grid">
            <div className="withdrawal-row">
              <label className="withdrawal-label">Đợt đăng ký:</label>
              <input 
                type="text" 
                value={registrationPeriod} 
                disabled 
                className="form-input disabled-input" 
              />
            </div>

            <div className="withdrawal-row">
              <label className="withdrawal-label">Thời gian đăng ký:</label>
              <input 
                type="text" 
                value={registrationTime} 
                disabled 
                className="form-input disabled-input" 
              />
            </div>

            <div className="withdrawal-row">
              <label className="withdrawal-label">Ghi chú:</label>
              <textarea 
                className="withdrawal-note-textarea"
                placeholder="Nhập ghi chú hoặc lý do xin rút môn học (nếu có)..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="student-data-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={enrolledClasses.length > 0 && selectedClassIds.length === enrolledClasses.length}
                    />
                  </th>
                  <th>#</th>
                  <th>Mã môn học</th>
                  <th>Tên môn học</th>
                  <th>Số tín chỉ</th>
                  <th>Lớp học phần</th>
                </tr>
              </thead>
              <tbody>
                {enrolledClasses.length > 0 ? (
                  enrolledClasses.map((item, idx) => {
                    const classId = item.class_id || item.id || idx;
                    const isChecked = selectedClassIds.includes(classId);
                    return (
                      <tr key={classId} onClick={() => handleToggleSelect(classId)} style={{ cursor: 'pointer' }}>
                        <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(classId)}
                          />
                        </td>
                        <td>{idx + 1}</td>
                        <td className="font-bold">{item.course_code || item.code || 'N/A'}</td>
                        <td>{item.course_name || item.name || 'N/A'}</td>
                        <td>{item.credit || item.credits || 3}</td>
                        <td>{item.class_code || item.class_name || 'N/A'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-message">Không có môn học nào trong học kỳ hiện tại</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="withdrawal-commitment-box">
            <div className="withdrawal-commitment-text">
              Sinh viên cam kết sau khi rút môn học phải đảm bảo đủ số tín chỉ tối thiểu học kỳ.
            </div>
            <div className="withdrawal-commitment-text">
              Sinh viên cam đoan nộp đủ học phí, bao gồm cả các môn xin rút môn học.
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting || selectedClassIds.length === 0}
          >
            {isSubmitting ? 'Đang gửi đăng ký...' : 'Đăng ký rút môn học'}
          </button>
        </form>
      </section>

      {/* 2. Thông tin chờ xử lý */}
      <section className="service-section">
        <h3 className="service-section-title">2. Thông tin chờ xử lý</h3>
        <div className="table-responsive">
          <table className="student-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã phiếu</th>
                <th>Nội dung</th>
                <th>Tình trạng</th>
                <th>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req, idx) => (
                  <tr key={req.id || req.request_id || idx}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu || req.request_code}</td>
                    <td>{displayReasonContent(req.noiDung || req.reason)}</td>
                    <td>{req.tinhTrang || req.status}</td>
                    <td>{formatDate(req.ngayDangKy || req.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-message">Hiện tại chưa có phiếu đăng ký rút môn đang chờ xử lý</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Thông tin đã xử lý */}
      <section className="service-section">
        <h3 className="service-section-title">3. Thông tin đã xử lý</h3>
        <div className="table-responsive">
          <table className="student-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã phiếu</th>
                <th>Nội dung</th>
                <th>Tình trạng</th>
                <th>Ngày cập nhật</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {completedRequests.length > 0 ? (
                completedRequests.map((req, idx) => (
                  <tr key={req.id || req.request_id || idx}>
                    <td>{idx + 1}</td>
                    <td>{req.maPhieu || req.request_code}</td>
                    <td>{displayReasonContent(req.noiDung || req.reason)}</td>
                    <td className="status-success">{req.tinhTrang || req.status}</td>
                    <td>{formatDate(req.updated_at || req.created_at)}</td>
                    <td>{req.note || req.ghiChu || '--'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-message">Chưa có thông tin phiếu đã xử lý</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default CourseWithdrawal;
