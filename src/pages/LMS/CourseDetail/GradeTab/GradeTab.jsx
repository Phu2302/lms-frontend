import React from 'react';
import './GradeTab.css';

/**
 * GradeTab — Tab "Điểm" trong CourseDetail
 * Render giao diện nhập/chấm điểm dành cho Giảng viên hoặc xem điểm dành cho Sinh viên.
 */
function GradeTab({
  courseId,
  hasEditingPrivileges,
  isGradesPublished,
  onTogglePublishGrades,
  onSaveBatchGrades,
  isSavingGrades,
  classGrades,
  quizWeight,
  setQuizWeight,
  assignmentWeight,
  setAssignmentWeight,
  midtermWeight,
  setMidtermWeight,
  finalWeight,
  setFinalWeight,
  onGradeChange,
  onRowClick,
  studentOwnGrade,
}) {
  return (
    <div className="grade-tab-container">
      {hasEditingPrivileges ? (
        /* GIAO DIỆN CHẤM ĐIỂM DÀNH CHO GIẢNG VIÊN */
        <div>
          <div className="grade-tab-header">
            <h3 className="grade-tab-title">📊 Bảng điểm sinh viên lớp {courseId}</h3>
            <div className="grade-tab-actions">
              <label className="publish-checkbox-label">
                <input
                  type="checkbox"
                  checked={isGradesPublished}
                  onChange={onTogglePublishGrades}
                  className="publish-checkbox"
                />
                Công bố điểm
              </label>
              <button
                onClick={onSaveBatchGrades}
                disabled={isSavingGrades}
                className="save-grades-btn"
              >
                {isSavingGrades ? 'Đang lưu...' : '💾 Lưu bảng điểm'}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="student-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MSSV</th>
                  <th>Tên Sinh viên</th>
                  <th>
                    Quiz (
                    <input
                      type="number"
                      className="weight-input"
                      value={quizWeight}
                      onChange={(e) => setQuizWeight(Number(e.target.value))}
                    />
                    %)
                  </th>
                  <th>
                    Bài tập (
                    <input
                      type="number"
                      className="weight-input"
                      value={assignmentWeight}
                      onChange={(e) => setAssignmentWeight(Number(e.target.value))}
                    />
                    %)
                  </th>
                  <th>
                    Giữa kỳ (
                    <input
                      type="number"
                      className="weight-input"
                      value={midtermWeight}
                      onChange={(e) => setMidtermWeight(Number(e.target.value))}
                    />
                    %)
                  </th>
                  <th>
                    Cuối kỳ (
                    <input
                      type="number"
                      className="weight-input"
                      value={finalWeight}
                      onChange={(e) => setFinalWeight(Number(e.target.value))}
                    />
                    %)
                  </th>
                  <th>Tổng kết</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {classGrades.length > 0 ? (
                  classGrades.map((g, idx) => {
                    const computedTotal =
                      (Number(g.quiz_grade || 0) * quizWeight +
                        Number(g.assignment_grade || 0) * assignmentWeight +
                        Number(g.midterm_grade || 0) * midtermWeight +
                        Number(g.final_grade || 0) * finalWeight) /
                      100;
                    return (
                      <tr
                        key={g.student_id}
                        onClick={(e) => onRowClick(e, g)}
                        className="clickable-row"
                        title="Nhấn vào để xem chi tiết Quiz"
                      >
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{g.student_id}</strong>
                        </td>
                        <td>{g.user_name || 'N/A'}</td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="grade-input"
                            value={g.quiz_grade ?? ''}
                            onChange={(e) => onGradeChange(g.student_id, 'quiz_grade', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="grade-input"
                            value={g.assignment_grade ?? ''}
                            onChange={(e) =>
                              onGradeChange(g.student_id, 'assignment_grade', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="grade-input"
                            value={g.midterm_grade ?? ''}
                            onChange={(e) =>
                              onGradeChange(g.student_id, 'midterm_grade', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className="grade-input"
                            value={g.final_grade ?? ''}
                            onChange={(e) =>
                              onGradeChange(g.student_id, 'final_grade', e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <strong
                            style={{ color: computedTotal >= 5.0 ? '#008b44' : '#e53e3e' }}
                          >
                            {computedTotal.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="note-input"
                            value={g.note ?? ''}
                            onChange={(e) => onGradeChange(g.student_id, 'note', e.target.value)}
                            placeholder="..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      Chưa có sinh viên nào đăng ký lớp học này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GIAO DIỆN XEM ĐIỂM DÀNH CHO SINH VIÊN */
        <div>
          <h3>Bảng điểm cá nhân môn học</h3>
          {studentOwnGrade ? (
            <>
              <div className="student-grades-grid">
                <div className="grade-card">
                  <span className="grade-card-label">
                    Quiz (
                    {studentOwnGrade.percentage_1
                      ? Number(studentOwnGrade.percentage_1) <= 1
                        ? Math.round(Number(studentOwnGrade.percentage_1) * 100)
                        : Number(studentOwnGrade.percentage_1)
                      : 10}
                    %)
                  </span>
                  <div className="grade-card-value">{studentOwnGrade.quiz_grade ?? '--'}</div>
                </div>
                <div className="grade-card">
                  <span className="grade-card-label">
                    Bài tập (
                    {studentOwnGrade.percentage_2
                      ? Number(studentOwnGrade.percentage_2) <= 1
                        ? Math.round(Number(studentOwnGrade.percentage_2) * 100)
                        : Number(studentOwnGrade.percentage_2)
                      : 20}
                    %)
                  </span>
                  <div className="grade-card-value">{studentOwnGrade.assignment_grade ?? '--'}</div>
                </div>
                <div className="grade-card">
                  <span className="grade-card-label">
                    Giữa kỳ (
                    {studentOwnGrade.percentage_3
                      ? Number(studentOwnGrade.percentage_3) <= 1
                        ? Math.round(Number(studentOwnGrade.percentage_3) * 100)
                        : Number(studentOwnGrade.percentage_3)
                      : 30}
                    %)
                  </span>
                  <div className="grade-card-value">{studentOwnGrade.midterm_grade ?? '--'}</div>
                </div>
                <div className="grade-card">
                  <span className="grade-card-label">
                    Cuối kỳ (
                    {studentOwnGrade.percentage_4
                      ? Number(studentOwnGrade.percentage_4) <= 1
                        ? Math.round(Number(studentOwnGrade.percentage_4) * 100)
                        : Number(studentOwnGrade.percentage_4)
                      : 40}
                    %)
                  </span>
                  <div className="grade-card-value">{studentOwnGrade.final_grade ?? '--'}</div>
                </div>
                <div className="grade-card total-card">
                  <span className="grade-card-label total-label">Điểm Tổng Kết</span>
                  <div className="grade-card-value total-value">{studentOwnGrade.total_grade ?? '--'}</div>
                </div>
              </div>
              {studentOwnGrade.note && (
                <div className="teacher-note-box">
                  <strong>Ghi chú từ giảng viên:</strong> {studentOwnGrade.note}
                </div>
              )}
            </>
          ) : (
            <p className="no-grades-text">Chưa có dữ liệu điểm số công bố cho học kỳ này.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GradeTab;
