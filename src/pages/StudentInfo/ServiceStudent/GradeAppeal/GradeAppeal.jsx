import React, { useState, useEffect } from 'react';
import { getUserClassesAPI } from '../../../../api/StudentInfo/Profile/users';
import { getStudentClassGradeAPI } from '../../../../api/StudentInfo/Scoreboard/grades';
import { getUserRequestsAPI, createStudentRequestAPI } from '../../../../api/StudentInfo/ServiceStudent/requests';
import { useToast } from '../../../../components/Toast/ToastContext';
import './GradeAppeal.css';

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

function GradeAppeal() {
  const { showToast } = useToast();
  const [eligibleClasses, setEligibleClasses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [note, setNote] = useState('');

  const registrationPeriod = 'Đăng ký phúc khảo điểm thi - Học kỳ 3 Năm học 2025 - 2026';
  const registrationTime = '22/07/2026 - 15/08/2026';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch classes & requests concurrently
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

      const classes = classesRes.data || [];
      setRequests(requestsRes.data || []);

      // 2. Fetch grades for each class to check if final_grade exists
      const gradePromises = classes.map(async (cls) => {
        try {
          const gradeRes = await getStudentClassGradeAPI(cls.class_id);
          const gradeData = gradeRes.data || {};
          return {
            ...cls,
            ...gradeData,
            hasFinalGrade: gradeData.final_grade !== null && gradeData.final_grade !== undefined
          };
        } catch (err) {
          return {
            ...cls,
            final_grade: null,
            total_grade: null,
            hasFinalGrade: false
          };
        }
      });

      const allClassGrades = await Promise.all(gradePromises);

      // 3. Filter ONLY classes that have a published final_grade
      const publishedFinalClasses = allClassGrades.filter(item => item.hasFinalGrade);
      setEligibleClasses(publishedFinalClasses);

    } catch (err) {
      console.error('Error fetching grade appeal data:', err);
      setError('Không thể tải danh sách điểm thi. Vui lòng thử lại sau.');
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
      setSelectedClassIds(eligibleClasses.map(c => c.class_id || c.id));
    } else {
      setSelectedClassIds([]);
    }
  };

  const handleRegisterAppeal = async (e) => {
    e.preventDefault();
    if (selectedClassIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một môn học để phúc khảo!', 'error');
      return;
    }

    const selectedCourses = eligibleClasses.filter(c => selectedClassIds.includes(c.class_id || c.id));
    const courseDetailsStr = selectedCourses.map(c => 
      `${c.course_name || c.name || 'Môn học'} (${c.course_code || ''}) - Điểm CK hiện tại: ${c.final_grade}`
    ).join('; ');

    const fullReason = `[Phúc khảo điểm] Môn xin phúc khảo: ${courseDetailsStr}${note ? `. Lý do: ${note}` : ''}`;

    setIsSubmitting(true);
    try {
      await createStudentRequestAPI({
        reason: fullReason,
        location: 'Phòng Đào Tạo'
      });
      showToast('Đăng ký phúc khảo điểm thi thành công!', 'success');
      setSelectedClassIds([]);
      setNote('');
      
      // Reload requests
      const requestsRes = await getUserRequestsAPI();
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error submitting grade appeal request:', err);
      showToast(err.response?.data?.error || 'Đăng ký phúc khảo thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayReasonContent = (reasonText) => {
    if (!reasonText) return '--';
    if (reasonText.startsWith('[Phúc khảo điểm] ')) {
      return reasonText.substring('[Phúc khảo điểm] '.length);
    }
    return reasonText;
  };

  // Filter requests for Grade Appeal
  const appealRequests = requests.filter(r => {
    const reasonText = r.noiDung || r.reason || '';
    return reasonText.startsWith('[Phúc khảo điểm]');
  });

  const pendingRequests = appealRequests.filter(r => r.tinhTrang === 'Đang xử lý' || r.status === 'PENDING' || r.status === 'Đang xử lý');
  const completedRequests = appealRequests.filter(r => r.tinhTrang === 'Đã xử lý' || r.status === 'COMPLETED' || r.status === 'Đã xử lý');

  if (isLoading) {
    return <div className="service-loading">Đang kiểm tra dữ liệu điểm thi...</div>;
  }

  return (
    <div className="service-container appeal-container">
      <h2 className="service-main-title">Đăng ký phúc khảo điểm thi</h2>

      {error && <div className="service-error-banner">{error}</div>}

      {/* 1. Chọn môn phúc khảo */}
      <section className="service-section">
        <h3 className="service-section-title">1. Chọn môn phúc khảo (Chỉ các môn đã có điểm cuối kỳ)</h3>
        
        <form onSubmit={handleRegisterAppeal}>
          <div className="appeal-info-grid">
            <div className="appeal-row">
              <label className="appeal-label">Đợt đăng ký:</label>
              <input 
                type="text" 
                value={registrationPeriod} 
                disabled 
                className="form-input disabled-input" 
              />
            </div>

            <div className="appeal-row">
              <label className="appeal-label">Thời gian đăng ký:</label>
              <input 
                type="text" 
                value={registrationTime} 
                disabled 
                className="form-input disabled-input" 
              />
            </div>

            <div className="appeal-row">
              <label className="appeal-label">Lý do / Nội dung xin phúc khảo:</label>
              <textarea 
                className="appeal-note-textarea"
                placeholder="Nhập lý do cụ thể (ví dụ: Nghi ngờ chấm sai câu 3 bài thi tự luận)..."
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
                      checked={eligibleClasses.length > 0 && selectedClassIds.length === eligibleClasses.length}
                    />
                  </th>
                  <th>#</th>
                  <th>Mã môn học</th>
                  <th>Tên môn học</th>
                  <th>Số tín chỉ</th>
                  <th>Điểm cuối kỳ</th>
                  <th>Điểm tổng kết</th>
                </tr>
              </thead>
              <tbody>
                {eligibleClasses.length > 0 ? (
                  eligibleClasses.map((item, idx) => {
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
                        <td>
                          <span className="grade-badge">{item.final_grade ?? '--'}</span>
                        </td>
                        <td className="font-bold">{item.total_grade ?? '--'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-message">
                      Hiện tại chưa có môn học nào đã công bố điểm cuối kỳ để đăng ký phúc khảo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="appeal-commitment-box">
            <div className="appeal-commitment-text">
              Sinh viên cam kết thông tin phúc khảo là chính xác và tuân thủ quy định của nhà trường.
            </div>
            <div className="appeal-commitment-text">
              Lệ phí phúc khảo sẽ được xử lý theo quy định hiện hành của phòng Đào Tạo.
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting || selectedClassIds.length === 0}
          >
            {isSubmitting ? 'Đang gửi đăng ký...' : 'Đăng ký phúc khảo điểm'}
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
                  <td colSpan="5" className="empty-message">Hiện tại chưa có phiếu phúc khảo đang chờ xử lý</td>
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
                  <td colSpan="6" className="empty-message">Chưa có phiếu phúc khảo nào đã xử lý</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default GradeAppeal;
