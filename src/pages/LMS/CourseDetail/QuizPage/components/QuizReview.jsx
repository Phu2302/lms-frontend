import React from 'react';
import MonacoCodeEditor from '../../../../../components/MonacoCodeEditor/MonacoCodeEditor';
import TestCasesTable from './TestCasesTable';

function QuizReview({
  quizData,
  questions,
  selectedReviewEntry,
  reviewResponses,
  currentUser,
  isTeacher,
  canSeeCorrectAnswers,
  showAnswersMode,
  manualScores,
  savingManualScore,
  onManualScoreChange,
  onManualGrade,
  onCloseReview
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

  if (!selectedReviewEntry) return null;

  return (
    <div className="quiz-body" style={{ display: 'block' }}>
      <div className="quiz-landing-container" style={{ maxWidth: '900px' }}>
        <div className="review-question-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#005a2b', margin: 0 }}>Xem lại bài làm</h2>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
              Lượt thi #{selectedReviewEntry.entry_id} • Sinh viên MSSV: <strong>{selectedReviewEntry.student_id || currentUser?.user_id}</strong> • Bắt đầu: {formatDate(selectedReviewEntry.entry_start_time)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#008b44' }}>
              Điểm: {formatScore(selectedReviewEntry.entry_score)}
            </div>
          </div>
        </div>

        {/* THÔNG BÁO BẢO MẬT ĐÁP ÁN DÀNH CHO SINH VIÊN */}
        {!canSeeCorrectAnswers && (
          <div style={{ background: '#fffaf0', border: '1.5px solid #fbd38d', borderRadius: '8px', padding: '14px 18px', margin: '20px 0', color: '#c05621', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <strong>Đáp án chuẩn hiện đang được bảo mật.</strong>
              <br />
              {showAnswersMode === 'NEVER'
                ? 'Giảng viên đã bật chế độ ẩn đáp án chuẩn cho bài quiz này.'
                : `Đáp án chi tiết sẽ được công bố sau khi hết Hạn nộp bài (${formatDate(quizData?.deadline_time)}).`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginTop: '20px' }}>
          {questions.map((q, idx) => {
            const response = reviewResponses.find(r => Number(r.question_id) === Number(q.question_id));
            let studentAnswer = response ? response.student_answer : null;
            
            let studentAnsArr = [];
            if (studentAnswer !== null && studentAnswer !== undefined) {
              try {
                const parsed = JSON.parse(studentAnswer);
                studentAnsArr = Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
              } catch (_) {
                studentAnsArr = isNaN(studentAnswer) ? [studentAnswer] : [Number(studentAnswer)];
              }
            }

            const isCorrect = response ? Number(response.achieved_score) > 0 : false;
            const correctIndexes = canSeeCorrectAnswers && q.correct_answer_indexes
              ? (Array.isArray(q.correct_answer_indexes) ? q.correct_answer_indexes : [q.correct_answer_indexes]).map(Number)
              : [];

            const isEssayOrCode = (!q.options || q.options.length === 0) || q.question_type === 'CODE' || q.question_type === 'ESSAY';

            return (
              <div key={q.question_id || idx} className="question-card-box" style={{ borderLeft: isCorrect ? '6px solid #2e7d32' : '6px solid #c62828' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 'bold', color: '#005a2b' }}>Câu hỏi {idx + 1} ({q.question_score || 1}đ)</span>
                  <span className={isCorrect ? 'review-badge-correct' : 'review-badge-incorrect'}>
                    {isCorrect ? 'Đúng' : 'Chưa đạt'} ({response?.achieved_score || 0}đ)
                  </span>
                </div>

                {/* Question image */}
                {q.image_url && (
                  <div style={{ marginBottom: '12px' }}>
                    <img src={q.image_url} alt="Minh họa" style={{ maxHeight: '200px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}

                <div className="question-text" style={{ marginBottom: '15px' }}>
                  {q.description}
                </div>

                <div className="options-list">
                  {q.options && q.options.length > 0 && q.options.map((opt, optIdx) => {
                    const optIndexVal = opt.option_index ?? (optIdx + 1);
                    const isStudentSelected = studentAnsArr.includes(Number(optIndexVal));
                    const isCorrectOption = canSeeCorrectAnswers && correctIndexes.includes(Number(optIndexVal));

                    let optionClass = 'option-item-label';
                    if (isStudentSelected) {
                      optionClass += isCorrectOption ? ' correct' : ' incorrect';
                    } else if (isCorrectOption) {
                      optionClass += ' missed-correct';
                    }

                    return (
                      <div key={opt.option_id || optIdx} className={optionClass} style={{ pointerEvents: 'none' }}>
                        <input
                          type="checkbox"
                          disabled
                          checked={isStudentSelected}
                        />
                        {String.fromCharCode(65 + optIdx)}. {opt.text_content}
                      </div>
                    );
                  })}

                  {isEssayOrCode && (() => {
                    let displayCode = studentAnswer || '';
                    let savedTestResults = null;

                    if (studentAnswer) {
                      try {
                        const parsedObj = JSON.parse(studentAnswer);
                        if (parsedObj && typeof parsedObj === 'object' && parsedObj.code !== undefined) {
                          displayCode = parsedObj.code;
                          savedTestResults = parsedObj.test_results || null;
                        }
                      } catch (_) {}
                    }

                    return (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#666', marginBottom: '6px' }}>Câu trả lời của sinh viên:</div>
                        {q.question_type === 'CODE' ? (
                          <div style={{ marginBottom: '12px' }}>
                            <MonacoCodeEditor
                              value={displayCode || '// (Sinh viên chưa viết mã nguồn)'}
                              language={q.coding_language || 'cpp'}
                              theme="dark"
                              height="180px"
                              readOnly={true}
                            />

                            {/* HIỂN THỊ CẤU TRÚC BẢNG TESTCASES CHUẨN MOODLE / CODERUNNER */}
                            {savedTestResults && savedTestResults.length > 0 && (
                              <TestCasesTable
                                testResults={savedTestResults}
                                canSeeExpected={canSeeCorrectAnswers}
                              />
                            )}
                          </div>
                        ) : (
                          <div style={{
                            padding: '10px 15px',
                            background: '#f9f9f9',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            margin: '5px 0 10px 0',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {studentAnswer || '(Trống)'}
                          </div>
                        )}

                      {canSeeCorrectAnswers && q.question_type === 'SHORT_ANSWER' && q.short_answer_key && (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2e7d32' }}>Đáp án gợi ý:</div>
                          <div style={{
                            padding: '10px 15px',
                            background: '#e8f5e9',
                            border: '1.5px dashed #81c784',
                            borderRadius: '6px',
                            margin: '5px 0 10px 0',
                            fontWeight: 'bold',
                            color: '#2e7d32',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {q.short_answer_key}
                          </div>
                        </>
                      )}

                      {/* KHUNG GIẢNG VIÊN CHẤM ĐIỂM THỦ CÔNG */}
                      {isTeacher && response && (
                        <div style={{ background: '#edf2f7', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e0', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>✍️ Chấm điểm thủ công:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={q.question_score || 10}
                            style={{ width: '80px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #a0aec0' }}
                            value={manualScores[response.response_id] ?? 0}
                            onChange={(e) => onManualScoreChange(response.response_id, e.target.value)}
                          />
                          <button
                            onClick={() => onManualGrade(response.response_id, q.question_id, manualScores[response.response_id])}
                            disabled={savingManualScore}
                            style={{ background: '#008b44', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                          >
                            {savingManualScore ? 'Đang lưu...' : '💾 Lưu điểm'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
          <button className="quiz-btn quiz-btn-secondary" onClick={onCloseReview}>
            Quay lại trang quản lý quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizReview;
