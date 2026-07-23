import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAPI } from '../../api/auth/auth';
import { getUserClassesAPI } from '../../api/StudentInfo/Profile/users';
import { getClassGradesAPI, saveBatchGradesAPI } from '../../api/teacher/grades';
import { useToast } from '../../components/Toast/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './OnlineGrading.css';

function OnlineGrading() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const currUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currUser?.role || '1');

    if (userRole === '1') {
      showToast('Chức năng "Nhập điểm trực tuyến" chỉ dành riêng cho Giảng viên và Admin!', 'error');
      navigate('/', { replace: true });
      return;
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    logout();
    navigate('/');
  };

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
      const clsList = Array.isArray(res.data) && res.data.length > 0 ? res.data : [
        { class_id: 1, class_code: 'L01-CO1007', class_name: 'Discrete Structures for Computing', semester_name: '20252' },
        { class_id: 2, class_code: 'L01-CO1027', class_name: 'Programming Fundamentals', semester_name: '20252' },
        { class_id: 3, class_code: 'L01-CO1005', class_name: 'Introduction to Computing', semester_name: '20251' }
      ];
      setClasses(clsList);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
      setClasses([
        { class_id: 1, class_code: 'L01-CO1007', class_name: 'Discrete Structures for Computing', semester_name: '20252' },
        { class_id: 2, class_code: 'L01-CO1027', class_name: 'Programming Fundamentals', semester_name: '20252' },
        { class_id: 3, class_code: 'L01-CO1005', class_name: 'Introduction to Computing', semester_name: '20251' }
      ]);
    }
  };

  const parseWeight = (val, defaultVal) => {
    if (val === null || val === undefined || val === '') return defaultVal;
    const num = Number(val);
    if (isNaN(num)) return defaultVal;
    return num <= 1 && num > 0 ? Math.round(num * 100) : num;
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const lmsRes = await getClassGradesAPI(cls.class_id || cls.id);
      const lmsStudents = lmsRes.data || [];
      
      if (lmsStudents.length > 0) {
        const first = lmsStudents[0];
        setQuizWeight(parseWeight(first.percentage_1, 10));
        setAssignmentWeight(parseWeight(first.percentage_2, 20));
        setMidtermWeight(parseWeight(first.percentage_3, 30));
        setFinalWeight(parseWeight(first.percentage_4, 40));
      } else {
        setQuizWeight(10);
        setAssignmentWeight(20);
        setMidtermWeight(30);
        setFinalWeight(40);
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
      showToast('Lớp học này chưa có sinh viên nào hoặc API không khả dụng.', 'info');
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

    if (quizWeight < 0 || assignmentWeight < 0 || midtermWeight < 0 || finalWeight < 0) {
      showToast('Trọng số tỷ lệ phần trăm các cột không được nhỏ hơn 0%!', 'error');
      return;
    }

    const totalWeight = quizWeight + assignmentWeight + midtermWeight + finalWeight;
    if (totalWeight !== 100) {
      showToast(`Tổng phần trăm trọng số các cột phải đúng bằng 100%! (Hiện tại tổng là ${totalWeight}%)`, 'error');
      return;
    }

    for (const st of studentsData) {
      const gradesToCheck = [
        { name: 'Quiz', val: st.quiz_grade },
        { name: 'Bài tập', val: st.assignment_grade },
        { name: 'Giữa kỳ', val: st.midterm_grade },
        { name: 'Cuối kỳ', val: st.final_grade }
      ];
      for (const item of gradesToCheck) {
        if (item.val !== '' && item.val !== null && item.val !== undefined) {
          const num = Number(item.val);
          if (isNaN(num) || num < 0 || num > 10) {
            showToast(`Điểm ${item.name} của sinh viên ${st.user_name || st.student_id} phải nằm trong khoảng từ 0 đến 10!`, 'error');
            return;
          }
        }
      }
    }

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
      showToast('Đã chốt bảng điểm thành công! Điểm và trọng số phần trăm đã được lưu đồng bộ vào cơ sở dữ liệu.', 'success');
      handleSelectClass(selectedClass);
    } catch (err) {
      console.warn('Lỗi lưu điểm:', err);
      showToast(err.response?.data?.error || 'Lỗi khi lưu điểm. Vui lòng kiểm tra lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Nhóm các lớp học theo Học kỳ
  const safeClasses = Array.isArray(classes) ? classes : [];
  const groupedClasses = safeClasses.reduce((acc, cls) => {
    const semKey = cls.semester_name || cls.semester_id || '20252';
    if (!acc[semKey]) acc[semKey] = [];
    acc[semKey].push(cls);
    return acc;
  }, {});

  const semesterKeys = Object.keys(groupedClasses).sort().reverse();

  return (
    <div className="online-grading-container">
      {/* Teacher Navigation Header */}
      <nav className="teacher-top-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#008b44', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="nav-brand-box" onClick={() => navigate('/')} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '20px' }}>
            myBH
          </div>
          <span style={{ fontSize: '15px', fontWeight: 'bold', borderLeft: '1px solid rgba(255,255,255,0.4)', paddingLeft: '15px' }}>
            NHẬP ĐIỂM TRỰC TUYẾN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: '#ffffff', color: '#008b44', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Trang chủ
          </button>
          <button 
            onClick={handleLogout} 
            style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Đăng xuất
          </button>
        </div>
      </nav>
      
      <div className="online-grading-body">
        <h1>Nhập Điểm Trực Tuyến</h1>
        <p className="subtitle">Giảng viên: {currentUser.user_name || 'N/A'}</p>

        {!selectedClass ? (
          <div className="classes-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', color: '#2d3748', borderBottom: '2px solid #008b44', paddingBottom: '8px', margin: 0, fontWeight: 'bold' }}>
                CÁC LỚP HỌC CỦA TÔI
              </h3>
            </div>

            <div className="classes-grid" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {semesterKeys.length > 0 ? (
                semesterKeys.map((semKey) => (
                  <div key={semKey} className="semester-group-box" style={{ width: '100%' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#008b44', marginBottom: '10px', background: '#e6f4ea', padding: '6px 14px', borderLeft: '4px solid #008b44' }}>
                      Học kỳ: {semKey}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupedClasses[semKey].map((cls, idx) => (
                        <div key={idx} className="class-card" onClick={() => handleSelectClass(cls)}>
                          <div className="class-card-info">
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1a202c', fontWeight: 'bold' }}>
                              {cls.class_name || cls.course_name || `Lớp ${cls.class_id || cls.id}`}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#4a5568' }}>
                              Mã lớp: <strong>{cls.class_code || cls.code || cls.class_id || cls.id}</strong>
                            </p>
                          </div>
                          <button className="select-class-btn">Vào nhập điểm →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#718096', textAlign: 'center', padding: '20px 0' }}>Bạn hiện chưa được phân công phụ trách lớp học nào.</p>
              )}
            </div>
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
                  {isSaving ? 'Đang lưu...' : 'Chốt Bảng Điểm'}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải danh sách sinh viên...</div>
            ) : (
              <>
                {/* BẢNG CẤU HÌNH TRỌNG SỐ THÀNH PHẦN (%) */}
                <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2b6cb0', fontSize: '14px' }}>
                    ⚙️ Cấu hình Trọng số (%) Điểm thành phần môn học
                  </h4>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px' }}>
                      Quiz (%): 
                      <input 
                        type="number" min="0" max="100" 
                        value={quizWeight} 
                        onChange={(e) => setQuizWeight(Number(e.target.value))}
                        style={{ width: '60px', marginLeft: '5px', padding: '4px', textAlign: 'center' }}
                      />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                      Bài tập (%): 
                      <input 
                        type="number" min="0" max="100" 
                        value={assignmentWeight} 
                        onChange={(e) => setAssignmentWeight(Number(e.target.value))}
                        style={{ width: '60px', marginLeft: '5px', padding: '4px', textAlign: 'center' }}
                      />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                      Giữa kỳ (%): 
                      <input 
                        type="number" min="0" max="100" 
                        value={midtermWeight} 
                        onChange={(e) => setMidtermWeight(Number(e.target.value))}
                        style={{ width: '60px', marginLeft: '5px', padding: '4px', textAlign: 'center' }}
                      />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                      Cuối kỳ (%): 
                      <input 
                        type="number" min="0" max="100" 
                        value={finalWeight} 
                        onChange={(e) => setFinalWeight(Number(e.target.value))}
                        style={{ width: '60px', marginLeft: '5px', padding: '4px', textAlign: 'center' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: (quizWeight + assignmentWeight + midtermWeight + finalWeight) === 100 ? '#276749' : '#e53e3e' }}>
                      Tổng: {quizWeight + assignmentWeight + midtermWeight + finalWeight}%
                    </span>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="grading-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>MSSV</th>
                        <th>Họ và Tên</th>
                        <th>Quiz ({quizWeight}%)</th>
                        <th>Bài tập ({assignmentWeight}%)</th>
                        <th>Giữa kỳ ({midtermWeight}%)</th>
                        <th>Cuối kỳ ({finalWeight}%)</th>
                        <th>Tổng kết</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsData.map((st, idx) => {
                        const computedTotal = (
                          (Number(st.quiz_grade || 0) * quizWeight) +
                          (Number(st.assignment_grade || 0) * assignmentWeight) +
                          (Number(st.midterm_grade || 0) * midtermWeight) +
                          (Number(st.final_grade || 0) * finalWeight)
                        ) / 100;

                        return (
                          <tr key={st.student_id || idx}>
                            <td>{idx + 1}</td>
                            <td><strong>{st.student_id}</strong></td>
                            <td>{st.user_name}</td>
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
                              <strong style={{ color: computedTotal >= 4.0 ? '#008b44' : '#e53e3e' }}>
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
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="sheet-actions mt-20" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn-cancel" onClick={() => setSelectedClass(null)}>Hủy bỏ</button>
                  <button 
                    className="btn-save" 
                    onClick={handleSaveGrades}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Đang chốt điểm...' : 'Chốt Bảng Điểm & Lưu'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OnlineGrading;
