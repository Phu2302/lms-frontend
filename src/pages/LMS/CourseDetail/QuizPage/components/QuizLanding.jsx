import React from 'react';
import ScoreHistogram from './ScoreHistogram';

function QuizLanding({
  quizData,
  pastEntries,
  allEntries,
  isTeacher,
  currentUser,
  onStartAttempt,
  onResumeAttempt,
  onReviewAttempt,
  onDeleteEntry,
  onExportCSV,
  onBackToCourse,
  onRefreshEntries
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không giới hạn';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '—';
    const num = Number(score);
    return isNaN(num) ? score : num.toFixed(2);
  };

  const computeAnalytics = () => {
    const validEntries = allEntries.filter(e => e.entry_score !== null && e.entry_score !== undefined);
    const totalCount = validEntries.length;
    if (totalCount === 0) return { totalCount: 0, avgScore: 0, maxScore: 0, passRate: 0 };

    const scores = validEntries.map(e => Number(e.entry_score));
    const avgScore = (scores.reduce((a, b) => a + b, 0) / totalCount).toFixed(2);
    const maxScore = Math.max(...scores).toFixed(2);
    const passCount = scores.filter(s => s >= 5.0).length;
    const passRate = Math.round((passCount / totalCount) * 100);

    return { totalCount, avgScore, maxScore, passRate };
  };

  // 3.5 PDF Report Printing
  const handlePrintPDFReport = () => {
    window.print();
  };

  const analytics = computeAnalytics();
  const totalAttempts = pastEntries.length;
  const unsubmittedEntry = pastEntries.find(e => e.entry_score === null);
  const canAttempt = !unsubmittedEntry && (quizData?.max_entry === 0 || totalAttempts < (quizData?.max_entry || 99));

  return (
    <div className="quiz-landing-container">
      <div className="landing-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="quiz-landing-title" style={{ margin: 0 }}>{quizData?.title || 'Quiz'}</h2>
        {isTeacher && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrintPDFReport}
              style={{ background: '#4a5568', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              title="In / Xuất file PDF"
            >
              🖨️ In / PDF Báo cáo
            </button>
            <button
              onClick={onExportCSV}
              style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📥 Xuất CSV
            </button>
          </div>
        )}
      </div>

      <div className="quiz-info-grid" style={{ marginTop: '15px' }}>
        <div className="quiz-info-card">
          <div className="quiz-info-label">Thời gian mở</div>
          <div className="quiz-info-value">{formatDate(quizData?.open_time)}</div>
        </div>
        <div className="quiz-info-card">
          <div className="quiz-info-label">Hạn nộp bài</div>
          <div className="quiz-info-value">{formatDate(quizData?.deadline_time)}</div>
        </div>
        <div className="quiz-info-card" style={{ background: '#f0fff4', border: '1.5px solid #68d391' }}>
          <div className="quiz-info-label" style={{ color: '#276749', fontWeight: 'bold' }}>⏱️ Thời gian làm bài</div>
          <div className="quiz-info-value" style={{ color: '#22543d', fontWeight: '800' }}>
            {quizData?.time_limit ? `${quizData.time_limit} phút` : '30 phút'}
          </div>
        </div>
        <div className="quiz-info-card">
          <div className="quiz-info-label">Số lần làm tối đa</div>
          <div className="quiz-info-value">
            {quizData?.max_entry ? `${quizData.max_entry} lần` : 'Không giới hạn'}
          </div>
        </div>
      </div>

      {/* BẢNG THỐNG KÊ PHỔ ĐIỂM DÀNH CHO GIẢNG VIÊN (3.1) */}
      {isTeacher && (
        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '12px', padding: '20px', marginBottom: '25px', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2b6cb0', fontSize: '16px' }}>📊 Thống kê Phổ điểm & Phân tích lớp học</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096' }}>Tổng lượt nộp bài</span>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d3748' }}>{analytics.totalCount}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096' }}>Điểm trung bình</span>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#3182ce' }}>{analytics.avgScore}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096' }}>Điểm cao nhất</span>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38a169' }}>{analytics.maxScore}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096' }}>Tỷ lệ Đạt (≥ 5.0)</span>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: analytics.passRate >= 70 ? '#38a169' : '#e53e3e' }}>{analytics.passRate}%</div>
            </div>
          </div>

          {/* 3.1 Histogram Chart */}
          <ScoreHistogram entries={allEntries} />
        </div>
      )}

      {/* BẢNG QUẢN LÝ DÀNH CHO GIẢNG VIÊN */}
      {isTeacher && (
        <div className="quiz-history-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#008b44' }}>🛡️ Quản lý tất cả lượt thi của Sinh viên (Giảng viên)</h3>
            <button onClick={onRefreshEntries} style={{ background: '#edf2f7', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              🔄 Tải lại danh sách
            </button>
          </div>
          {allEntries.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>Chưa có sinh viên nào thực hiện bài quiz này.</p>
          ) : (
            <table className="quiz-history-table">
              <thead>
                <tr>
                  <th>Mã lượt (ID)</th>
                  <th>MSSV (Sinh viên)</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Điểm số</th>
                  <th>Hành động Quản lý</th>
                </tr>
              </thead>
              <tbody>
                {allEntries.map((entry) => (
                  <tr key={entry.entry_id}>
                    <td><strong>#{entry.entry_id}</strong></td>
                    <td><strong>{entry.student_id}</strong></td>
                    <td>{formatDate(entry.entry_start_time)}</td>
                    <td>
                      {entry.entry_score !== null && entry.entry_score !== undefined ? (
                        <span className="badge-score-submitted">{formatScore(entry.entry_score)}</span>
                      ) : (
                        <span className="badge-score-pending">Đang làm dở</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="quiz-btn-action" onClick={() => onReviewAttempt(entry)}>
                          👁️ Xem bài & Chấm
                        </button>
                        <button
                          className="quiz-btn-action"
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                          onClick={() => onDeleteEntry(entry.entry_id)}
                        >
                          🗑️ Xóa lượt này
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* LỊCH SỬ CÁ NHÂN */}
      <div className="quiz-history-section">
        <h3>Lịch sử thi cá nhân của bạn</h3>
        {pastEntries.length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic' }}>Bạn chưa thực hiện lượt làm bài nào.</p>
        ) : (
          <table className="quiz-history-table">
            <thead>
              <tr>
                <th>Lượt #</th>
                <th>Thời gian bắt đầu</th>
                <th>Điểm số</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pastEntries.map((entry, idx) => (
                <tr key={entry.entry_id || idx}>
                  <td>{idx + 1}</td>
                  <td>{formatDate(entry.entry_start_time)}</td>
                  <td>
                    {entry.entry_score !== null && entry.entry_score !== undefined ? (
                      <span className="badge-score-submitted">{formatScore(entry.entry_score)}</span>
                    ) : (
                      <span className="badge-score-pending">Đang làm dở</span>
                    )}
                  </td>
                  <td>
                    {entry.entry_score !== null && entry.entry_score !== undefined ? (
                      <button className="quiz-btn-action" onClick={() => onReviewAttempt(entry)}>
                        Xem lại bài làm
                      </button>
                    ) : (
                      <button className="quiz-btn-action" style={{ background: '#e8f5e9', color: '#2e7d32' }} onClick={() => onResumeAttempt(entry)}>
                        Tiếp tục làm bài
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '20px' }}>
        <button className="quiz-btn quiz-btn-secondary" onClick={onBackToCourse}>
          ← Quay lại lớp học
        </button>

        {unsubmittedEntry ? (
          <button className="quiz-btn quiz-btn-primary" onClick={() => onResumeAttempt(unsubmittedEntry)}>
            Tiếp tục làm bài (Lượt đang mở)
          </button>
        ) : canAttempt ? (
          <button className="quiz-btn quiz-btn-primary" onClick={onStartAttempt}>
            🚀 Bắt đầu làm bài mới ({quizData?.time_limit || 30} phút)
          </button>
        ) : (
          <button className="quiz-btn quiz-btn-primary" disabled>
            ❌ Đã dùng hết lượt thi
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizLanding;
