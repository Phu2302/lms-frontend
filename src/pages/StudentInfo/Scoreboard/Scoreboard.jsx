import React, { useState, useEffect } from 'react';
import { getUserClassesAPI } from '../../../api/StudentInfo/Profile/users';
import { getStudentClassGradeAPI } from '../../../api/StudentInfo/Scoreboard/grades';
import './Scoreboard.css';

// Helper quy đổi từ Thang điểm 10 sang Thang điểm 4
const convert10To4 = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 0;
  const num = Number(score);
  if (num >= 8.5) return 4.0;
  if (num >= 8.0) return 3.5;
  if (num >= 7.0) return 3.0;
  if (num >= 6.5) return 2.5;
  if (num >= 5.5) return 2.0;
  if (num >= 5.0) return 1.5;
  if (num >= 4.0) return 1.0;
  return 0.0;
};

// Helper lấy điểm chữ (A, B+, B, C+, C, D+, D, F)
const getLetterGrade = (score) => {
  if (score === null || score === undefined || isNaN(score)) return '--';
  const num = Number(score);
  if (num >= 8.5) return 'A';
  if (num >= 8.0) return 'B+';
  if (num >= 7.0) return 'B';
  if (num >= 6.5) return 'C+';
  if (num >= 5.5) return 'C';
  if (num >= 5.0) return 'D+';
  if (num >= 4.0) return 'D';
  return 'F';
};

function Scoreboard() {
  const [semesterGrades, setSemesterGrades] = useState([]);
  const [overallSummary, setOverallSummary] = useState({ gpa10: '0.00', gpa4: '0.00', passedCredits: 0, registeredCredits: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  // Lấy thông tin sinh viên từ localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = `${currentUser.user_name?.toUpperCase() || 'SINH VIÊN'} (${currentUser.user_id || ''})`;

  useEffect(() => {
    fetchScoreboardData();
  }, []);

  const fetchScoreboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Lấy danh sách lớp học của sinh viên
      const classesRes = await getUserClassesAPI();
      const classes = classesRes.data || [];

      if (classes.length === 0) {
        setSemesterGrades([]);
        setOverallSummary({ gpa10: '0.00', gpa4: '0.00', passedCredits: 0, registeredCredits: 0 });
        setIsLoading(false);
        return;
      }

      // 2. Lấy điểm của từng lớp học song song
      const gradePromises = classes.map(async (cls) => {
        try {
          const gradeRes = await getStudentClassGradeAPI(cls.class_id);
          return {
            ...cls,
            ...gradeRes.data,
            hasGrade: true
          };
        } catch (err) {
          return {
            ...cls,
            quiz_grade: null,
            assignment_grade: null,
            midterm_grade: null,
            final_grade: null,
            total_grade: null,
            hasGrade: false
          };
        }
      });

      const allGrades = await Promise.all(gradePromises);

      // Tính tổng tích lũy TOÀN KHÓA (Góc trên bên trái)
      let totalAllGradedCredits = 0;
      let totalAllGradePoints10 = 0;
      let totalAllGradePoints4 = 0;
      let totalAllPassedCredits = 0;
      let totalAllRegisteredCredits = 0;

      allGrades.forEach(item => {
        const credit = Number(item.credit || 0);
        totalAllRegisteredCredits += credit;

        if (item.total_grade !== null && item.total_grade !== undefined) {
          const score10 = Number(item.total_grade);
          const score4 = convert10To4(score10);

          totalAllGradePoints10 += score10 * credit;
          totalAllGradePoints4 += score4 * credit;
          totalAllGradedCredits += credit;

          // Điều kiện đạt môn (Theo thang điểm chuẩn: Score >= 4.0 -> Điểm D trở lên là Đạt)
          if (score10 >= 4.0) {
            totalAllPassedCredits += credit;
          }
        }
      });

      const overallGPA10 = totalAllGradedCredits > 0 ? (totalAllGradePoints10 / totalAllGradedCredits).toFixed(2) : '0.00';
      const overallGPA4 = totalAllGradedCredits > 0 ? (totalAllGradePoints4 / totalAllGradedCredits).toFixed(2) : '0.00';
      setOverallSummary({
        gpa10: overallGPA10,
        gpa4: overallGPA4,
        passedCredits: totalAllPassedCredits,
        registeredCredits: totalAllRegisteredCredits
      });

      // 3. Nhóm điểm theo Học kỳ (semester_id/semester_name)
      const grouped = {};
      allGrades.forEach(item => {
        const semId = item.semester_id || 'unassigned';
        const semName = item.semester_name || `Học kỳ ${semId}`;
        
        if (!grouped[semId]) {
          grouped[semId] = {
            id: semId,
            semesterName: semName,
            grades: []
          };
        }
        
        const hasScore = (item.total_grade !== null && item.total_grade !== undefined);
        const scoreVal = hasScore ? Number(item.total_grade) : null;
        const letter = hasScore ? getLetterGrade(scoreVal) : '--';
        const isPassed = hasScore ? (scoreVal >= 4.0) : false;

        grouped[semId].grades.push({
          id: item.class_id,
          maMH: item.course_code,
          tenMH: item.course_name,
          diemTK: item.total_grade,
          tinChi: item.credit,
          diemChu: letter,
          diemHe4: hasScore ? convert10To4(scoreVal).toFixed(1) : '--',
          dat: hasScore ? (isPassed ? 'Đạt' : 'Không đạt') : '--',
          tinhTrang: hasScore ? 'Đã có điểm' : 'Chưa có điểm',
          nhom: item.class_code,
          ghiChu: item.note || '',

          // Điểm thành phần & trọng số phần trăm
          quizGrade: item.quiz_grade,
          assignmentGrade: item.assignment_grade,
          midtermGrade: item.midterm_grade,
          finalGrade: item.final_grade,
          percentage1: item.percentage_1 ?? 10,
          percentage2: item.percentage_2 ?? 20,
          percentage3: item.percentage_3 ?? 30,
          percentage4: item.percentage_4 ?? 40,
        });
      });

      // Chuyển object nhóm thành mảng và sắp xếp theo Học kỳ
      const sortedSemesters = Object.values(grouped).sort((a, b) => String(a.id).localeCompare(String(b.id)));

      // 4. Tính toán điểm tích lũy của TỪNG HỌC KỲ và tích lũy dồn
      let cumulativeCredits = 0;
      let cumulativeGradePoints10 = 0;
      let cumulativeGradePoints4 = 0;

      const finalizedSemesters = sortedSemesters.map(semester => {
        let semesterCredits = 0;
        let semesterGradePoints10 = 0;
        let semesterGradePoints4 = 0;
        let gradedSemesterCredits = 0;

        semester.grades.forEach(g => {
          const credit = Number(g.tinChi || 0);
          if (g.diemTK !== null && g.diemTK !== undefined) {
            const score10 = Number(g.diemTK);
            const score4 = convert10To4(score10);

            semesterGradePoints10 += score10 * credit;
            semesterGradePoints4 += score4 * credit;
            gradedSemesterCredits += credit;

            if (score10 >= 4.0) {
              semesterCredits += credit;
            }
          }
        });

        const diemTichLuyHK10 = gradedSemesterCredits > 0 ? (semesterGradePoints10 / gradedSemesterCredits) : 0;
        const diemTichLuyHK4 = gradedSemesterCredits > 0 ? (semesterGradePoints4 / gradedSemesterCredits) : 0;
        const tinChiTichLuyHK = semesterCredits;

        // Cộng dồn lũy kế qua các kỳ
        semester.grades.forEach(g => {
          const credit = Number(g.tinChi || 0);
          if (g.diemTK !== null && g.diemTK !== undefined) {
            const score10 = Number(g.diemTK);
            const score4 = convert10To4(score10);

            cumulativeGradePoints10 += score10 * credit;
            cumulativeGradePoints4 += score4 * credit;
            cumulativeCredits += credit;
          }
        });

        const totalGradedCumulative = cumulativeCredits;
        const diemTichLuyChung10 = totalGradedCumulative > 0 ? (cumulativeGradePoints10 / totalGradedCumulative) : 0;
        const diemTichLuyChung4 = totalGradedCumulative > 0 ? (cumulativeGradePoints4 / totalGradedCumulative) : 0;

        return {
          ...semester,
          diemTichLuyHK: Number(diemTichLuyHK10 || 0).toFixed(2),
          gpaHKHe4: Number(diemTichLuyHK4 || 0).toFixed(2),
          tinChiTichLuyHK,
          diemTichLuyChung: Number(diemTichLuyChung10 || 0).toFixed(2),
          gpaChungHe4: Number(diemTichLuyChung4 || 0).toFixed(2),
          tinChiTichLuyChung: semesterCredits
        };
      });

      let currentCumulativePassed = 0;
      const finalData = finalizedSemesters.map(sem => {
        currentCumulativePassed += sem.tinChiTichLuyHK;
        return {
          ...sem,
          tinChiTichLuyChung: currentCumulativePassed
        };
      });

      setSemesterGrades(finalData);
    } catch (err) {
      console.error('Error fetching scoreboard:', err);
      setError('Không thể tải bảng điểm từ hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tìm kiếm môn học
  const filterSemestersData = () => {
    if (!searchQuery.trim()) return semesterGrades;
    const query = searchQuery.toLowerCase();
    
    return semesterGrades.map(semester => {
      const filteredGrades = semester.grades.filter(g => 
        g.tenMH?.toLowerCase().includes(query) ||
        g.maMH?.toLowerCase().includes(query)
      );
      return {
        ...semester,
        grades: filteredGrades
      };
    }).filter(semester => semester.grades.length > 0);
  };

  const displayData = filterSemestersData();

  return (
    <div className="transcript-container">
      {/* Header Top Bar: GPA Tích lũy toàn khóa (Góc trên trái) + Tiêu đề */}
      <div className="scoreboard-top-bar">
        <div className="overall-gpa-card">
          <div className="gpa-card-title">TÍCH LŨY TOÀN KHÓA</div>
          <div className="gpa-card-content">
            <div className="gpa-badge-item">
              <span className="gpa-label">GPA (Hệ 10):</span>
              <span className="gpa-value-green">{overallSummary.gpa10}</span>
            </div>
            <div className="gpa-badge-item">
              <span className="gpa-label">GPA (Hệ 4):</span>
              <span className="gpa-value-blue">{overallSummary.gpa4}</span>
            </div>
            <div className="gpa-badge-item">
              <span className="gpa-label">Tín chỉ tích lũy (Đạt):</span>
              <span className="gpa-value-dark">{overallSummary.passedCredits} TC</span>
            </div>
            <div className="gpa-badge-item">
              <span className="gpa-label">Tổng tín chỉ đăng ký:</span>
              <span className="gpa-value-dark">{overallSummary.registeredCredits} TC</span>
            </div>
          </div>
        </div>

        <div className="scoreboard-title-area">
          <h2 className="transcript-title">BẢNG ĐIỂM SINH VIÊN</h2>
          <div className="transcript-student-info">
            Họ tên: <strong>{studentName}</strong>
          </div>
        </div>

        <div className="transcript-controls">
          <div className="search-box">
            <label>Tìm kiếm: </label>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Nhập tên hoặc mã môn..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="scoreboard-error-banner">{error}</div>}

      <div className="table-responsive">
        <table className="student-data-table transcript-table">
          <thead>
            <tr>
              <th>Stt</th>
              <th>Mã môn học</th>
              <th>Tên môn học</th>
              <th>Điểm số</th>
              <th>Điểm chữ</th>
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
                <td colSpan="10" className="empty-message">Đang tải dữ liệu...</td>
              </tr>
            ) : displayData.length > 0 ? (
              displayData.map((semester) => (
                <React.Fragment key={semester.id}>
                  {/* Dòng tổng kết với 1 ô gộp bên trái cho tên Học kỳ (rowSpan=2) */}
                  <tr className="summary-row">
                    <td colSpan="3" rowSpan="2" style={{ verticalAlign: 'middle', fontWeight: 'bold', fontSize: '14px' }}>
                      {semester.semesterName}
                    </td>
                    <td colSpan="2" className="grade-highlight">
                      <strong>{semester.diemTichLuyChung}</strong> <span style={{ fontSize: '11px', color: '#666' }}>(Hệ 10)</span> / <strong>{semester.gpaChungHe4}</strong> <span style={{ fontSize: '11px', color: '#666' }}>(Hệ 4)</span>
                    </td>
                    <td><strong>{semester.tinChiTichLuyChung}</strong></td>
                    <td colSpan="4">Tích lũy chung</td>
                  </tr>
                  <tr className="summary-row">
                    <td colSpan="2" className="grade-highlight">
                      <strong>{semester.diemTichLuyHK}</strong> <span style={{ fontSize: '11px', color: '#666' }}>(Hệ 10)</span> / <strong>{semester.gpaHKHe4}</strong> <span style={{ fontSize: '11px', color: '#666' }}>(Hệ 4)</span>
                    </td>
                    <td><strong>{semester.tinChiTichLuyHK}</strong></td>
                    <td colSpan="4">Tích lũy học kỳ</td>
                  </tr>
                  {semester.grades.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.maMH}</td>
                      <td>{item.tenMH}</td>
                      {/* Cột 1: Điểm số */}
                      <td 
                        className="grade-val-cell clickable-grade-text" 
                        onClick={() => setSelectedCourseForModal(item)}
                        title="Bấm để xem chi tiết điểm thành phần"
                      >
                        {(item.diemTK !== null && item.diemTK !== undefined) ? Number(item.diemTK).toFixed(2) : '--'}
                      </td>
                      {/* Cột 2: Điểm chữ */}
                      <td 
                        className="clickable-grade-text" 
                        onClick={() => setSelectedCourseForModal(item)}
                        title="Bấm để xem chi tiết điểm thành phần"
                      >
                        <span className="letter-grade-badge">{item.diemChu}</span>
                      </td>
                      <td>{item.tinChi}</td>
                      <td className={item.dat === 'Đạt' ? 'status-pass' : item.dat === 'Không đạt' ? 'status-fail' : ''}>
                        {item.dat}
                      </td>
                      <td>{item.tinhTrang}</td>
                      <td>{item.nhom}</td>
                      <td>{item.ghiChu}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="empty-message">
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu bảng điểm.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Chi tiết điểm thành phần */}
      {selectedCourseForModal && (
        <div className="grade-modal-overlay" onClick={() => setSelectedCourseForModal(null)}>
          <div className="grade-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="grade-modal-header">
              <h3>BẢNG ĐIỂM CHI TIẾT THÀNH PHẦN</h3>
              <button 
                className="grade-modal-close-btn" 
                onClick={() => setSelectedCourseForModal(null)}
                title="Đóng modal"
              >
                ×
              </button>
            </div>

            <div className="grade-modal-body">
              <div className="grade-course-info">
                <div><strong>Môn học:</strong> {selectedCourseForModal.tenMH} ({selectedCourseForModal.maMH})</div>
                <div>
                  <strong>Mã lớp / Nhóm:</strong> {selectedCourseForModal.nhom} | <strong>Số tín chỉ:</strong> {selectedCourseForModal.tinChi} | <strong>Điểm chữ:</strong> <span style={{ color: '#008b44', fontWeight: 'bold' }}>{selectedCourseForModal.diemChu}</span> (Thang 4: {selectedCourseForModal.diemHe4})
                </div>
              </div>

              <table className="grade-components-table">
                <thead>
                  <tr>
                    <th>Thành phần điểm</th>
                    <th>Trọng số</th>
                    <th>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Bài tập</td>
                    <td>{Math.round(selectedCourseForModal.percentage1)}%</td>
                    <td><strong>{selectedCourseForModal.quizGrade ?? '--'}</strong></td>
                  </tr>
                  <tr>
                    <td>Bài tập lớn</td>
                    <td>{Math.round(selectedCourseForModal.percentage2)}%</td>
                    <td><strong>{selectedCourseForModal.assignmentGrade ?? '--'}</strong></td>
                  </tr>
                  <tr>
                    <td>Giữa Kỳ</td>
                    <td>{Math.round(selectedCourseForModal.percentage3)}%</td>
                    <td><strong>{selectedCourseForModal.midtermGrade ?? '--'}</strong></td>
                  </tr>
                  <tr>
                    <td>Cuối kì</td>
                    <td>{Math.round(selectedCourseForModal.percentage4)}%</td>
                    <td><strong>{selectedCourseForModal.finalGrade ?? '--'}</strong></td>
                  </tr>
                  <tr className="total-row">
                    <td>Điểm tổng kết</td>
                    <td>100%</td>
                    <td style={{ color: '#008b44', fontSize: '15px' }}>
                      {selectedCourseForModal.diemTK !== null && selectedCourseForModal.diemTK !== undefined
                        ? `${Number(selectedCourseForModal.diemTK).toFixed(2)} (${selectedCourseForModal.diemChu})`
                        : '--'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {selectedCourseForModal.ghiChu && (
                <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>
                  <strong>Ghi chú:</strong> {selectedCourseForModal.ghiChu}
                </div>
              )}
            </div>

            <div className="grade-modal-footer">
              <button 
                className="grade-modal-dismiss-btn"
                onClick={() => setSelectedCourseForModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scoreboard;
