import React, { useState } from 'react';
import QuizProgressBar from './QuizProgressBar';
import MonacoCodeEditor from '../../../../../components/MonacoCodeEditor/MonacoCodeEditor';
import TestCasesTable from './TestCasesTable';
import api from '../../../../../api/axios';

function QuizActive({
  quizData,
  questions,
  currentIndex,
  answers,
  flags,
  entryId,
  remainingSeconds,
  submitting,
  isSidebarOpen,
  onSelectQuestion,
  onOptionChange,
  onMultiSelectOptionChange,
  onTextAnswerChange,
  onToggleFlag,
  onToggleSidebar,
  onPrevQuestion,
  onNextQuestion,
  onSubmitQuiz,
  onBackToLanding
}) {
  // 4.7 Dark Mode State for Quiz active taking interface
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Judge0 Code Execution state
  const [testingCode, setTestingCode] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const isTimeWarning = remainingSeconds !== null && remainingSeconds <= 300;
  const isTimeUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  const formatTimerString = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleRunCodeTests = async () => {
    const codeToTest = answers[currentIndex] || currentQuestion?.s3_object_code || '';
    if (!codeToTest.trim()) return;

    setTestingCode(true);
    setTestResults(null);
    try {
      const res = await api.post('/code/test-question', {
        question_id: currentQuestion.question_id,
        source_code: codeToTest,
        language: currentQuestion.coding_language || 'cpp'
      });
      setTestResults(res.data);
    } catch (err) {
      console.error('Lỗi thực thi code:', err);
      setTestResults({
        total: 1,
        passedCount: 0,
        results: [{
          success: false,
          engine: 'Judge0',
          stderr: 'Lỗi thực thi code: ' + (err.response?.data?.error || err.message),
          status: 'Error'
        }]
      });
    } finally {
      setTestingCode(false);
    }
  };

  if (!currentQuestion) return null;

  const isMultiChoice = currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
    Array.isArray(currentQuestion.correct_answer_indexes) && currentQuestion.correct_answer_indexes.length > 1
  );

  return (
    <div className={`quiz-active-wrapper ${isDarkMode ? 'dark-mode-theme' : ''}`}>
      <div className="quiz-body">
        <div className="quiz-left-content">
          {/* STICKY COUNTDOWN TIMER & TOOLBAR BANNER */}
          <div className="quiz-timer-banner" style={{
            background: isDarkMode ? '#2d3748' : (isTimeUrgent ? '#fff5f5' : isTimeWarning ? '#fffaf0' : '#f0fff4'),
            border: `1.5px solid ${isTimeUrgent ? '#feb2b2' : isTimeWarning ? '#fbd38d' : '#9ae6b4'}`,
            borderRadius: '10px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{isTimeUrgent ? '⚠️' : '⏱️'}</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: isDarkMode ? '#e2e8f0' : (isTimeUrgent ? '#c53030' : isTimeWarning ? '#c05621' : '#22543d') }}>
                {isTimeUrgent ? 'Sắp hết giờ!' : 'Thời gian còn lại:'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* 4.7 Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: isDarkMode ? '#4a5568' : '#edf2f7',
                  color: isDarkMode ? '#f6ad55' : '#2d3748',
                  border: '1px solid #cbd5e0',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title="Bật/Tắt chế độ tối"
              >
                {isDarkMode ? '☀️ Giao diện Sáng' : '🌙 Giao diện Tối'}
              </button>

              <div style={{
                fontSize: '24px',
                fontWeight: '900',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                color: isTimeUrgent ? '#e53e3e' : isTimeWarning ? '#dd6b20' : '#2b6cb0',
                padding: '4px 14px',
                background: isDarkMode ? '#1a202c' : '#fff',
                borderRadius: '6px',
                border: '1px solid #cbd5e0'
              }}>
                {formatTimerString(remainingSeconds)}
              </div>
            </div>
          </div>

          {/* 4.1 Progress Bar */}
          <QuizProgressBar current={currentIndex + 1} total={totalQuestions} answeredCount={answeredCount} />

          <div className="quiz-course-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {quizData?.title || 'Quiz'}
              {entryId && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>Lượt thi #{entryId}</span>}
            </div>
            <button
              className="quiz-btn quiz-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={onBackToLanding}
            >
              ← Quay lại (Tự động lưu)
            </button>
          </div>

          <div className="quiz-title-header-row">
            <div className="quiz-title-row">
              <span>❓ {quizData?.title || 'Quiz'}</span>
            </div>

            {!isSidebarOpen && (
              <button className="open-sidebar-btn" onClick={() => onToggleSidebar(true)}>
                📁 Bảng câu hỏi
              </button>
            )}
          </div>

          <div className="quiz-tools-bar">
            <div className="btn-current-text">
              Câu {currentIndex + 1} / {totalQuestions}
            </div>
            <button
              className={`btn-flag-toggle ${flags[currentIndex] ? 'flagged' : ''}`}
              onClick={onToggleFlag}
            >
              🚩 {flags[currentIndex] ? 'Đã đánh dấu' : 'Đánh dấu câu hỏi'}
            </button>
          </div>

          <div className="question-card-box">
            {/* 2.3 Image Display */}
            {currentQuestion.image_url && (
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <img
                  src={currentQuestion.image_url}
                  alt="Hình ảnh câu hỏi"
                  style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Mô tả câu hỏi */}
            <div className="question-text">
              {currentQuestion.description}
            </div>

            {/* 2.1 & 2.2 Multiple Choice Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="options-list">
                {isMultiChoice && (
                  <p style={{ fontSize: '12px', color: '#2b6cb0', fontStyle: 'italic', marginBottom: '8px' }}>
                    💡 Câu hỏi này có nhiều đáp án đúng (tích chọn các phương án thích hợp):
                  </p>
                )}
                {currentQuestion.options.map((opt, optIdx) => {
                  const optIndexVal = opt.option_index ?? (optIdx + 1);
                  const currentAns = answers[currentIndex];
                  
                  let isChecked = false;
                  if (Array.isArray(currentAns)) {
                    isChecked = currentAns.includes(optIndexVal);
                  } else {
                    isChecked = Number(currentAns) === Number(optIndexVal);
                  }

                  return (
                    <label key={opt.option_id || optIdx} className={`option-item-label ${isChecked ? 'selected-option' : ''}`}>
                      <input
                        type={isMultiChoice ? 'checkbox' : 'radio'}
                        name={`quiz-options-${currentQuestion.question_id}`}
                        checked={isChecked}
                        onChange={() => {
                          if (isMultiChoice) {
                            onMultiSelectOptionChange(optIndexVal);
                          } else {
                            onOptionChange(optIndexVal);
                          }
                        }}
                      />
                      {String.fromCharCode(65 + optIdx)}. {opt.text_content}
                    </label>
                  );
                })}
              </div>
            )}

            {/* 2.6 CODE type Question (Monaco Code Editor & Judge0 Execution Engine) */}
            {currentQuestion.question_type === 'CODE' && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#2b6cb0', fontWeight: 'bold' }}>
                    💻 Trình viết mã nguồn Monaco Editor ({currentQuestion.coding_language || 'cpp'}):
                  </span>
                  <button
                    onClick={handleRunCodeTests}
                    disabled={testingCode}
                    style={{
                      background: testingCode ? '#a0aec0' : '#2b6cb0',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: testingCode ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {testingCode ? '⏳ Đang thực thi trên Judge0...' : '▶ Chạy thử Code (Judge0 Engine)'}
                  </button>
                </div>

                <MonacoCodeEditor
                  value={answers[currentIndex] !== undefined ? answers[currentIndex] : (currentQuestion.s3_object_code || '')}
                  onChange={(val) => onTextAnswerChange(val)}
                  language={currentQuestion.coding_language || 'cpp'}
                  theme={isDarkMode ? 'dark' : 'vs-dark'}
                  height="260px"
                />

                {/* JUDGE0 TEST RESULTS TABLE (MOODLE / CODERUNNER STYLE) */}
                {testResults && testResults.results && (
                  <TestCasesTable
                    testResults={testResults.results}
                    canSeeExpected={true}
                  />
                )}
              </div>
            )}

            {/* SHORT_ANSWER or ESSAY */}
            {(!currentQuestion.options || currentQuestion.options.length === 0) && currentQuestion.question_type !== 'CODE' && (
              <div style={{ marginTop: '16px' }}>
                <textarea
                  className="short-answer-input"
                  placeholder="Nhập câu trả lời của bạn..."
                  value={answers[currentIndex] || ''}
                  onChange={(e) => onTextAnswerChange(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Nút điều hướng câu hỏi */}
            <div className="quiz-navigation-buttons-row">
              <button
                className="nav-step-btn"
                onClick={onPrevQuestion}
                disabled={currentIndex === 0}
              >
                ← Lùi lại
              </button>
              <button
                className="nav-step-btn"
                onClick={onNextQuestion}
                disabled={currentIndex === totalQuestions - 1}
              >
                Kế tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR TRẠNG THÁI CÂU HỎI */}
        {isSidebarOpen && (
          <div className="quiz-right-sidebar">
            <button className="sidebar-collapse-btn" onClick={() => onToggleSidebar(false)}>
              &lt;
            </button>

            <table className="matrix-table">
              <thead>
                <tr>
                  {questions.map((q, idx) => (
                    <th
                      key={q.question_id || idx}
                      onClick={() => onSelectQuestion(idx)}
                      style={{ cursor: 'pointer', background: idx === currentIndex ? '#008b44' : undefined, color: idx === currentIndex ? '#fff' : undefined }}
                    >
                      {idx + 1}
                      {flags[idx] && <span className="flag-indicator">🚩</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {questions.map((q, idx) => (
                    <td key={q.question_id || idx} onClick={() => onSelectQuestion(idx)} style={{ cursor: 'pointer' }}>
                      <div className={`status-circle ${answers[idx] !== undefined && answers[idx] !== '' ? 'filled' : ''}`}></div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div
              className="submit-quiz-link"
              onClick={!submitting ? onSubmitQuiz : undefined}
              style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizActive;
