import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../../components/Header/Header';
import { getClassGradesAPI, saveBatchGradesAPI } from '../../../../api/teacher/grades';
import './AssignmentDetail.css';

function AssignmentDetail() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const userRole = currentUser?.role ? String(currentUser.role) : '1';
  const isTeacher = userRole === '2' || userRole === '3';

  // Cấu hình mốc thời gian bài tập
  const deadlineDate = new Date('2026-04-18T07:00:00');
  const [timeRemainingText, setTimeRemainingText] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  // Student file submission state
  const [submittedFile, setSubmittedFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Teacher submissions & grading state
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const calculateTime = () => {
    const now = new Date();
    const diffMs = deadlineDate - now;

    if (diffMs < 0) {
      setIsOverdue(true);
      const absDiff = Math.abs(diffMs);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemainingText(`Bài tập đã quá hạn: ${days} ngày ${hours} giờ`);
    } else {
      setIsOverdue(false);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemainingText(`Bạn còn: ${days} ngày ${hours} giờ để hoàn thành`);
    }
  };

  useEffect(() => {
    calculateTime();
    if (isTeacher) {
      fetchStudentSubmissions();
    }
  }, [assignmentId, isTeacher]);

  const fetchStudentSubmissions = async () => {
    try {
      // Giả lập lớp học ID 101/102/103 hoặc lấy từ API
      const res = await getClassGradesAPI(101);
      const data = (res.data || []).map(s => ({
        student_id: s.student_id,
        user_name: s.user_name || `Sinh viên ${s.student_id}`,
        submitted: s.assignment_grade != null,
        submitted_at: '17/04/2026 15:30',
        file_name: `Baitap_MSSV_${s.student_id}.pdf`,
        assignment_grade: s.assignment_grade ?? '',
        feedback: s.assignment_grade ? 'Đã hoàn thành đúng yêu cầu' : ''
      }));
      setStudentSubmissions(data);
    } catch (err) {
      console.warn('Lỗi tải danh sách nộp bài:', err);
    }
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!submissionLink && !submittedFile) {
      alert('Vui lòng nhập link bài nộp hoặc chọn file!');
      return;
    }
    setIsSubmitted(true);
    alert('Nộp bài tập thành công!');
  };

  const handleGradeChange = (studentId, field, value) => {
    setStudentSubmissions(prev => prev.map(s => {
      if (s.student_id === studentId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      const formattedGrades = studentSubmissions.map(s => ({
        student_id: s.student_id,
        assignment_grade: s.assignment_grade !== '' ? Number(s.assignment_grade) : null
      }));
      await saveBatchGradesAPI({ class_id: 101, grades: formattedGrades });
      alert('Đã lưu điểm bài tập cho sinh viên thành công!');
    } catch (err) {
      console.error('Error saving assignment grades:', err);
      alert('Không thể lưu điểm. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="assignment-container">
      <Header view="courses" />

      <div className="assignment-body">
        <button 
          onClick={() => window.history.back()} 
          style={{ marginBottom: '15px', cursor: 'pointer', padding: '6px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          ← Trở về môn học
        </button>

        <div className="assignment-course-title">
          Principles of Programming Languages (CO3005) - NGUYỄN HỨA PHÙNG (CLC_HK252)
        </div>

        <div className="assignment-main-title">
          <span className="assignment-title-icon">📤</span>
          <span>Proj#3 - Automation Testing Assignment</span>
        </div>

        <div className="info-box">
          <div className="info-line"><strong>Mở lúc:</strong> Thứ Hai, ngày 2 tháng 3 năm 2026, 00:00</div>
          <div className="info-line"><strong>Hạn chót:</strong> Thứ Bảy, ngày 18 tháng 4 năm 2026, 07:00</div>
          
          <ul className="req-list">
            <li>• Đóng gói báo cáo dạng file (.PDF / .ZIP / Link Github)</li>
            <li>• Bài nộp bao gồm Source Code + Slide thuyết trình</li>
          </ul>
        </div>

        {/* NẾU LÀ GIẢNG VIÊN -> HIỂN THỊ MÀN HÌNH CHẤM BÀI NỘP */}
        {isTeacher ? (
          <div style={{ marginTop: '25px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#008b44' }}>📝 Danh sách sinh viên nộp bài & Chấm điểm</h3>
              <button 
                onClick={handleSaveGrades}
                disabled={isSaving}
                style={{ background: '#008b44', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isSaving ? 'Đang lưu...' : '💾 Lưu điểm bài tập'}
              </button>
            </div>

            <table className="student-data-table">
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ và tên</th>
                  <th>Trạng thái nộp</th>
                  <th>Thời gian nộp</th>
                  <th>File / Link bài làm</th>
                  <th>Điểm bài tập (0-10)</th>
                  <th>Nhận xét của Giảng viên</th>
                </tr>
              </thead>
              <tbody>
                {studentSubmissions.length > 0 ? (
                  studentSubmissions.map((s) => (
                    <tr key={s.student_id}>
                      <td><strong>{s.student_id}</strong></td>
                      <td>{s.user_name}</td>
                      <td>
                        <span className={s.submitted ? 'status-success' : 'text-overdue'}>
                          {s.submitted ? 'Đã nộp bài' : 'Chưa nộp'}
                        </span>
                      </td>
                      <td>{s.submitted ? s.submitted_at : '--'}</td>
                      <td>
                        {s.submitted ? (
                          <a href="#download" onClick={(e) => { e.preventDefault(); alert(`Tải xuống bài nộp: ${s.file_name}`); }} style={{ color: '#2b6cb0', textDecoration: 'underline' }}>
                            📄 {s.file_name}
                          </a>
                        ) : '--'}
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.5" min="0" max="10" 
                          style={{ width: '70px', padding: '4px', textAlign: 'center' }}
                          value={s.assignment_grade} 
                          onChange={(e) => handleGradeChange(s.student_id, 'assignment_grade', e.target.value)}
                          placeholder="Điểm"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          style={{ width: '180px', padding: '4px' }}
                          value={s.feedback} 
                          onChange={(e) => handleGradeChange(s.student_id, 'feedback', e.target.value)}
                          placeholder="Nhận xét..."
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '15px' }}>Chưa có sinh viên nào trong lớp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* NẾU LÀ SINH VIÊN -> HIỂN THỊ KHUNG NỘP BÀI TẬP */
          <div>
            <div className="status-table-title">Trạng thái nộp bài của bạn</div>
            
            <table className="status-table" style={{ marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td className="label-cell">Trạng thái nộp bài</td>
                  <td className="value-cell">
                    {isSubmitted ? <span style={{ color: '#008b44', fontWeight: 'bold' }}>Đã nộp bài thành công</span> : 'Chưa có bài nộp nào được tải lên'}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">Thời gian còn lại</td>
                  <td className={`value-cell ${isOverdue ? 'text-overdue' : 'text-remaining'}`}>
                    {timeRemainingText}
                  </td>
                </tr>
              </tbody>
            </table>

            <form onSubmit={handleStudentSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ margin: 0, color: '#2d3748' }}>Nộp bài tập trực tuyến</h4>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Đường dẫn bài làm (Link Github / Google Drive):</label>
                <input 
                  type="url" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  placeholder="https://github.com/..." 
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Hoặc Chọn file bài tập từ máy tính:</label>
                <input 
                  type="file" 
                  onChange={(e) => setSubmittedFile(e.target.files[0])}
                />
              </div>
              <button type="submit" className="submit-assignment-btn" style={{ alignSelf: 'flex-start' }}>
                Nộp bài tập
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignmentDetail;