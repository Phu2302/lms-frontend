import React, { useState, useEffect } from 'react';
import { getUserClassesAPI } from '../../../api/StudentInfo/Profile/users';
import { getStudentClassGradeAPI } from '../../../api/StudentInfo/Scoreboard/grades';
import './Scoreboard.css';

function Scoreboard() {
  const [semesterGrades, setSemesterGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
          // Nếu lớp học chưa có điểm, trả về thông tin lớp kèm điểm trống
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
        grouped[semId].grades.push({
          id: item.class_id,
          maMH: item.course_code,
          tenMH: item.course_name,
          diemTK: item.total_grade,
          tinChi: item.credit,
          dat: (item.total_grade !== null && item.total_grade !== undefined) ? (Number(item.total_grade) >= 5.0 ? 'Đạt' : 'Không đạt') : '--',
          tinhTrang: (item.total_grade !== null && item.total_grade !== undefined) ? 'Đã có điểm' : 'Chưa có điểm',
          nhom: item.class_code,
          ghiChu: item.note || ''
        });
      });

      // Chuyển object nhóm thành mảng và sắp xếp theo Học kỳ giảm dần/tăng dần
      const sortedSemesters = Object.values(grouped).sort((a, b) => String(a.id).localeCompare(String(b.id)));

      // 4. Tính toán điểm tích lũy học kỳ & điểm tích lũy chung
      let cumulativeCredits = 0;
      let cumulativeGradePoints = 0;

      const finalizedSemesters = sortedSemesters.map(semester => {
        let semesterCredits = 0;
        let semesterGradePoints = 0;
        let gradedSemesterCredits = 0;

        semester.grades.forEach(g => {
          const credit = Number(g.tinChi || 0);
          if (g.diemTK !== null && g.diemTK !== undefined) {
            semesterGradePoints += Number(g.diemTK) * credit;
            gradedSemesterCredits += credit;
            if (Number(g.diemTK) >= 5.0) {
              semesterCredits += credit;
            }
          }
        });

        const diemTichLuyHK = gradedSemesterCredits > 0 ? (semesterGradePoints / gradedSemesterCredits) : 0;
        const tinChiTichLuyHK = semesterCredits;

        // Cộng dồn tích lũy chung
        let gradedCumulativeCreditsBefore = cumulativeCredits;
        semester.grades.forEach(g => {
          const credit = Number(g.tinChi || 0);
          if (g.diemTK !== null && g.diemTK !== undefined) {
            cumulativeGradePoints += Number(g.diemTK) * credit;
            cumulativeCredits += credit;
          }
        });

        const totalGradedCumulative = cumulativeCredits;
        const diemTichLuyChung = totalGradedCumulative > 0 ? (cumulativeGradePoints / totalGradedCumulative) : 0;
        
        // Chỉ tính tín chỉ tích lũy chung đối với các môn đạt (>= 5.0)
        let passedCreditsThisSemester = semester.grades
          .filter(g => g.diemTK !== null && g.diemTK !== undefined && Number(g.diemTK) >= 5.0)
          .reduce((sum, g) => sum + Number(g.tinChi || 0), 0);
        
        // Cập nhật lại biến tích lũy chung qua các vòng lặp
        // Ở đây ta tính tổng số tín chỉ tích lũy (passed)
        
        return {
          ...semester,
          diemTichLuyHK: Number(diemTichLuyHK || 0).toFixed(2),
          tinChiTichLuyHK,
          diemTichLuyChung: Number(diemTichLuyChung || 0).toFixed(2),
          // Giả lập/Tính toán tin chỉ tích lũy chung dựa trên tích lũy dồn
          tinChiTichLuyChung: semesterCredits // tạm thời tính theo HK, hoặc ta tính lũy kế bên ngoài:
        };
      });

      // Cập nhật lũy kế thực tế cho tinChiTichLuyChung
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
      <h2 className="transcript-title">BẢNG ĐIỂM SINH VIÊN</h2>
      <div className="transcript-student-info">
        Họ tên: <strong>{studentName}</strong>
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

      {error && <div className="scoreboard-error-banner">{error}</div>}

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
            ) : displayData.length > 0 ? (
              displayData.map((semester) => (
                <React.Fragment key={semester.id}>
                  <tr className="summary-row">
                    <td colSpan="3"><strong>{semester.semesterName}</strong></td>
                    <td className="grade-highlight"><strong>{semester.diemTichLuyChung}</strong></td>
                    <td><strong>{semester.tinChiTichLuyChung}</strong></td>
                    <td colSpan="4">Tích lũy chung</td>
                  </tr>
                  <tr className="summary-row">
                    <td colSpan="3"></td>
                    <td className="grade-highlight"><strong>{semester.diemTichLuyHK}</strong></td>
                    <td><strong>{semester.tinChiTichLuyHK}</strong></td>
                    <td colSpan="4">Tích lũy học kỳ</td>
                  </tr>
                  {semester.grades.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.maMH}</td>
                      <td>{item.tenMH}</td>
                      <td className="grade-val-cell">{(item.diemTK !== null && item.diemTK !== undefined) ? Number(item.diemTK).toFixed(2) : '--'}</td>
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
                <td colSpan="9" className="empty-message">
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu bảng điểm.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;
