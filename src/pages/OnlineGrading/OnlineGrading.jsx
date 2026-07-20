import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { getUserClassesAPI } from '../../api/StudentInfo/Profile/users';
import { getClassGradesAPI, saveBatchGradesAPI } from '../../api/teacher/grades';
import './OnlineGrading.css';

function OnlineGrading() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  
  const [studentsData, setStudentsData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cấu hình tỷ lệ phần trăm (Trọng số)
  const [quizWeight, setQuizWeight] = useState(10);
  const [assignmentWeight, setAssignmentWeight] = useState(20);
  const [midtermWeight, setMidtermWeight] = useState(30);
  const [finalWeight, setFinalWeight] = useState(40);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await getUserClassesAPI();
      const clsList = Array.isArray(res.data) ? res.data : [];
      setClasses(clsList);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    }
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const lmsRes = await getClassGradesAPI(cls.class_id || cls.id);
      const lmsStudents = lmsRes.data || [];
      
      // Nếu có học sinh đầu tiên và có lưu percentage, set lại state
      if (lmsStudents.length > 0) {
        const first = lmsStudents[0];
        if (first.percentage_1) setQuizWeight(Number(first.percentage_1));
        if (first.percentage_2) setAssignmentWeight(Number(first.percentage_2));
        if (first.percentage_3) setMidtermWeight(Number(first.percentage_3));
        if (first.percentage_4) setFinalWeight(Number(first.percentage_4));
      }

      setStudentsData(lmsStudents.map(st => ({
        student_id: st.student_id,
        user_name: st.user_name || 'N/A',
        quiz_grade: st.quiz_grade ?? '',
        assignment_grade: st.assignment_grade ?? '',
        midterm_grade: st.midterm_grade ?? '',
        final_grade: st.final_grade ?? '',
        total_grade: st.total_grade ?? '',
        note: st.note ?? ''
      })));
    } catch (err) {
      console.warn('Lỗi lấy danh sách sinh viên LMS:', err);
      setStudentsData([]);
      alert('Lớp học này chưa có sinh viên nào hoặc API không khả dụng.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setStudentsData(prev => prev.map(st => {
      if (st.student_id === studentId) {
        return { ...st, [field]: value };
      }
      return st;
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClass) return;
    setIsSaving(true);
    try {
      const gradesToSave = studentsData.map(st => {
        const computedTotal = (
          (Number(st.quiz_grade || 0) * quizWeight) +
          (Number(st.assignment_grade || 0) * assignmentWeight) +
          (Number(st.midterm_grade || 0) * midtermWeight) +
          (Number(st.final_grade || 0) * finalWeight)
        ) / 100;
        return {
          ...st,
          total_grade: Number(computedTotal.toFixed(2)),
          percentage_1: quizWeight,
          percentage_2: assignmentWeight,
          percentage_3: midtermWeight,
          percentage_4: finalWeight
        };
      });

      await saveBatchGradesAPI({
        class_id: Number(selectedClass.class_id || selectedClass.id),
        grades: gradesToSave
      });
      alert('Đã chốt bảng điểm thành công! Điểm đã được cập nhật trực tiếp vào bảng điểm của sinh viên.');
    } catch (err) {
      console.warn('Lỗi lưu điểm:', err);
      alert('Chưa cấu hình API lưu điểm (Backend). Vui lòng kiểm tra lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="online-grading-container">
      <Header view="teacher" />
      
      <div className="online-grading-body">
        <button 
          onClick={() => navigate('/')} 
          className="back-btn"
        >
          ⬅ Quay lại Trang chủ
        </button>

        <h1>Nhập Điểm Trực Tuyến</h1>
        <p className="subtitle">Giảng viên: {currentUser.user_name || 'N/A'}</p>

        {!selectedClass ? (
          <div className="classes-grid">
            {classes.length > 0 ? (
              classes.map((cls, idx) => (
                <div key={idx} className="class-card" onClick={() => handleSelectClass(cls)}>
                  <h3>{cls.class_name || cls.course_name || `Lớp ${cls.class_id || cls.id}`}</h3>
                  <p>Mã lớp: {cls.class_id || cls.id}</p>
                  <button className="select-class-btn">Nhập điểm</button>
                </div>
              ))
            ) : (
              <p style={{ color: '#718096' }}>Bạn hiện chưa được phân công lớp nào.</p>
            )}
          </div>
        ) : (
          <div className="grading-panel">
            <div className="panel-header">
              <h2>Lớp: {selectedClass.class_name || selectedClass.course_name}</h2>
              <div className="panel-actions">
                <button className="back-btn-small" onClick={() => setSelectedClass(null)}>⬅ Đổi lớp</button>
                <button 
                  className="save-grades-btn"
                  onClick={handleSaveGrades}
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : '💾 Chốt điểm'}
                </button>
              </div>
            </div>

            {loading ? (
              <p style={{ padding: '20px', color: '#666' }}>⏳ Đang tải danh sách sinh viên...</p>
            ) : (
              <div className="table-responsive">
                <table className="grading-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Quiz (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={quizWeight} onChange={e => setQuizWeight(Number(e.target.value))}/>%)</th>
                      <th>Bài tập (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={assignmentWeight} onChange={e => setAssignmentWeight(Number(e.target.value))}/>%)</th>
                      <th>Giữa kỳ (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={midtermWeight} onChange={e => setMidtermWeight(Number(e.target.value))}/>%)</th>
                      <th>Cuối kỳ (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={finalWeight} onChange={e => setFinalWeight(Number(e.target.value))}/>%)</th>
                      <th>Tổng Kết</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.length > 0 ? (
                      studentsData.map((st, idx) => {
                        const computedTotal = (
                          (Number(st.quiz_grade || 0) * quizWeight) +
                          (Number(st.assignment_grade || 0) * assignmentWeight) +
                          (Number(st.midterm_grade || 0) * midtermWeight) +
                          (Number(st.final_grade || 0) * finalWeight)
                        ) / 100;
                        return (
                          <tr key={st.student_id}>
                            <td>{idx + 1}</td>
                            <td><strong>{st.student_id}</strong></td>
                            <td>{st.user_name || 'N/A'}</td>
                            <td>
                              <input 
                                type="number" 
                                step="0.1" min="0" max="10" 
                                value={st.quiz_grade ?? ''} 
                                onChange={(e) => handleGradeChange(st.student_id, 'quiz_grade', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.1" min="0" max="10" 
                                value={st.assignment_grade ?? ''} 
                                onChange={(e) => handleGradeChange(st.student_id, 'assignment_grade', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.1" min="0" max="10" 
                                value={st.midterm_grade ?? ''} 
                                onChange={(e) => handleGradeChange(st.student_id, 'midterm_grade', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.1" min="0" max="10" 
                                value={st.final_grade ?? ''} 
                                onChange={(e) => handleGradeChange(st.student_id, 'final_grade', e.target.value)}
                              />
                            </td>
                            <td>
                              <strong style={{ color: computedTotal >= 5.0 ? '#008b44' : '#e53e3e' }}>
                                {computedTotal.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={st.note ?? ''} 
                                onChange={(e) => handleGradeChange(st.student_id, 'note', e.target.value)}
                                placeholder="..."
                                style={{ width: '120px' }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: '#a0aec0', padding: '30px' }}>
                          Chưa có dữ liệu sinh viên hoặc Backend chưa hỗ trợ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OnlineGrading;
