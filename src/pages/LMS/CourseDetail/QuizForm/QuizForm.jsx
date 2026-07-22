import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../../components/Header/Header';
import { useToast } from '../../../../components/Toast/ToastContext';
import MonacoCodeEditor from '../../../../components/MonacoCodeEditor/MonacoCodeEditor';
import './QuizForm.css';

function QuizForm({
  isEdit = false,
  courseId,
  chapterId,
  quizId,
  initialData = null,
  onSubmit,
  loading = false,
  courseName = '',
  chapterName = ''
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // General Quiz Info
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxEntry, setMaxEntry] = useState(1);
  const [totalScore, setTotalScore] = useState(10);
  const [openTime, setOpenTime] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswersMode, setShowAnswersMode] = useState('AFTER_DEADLINE');

  // Questions List
  const [questions, setQuestions] = useState([]);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Drag & Drop State
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setTimeLimit(initialData.time_limit ?? 30);
      setMaxEntry(initialData.max_entry ?? 1);
      setTotalScore(initialData.total_score ?? 10);
      setShuffleQuestions(initialData.shuffle_questions !== false);
      setShowAnswersMode(initialData.show_answers_mode || 'AFTER_DEADLINE');

      if (initialData.open_time) {
        const d = new Date(initialData.open_time);
        if (!isNaN(d.getTime())) setOpenTime(d.toISOString().slice(0, 16));
      }
      if (initialData.deadline_time) {
        const d = new Date(initialData.deadline_time);
        if (!isNaN(d.getTime())) setDeadlineTime(d.toISOString().slice(0, 16));
      }

      if (initialData.questions && initialData.questions.length > 0) {
        setQuestions(initialData.questions);
      }
    }
  }, [initialData]);

  // Handle adding a new question
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        question_id: null,
        isNew: true,
        question_type: 'MULTIPLE_CHOICE',
        description: '',
        image_url: '',
        question_score: 2.5,
        options: ['', '', '', ''],
        correct_indexes: [0], // 0-based array of correct option indices
        short_answer_key: '',
        coding_language: 'cpp',
        s3_object_code: '// Write starter code or testcases here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}'
      }
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;

    if (field === 'question_type' && value === 'CODE') {
      if (!updated[index].test_cases || updated[index].test_cases.length === 0) {
        updated[index].test_cases = [
          { input: '2 3', expected_output: '5', is_hidden: false },
          { input: '10 20', expected_output: '30', is_hidden: false }
        ];
      }
      if (!updated[index].s3_object_code) {
        updated[index].s3_object_code = '// Starter code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << a + b;\n    }\n    return 0;\n}';
      }
    }

    setQuestions(updated);
  };

  // Option count change (2-8 options) (2.1)
  const handleOptionCountChange = (qIndex, targetCount) => {
    const count = Math.max(2, Math.min(8, targetCount));
    const updated = [...questions];
    const currentOpts = updated[qIndex].options || [];
    if (count > currentOpts.length) {
      const added = Array(count - currentOpts.length).fill('');
      updated[qIndex].options = [...currentOpts, ...added];
    } else {
      updated[qIndex].options = currentOpts.slice(0, count);
      // Filter out removed indices from correct_indexes
      updated[qIndex].correct_indexes = (updated[qIndex].correct_indexes || [0]).filter(idx => idx < count);
      if (updated[qIndex].correct_indexes.length === 0) {
        updated[qIndex].correct_indexes = [0];
      }
    }
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Multi-select MCQ toggle correct answer (2.2)
  const handleToggleCorrectOption = (qIndex, optIndex, isSingleChoice = false) => {
    const updated = [...questions];
    let currentCorrect = updated[qIndex].correct_indexes || [0];
    if (isSingleChoice) {
      updated[qIndex].correct_indexes = [optIndex];
    } else {
      if (currentCorrect.includes(optIndex)) {
        if (currentCorrect.length > 1) {
          updated[qIndex].correct_indexes = currentCorrect.filter(i => i !== optIndex);
        } else {
          showToast('Câu hỏi trắc nghiệm phải có ít nhất 1 đáp án đúng!', 'warning');
          return;
        }
      } else {
        updated[qIndex].correct_indexes = [...currentCorrect, optIndex].sort((a, b) => a - b);
      }
    }
    setQuestions(updated);
  };

  // Test cases handlers for CODE questions
  const handleAddTestCase = (qIndex) => {
    const updated = [...questions];
    const currentTC = updated[qIndex].test_cases || [];
    updated[qIndex].test_cases = [
      ...currentTC,
      { input: '', expected_output: '', is_hidden: false }
    ];
    setQuestions(updated);
  };

  const handleTestCaseChange = (qIndex, tcIndex, field, value) => {
    const updated = [...questions];
    const currentTC = [...(updated[qIndex].test_cases || [])];
    currentTC[tcIndex] = { ...currentTC[tcIndex], [field]: value };
    updated[qIndex].test_cases = currentTC;
    setQuestions(updated);
  };

  const handleRemoveTestCase = (qIndex, tcIndex) => {
    const updated = [...questions];
    updated[qIndex].test_cases = (updated[qIndex].test_cases || []).filter((_, i) => i !== tcIndex);
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Reorder Questions Up / Down (4.4)
  const handleMoveQuestion = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  // Drag & Drop Handlers (4.4)
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const updated = [...questions];
    const item = updated.splice(draggedIdx, 1)[0];
    updated.splice(index, 0, item);
    setDraggedIdx(index);
    setQuestions(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Import CSV / Text Parser (2.5)
  const handleProcessImportCSV = () => {
    if (!csvText.trim()) {
      showToast('Vui lòng dán nội dung CSV/Text câu hỏi!', 'error');
      return;
    }

    try {
      const lines = csvText.split('\n').filter(l => l.trim());
      const newQuestions = [];

      lines.forEach((line, idx) => {
        // Expected CSV format: Description, OptionA, OptionB, OptionC, OptionD, CorrectOptionLetter (A/B/C/D), Score
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const desc = parts[0];
          const opts = parts.slice(1, -2).length >= 2 ? parts.slice(1, -2) : [parts[1], parts[2], parts[3] || '', parts[4] || ''];
          const correctLetter = (parts[parts.length - 2] || 'A').toUpperCase();
          const score = parseFloat(parts[parts.length - 1]) || 2.5;

          const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7 };
          const correctIdx = letterMap[correctLetter] ?? 0;

          newQuestions.push({
            id: Date.now() + idx + Math.random(),
            isNew: true,
            question_type: 'MULTIPLE_CHOICE',
            description: desc,
            image_url: '',
            question_score: score,
            options: opts.slice(0, 8),
            correct_indexes: [correctIdx],
            short_answer_key: '',
            coding_language: 'cpp',
            s3_object_code: ''
          });
        }
      });

      if (newQuestions.length === 0) {
        showToast('Không đọc được câu hỏi nào từ định dạng trên. Vui lòng kiểm tra lại cấu trúc file!', 'error');
        return;
      }

      setQuestions(prev => [...prev, ...newQuestions]);
      setShowImportModal(false);
      setCsvText('');
      showToast(`Đã nhập thành công ${newQuestions.length} câu hỏi mới!`, 'success');
    } catch (err) {
      console.error('Lỗi parse CSV:', err);
      showToast('Lỗi đọc dữ liệu CSV. Vui lòng kiểm tra lại định dạng!', 'error');
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài Quiz!', 'error');
      return;
    }

    const payload = {
      title: title.trim(),
      time_limit: Number(timeLimit) || 30,
      max_entry: Number(maxEntry) || 1,
      total_score: Number(totalScore) || 10,
      open_time: openTime ? new Date(openTime).toISOString() : undefined,
      deadline_time: deadlineTime ? new Date(deadlineTime).toISOString() : undefined,
      shuffle_questions: shuffleQuestions,
      show_answers_mode: showAnswersMode,
      questions
    };

    onSubmit(payload);
  };

  return (
    <div className="add-content-page-container">
      <Header view="courses" />
      <div className="add-content-body" style={{ maxWidth: '900px' }}>
        <button className="back-btn-modern" onClick={() => navigate(`/lms/course/${courseId}`)}>
          ← Quay lại môn học
        </button>

        <div className="add-content-card">
          <div className="card-header-gradient">
            <h2>{isEdit ? 'Chỉnh Sửa Bài Quiz' : 'Thêm Bài Quiz & Danh Sách Câu Hỏi'}</h2>
            <span className="subtitle">
              {courseName} &gt; {chapterName || `Chương ${chapterId}`}
            </span>
          </div>

          <form onSubmit={handleSubmitForm} className="add-content-form">
            {/* THÔNG TIN CHUNG */}
            <div className="form-group-modern">
              <label htmlFor="quiz-title">Tiêu đề bài kiểm tra (Quiz):</label>
              <input
                id="quiz-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề quiz..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group-grid">
              <div className="form-group-modern">
                <label htmlFor="quiz-time-limit">Thời gian làm bài (Phút):</label>
                <input
                  id="quiz-time-limit"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="30 phút"
                  disabled={loading}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="quiz-max-entry">Số lần làm tối đa (0 = không giới hạn):</label>
                <input
                  id="quiz-max-entry"
                  type="number"
                  min="0"
                  value={maxEntry}
                  onChange={(e) => setMaxEntry(e.target.value)}
                  placeholder="1"
                  disabled={loading}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="quiz-total-score">Tổng điểm bài thi:</label>
                <input
                  id="quiz-total-score"
                  type="number"
                  min="1"
                  step="0.5"
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value)}
                  placeholder="10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group-modern">
                <label htmlFor="quiz-open-time">Thời gian mở đề (Tùy chọn):</label>
                <input
                  id="quiz-open-time"
                  type="datetime-local"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="quiz-deadline">Hạn chót nộp bài (Tùy chọn):</label>
                <input
                  id="quiz-deadline"
                  type="datetime-local"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* CẤU HÌNH NÂNG CAO */}
            <div className="quiz-advanced-config-card">
              <h4 className="advanced-config-title">🛡️ Cấu hình Nâng cao cho Giảng viên</h4>
              <div className="form-group-grid">
                <div className="form-group-modern" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="quiz-shuffle"
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="quiz-shuffle" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>
                    🔀 Trộn ngẫu nhiên câu hỏi & đáp án
                  </label>
                </div>

                <div className="form-group-modern">
                  <label htmlFor="quiz-show-answers">Chế độ hiển thị đáp án chuẩn:</label>
                  <select
                    id="quiz-show-answers"
                    value={showAnswersMode}
                    onChange={(e) => setShowAnswersMode(e.target.value)}
                    className="modern-select"
                  >
                    <option value="AFTER_DEADLINE">🔒 Chỉ cho xem đáp án SAU HẠN NỘP BÀI</option>
                    <option value="ALWAYS">🔓 Cho phép xem đáp án NGAY sau khi nộp</option>
                    <option value="NEVER">🚫 KHÔNG bao giờ hiển thị đáp án (Chỉ xem điểm)</option>
                  </select>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

            {/* DANH SÁCH CÂU HỎI */}
            <div className="questions-section-header">
              <h3 className="section-title-text">
                Danh sách câu hỏi ({questions.length})
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="import-csv-btn"
                  onClick={() => setShowImportModal(true)}
                  disabled={loading}
                >
                  📥 Nhập từ CSV
                </button>
                <button
                  type="button"
                  className="submit-btn-modern"
                  onClick={handleAddQuestion}
                  style={{ padding: '8px 16px', fontSize: '14px', background: '#2b6cb0' }}
                  disabled={loading}
                >
                  + Thêm câu hỏi
                </button>
              </div>
            </div>

            {questions.length === 0 && (
              <div className="empty-questions-notice">
                Chưa có câu hỏi nào. Nhấn <strong>"+ Thêm câu hỏi"</strong> hoặc <strong>"📥 Nhập từ CSV"</strong> để bắt đầu soạn đề.
              </div>
            )}

            {/* QUESTION CARDS */}
            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => handleDragStart(e, qIndex)}
                onDragOver={(e) => handleDragOver(e, qIndex)}
                onDragEnd={handleDragEnd}
                className={`question-editor-card ${draggedIdx === qIndex ? 'dragging' : ''}`}
              >
                {/* Header thanh công cụ câu hỏi */}
                <div className="question-card-topbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="drag-handle-icon" title="Kéo thả để sắp xếp">☰</span>
                    <strong style={{ color: '#008b44' }}>Câu {qIndex + 1} {q.isNew ? '✨ (Mới)' : ''}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-order-step"
                      onClick={() => handleMoveQuestion(qIndex, -1)}
                      disabled={qIndex === 0}
                      title="Di chuyển lên"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="btn-order-step"
                      onClick={() => handleMoveQuestion(qIndex, 1)}
                      disabled={qIndex === questions.length - 1}
                      title="Di chuyển xuống"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="btn-delete-q"
                    >
                      ✕ Xóa câu này
                    </button>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group-modern">
                    <label>Loại câu hỏi:</label>
                    <select
                      value={q.question_type}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                      className="modern-select"
                    >
                      <option value="MULTIPLE_CHOICE"> Trắc nghiệm (MULTIPLE_CHOICE)</option>
                      <option value="SHORT_ANSWER">✍️ Tự luận ngắn / Điền từ (SHORT_ANSWER)</option>
                      <option value="ESSAY">📝 Bài tự luận dài (ESSAY)</option>
                      <option value="CODE">💻 Bài tập Lập trình (CODE)</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Điểm câu hỏi:</label>
                    <input
                      type="number"
                      step="0.25"
                      value={q.question_score}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_score', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Nội dung đề bài:</label>
                  <textarea
                    rows="2"
                    value={q.description}
                    onChange={(e) => handleQuestionChange(qIndex, 'description', e.target.value)}
                    placeholder="Nhập nội dung đề bài câu hỏi..."
                    required
                  />
                </div>

                {/* 2.3 Image URL Support */}
                <div className="form-group-modern">
                  <label>🖼️ Đường dẫn hình ảnh minh họa (Tùy chọn URL Image):</label>
                  <input
                    type="url"
                    value={q.image_url || ''}
                    onChange={(e) => handleQuestionChange(qIndex, 'image_url', e.target.value)}
                    placeholder="https://example.com/diagram.png"
                  />
                  {q.image_url && (
                    <div className="image-preview-wrapper">
                      <img src={q.image_url} alt="Minh họa câu hỏi" className="q-preview-img" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>

                {/* 2.1 & 2.2 Options for MULTIPLE_CHOICE */}
                {q.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="mcq-options-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>
                        Các lựa chọn & Đáp án đúng (Tích checkbox để chọn đáp án đúng):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Số lượng lựa chọn:</span>
                        <select
                          value={q.options.length}
                          onChange={(e) => handleOptionCountChange(qIndex, Number(e.target.value))}
                          className="modern-select"
                          style={{ padding: '2px 8px', fontSize: '12px' }}
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={n}>{n} lựa chọn</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(q.options || []).map((opt, optIdx) => {
                      const labelLetter = String.fromCharCode(65 + optIdx);
                      const isCorrect = (q.correct_indexes || [0]).includes(optIdx);

                      return (
                        <div key={optIdx} className={`mcq-option-editor-row ${isCorrect ? 'is-correct-selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isCorrect}
                            onChange={() => handleToggleCorrectOption(qIndex, optIdx)}
                            title="Đánh dấu đáp án đúng"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 'bold', width: '22px', color: isCorrect ? '#276749' : '#4a5568' }}>
                            {labelLetter}.
                          </span>
                          <input
                            type="text"
                            className="option-text-input"
                            placeholder={`Lựa chọn ${labelLetter}...`}
                            value={opt || ''}
                            onChange={(e) => handleOptionTextChange(qIndex, optIdx, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2.6 Enhanced Monaco Code Editor & Judge0 Test Cases for CODE Questions */}
                {q.question_type === 'CODE' && (
                  <div className="code-editor-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#90cdf4' }}>
                        💻 Mã nguồn khởi tạo cho Sinh viên (Starter Code Template):
                      </label>
                      <select
                        value={q.coding_language || 'cpp'}
                        onChange={(e) => handleQuestionChange(qIndex, 'coding_language', e.target.value)}
                        className="modern-select"
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                      >
                        <option value="cpp">C++ (GCC 9.2.0)</option>
                        <option value="python">Python 3 (3.8.1)</option>
                        <option value="java">Java (OpenJDK 13)</option>
                        <option value="javascript">JavaScript (Node.js 12)</option>
                        <option value="c">C (GCC 9.2.0)</option>
                      </select>
                    </div>

                    <MonacoCodeEditor
                      value={q.s3_object_code || ''}
                      onChange={(val) => handleQuestionChange(qIndex, 's3_object_code', val)}
                      language={q.coding_language || 'cpp'}
                      theme="dark"
                      height="180px"
                    />

                    {/* HIDDEN DRIVER CODE EDITOR */}
                    <div style={{ marginTop: '14px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#f6ad55', display: 'block', marginBottom: '6px' }}>
                        🔒 Mã nguồn ẩn của Giảng viên (Hidden Driver Code - Dùng <code>{`{{STUDENT_CODE}}`}</code> để làm vị trí chèn bài sinh viên):
                      </label>
                      <MonacoCodeEditor
                        value={q.hidden_code || ''}
                        onChange={(val) => handleQuestionChange(qIndex, 'hidden_code', val)}
                        language={q.coding_language || 'cpp'}
                        theme="dark"
                        height="180px"
                      />
                    </div>

                    {/* JUDGE0 TEST CASES MANAGER */}
                    <div style={{ marginTop: '16px', background: '#2d3748', padding: '14px', borderRadius: '8px', border: '1px solid #4a5568' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#68d391' }}>
                          ⚡ Bộ Test Cases chấm tự động (Judge0 Execution Engine):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddTestCase(qIndex)}
                          style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          + Thêm Test Case
                        </button>
                      </div>

                      {(!q.test_cases || q.test_cases.length === 0) && (
                        <p style={{ fontSize: '12px', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
                          Chưa có test case nào. Nhấn "+ Thêm Test Case" để tạo bộ test chấm điểm tự động.
                        </p>
                      )}

                      {(q.test_cases || []).map((tc, tcIdx) => (
                        <div key={tcIdx} style={{ background: '#1a202c', padding: '10px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #4a5568' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                            <strong style={{ color: '#e2e8f0' }}>Test Case #{tcIdx + 1}</strong>
                            <button
                              type="button"
                              onClick={() => handleRemoveTestCase(qIndex, tcIdx)}
                              style={{ background: 'transparent', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✕ Xóa
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: '#a0aec0' }}>Đầu vào (Input / Stdin):</span>
                              <textarea
                                rows="2"
                                value={tc.input || ''}
                                onChange={(e) => handleTestCaseChange(qIndex, tcIdx, 'input', e.target.value)}
                                placeholder="Ví dụ: 2 3"
                                style={{ width: '100%', background: '#2d3748', color: '#fff', border: '1px solid #4a5568', borderRadius: '4px', padding: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '11px', color: '#a0aec0' }}>Đầu ra kỳ vọng (Expected Output / Stdout):</span>
                              <textarea
                                rows="2"
                                value={tc.expected_output || ''}
                                onChange={(e) => handleTestCaseChange(qIndex, tcIdx, 'expected_output', e.target.value)}
                                placeholder="Ví dụ: 5"
                                style={{ width: '100%', background: '#2d3748', color: '#fff', border: '1px solid #4a5568', borderRadius: '4px', padding: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SHORT_ANSWER */}
                {q.question_type === 'SHORT_ANSWER' && (
                  <div className="form-group-modern">
                    <label>Từ khóa đáp án chuẩn (short_answer_key):</label>
                    <input
                      type="text"
                      value={q.short_answer_key || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'short_answer_key', e.target.value)}
                      placeholder="Ví dụ: 3.14 hoặc Hà Nội..."
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="form-actions-modern">
              <button type="submit" className="submit-btn-modern" disabled={loading}>
                {loading ? 'Đang lưu...' : isEdit ? 'Lưu Thay Đổi Quiz' : 'Hoàn tất & Lưu Quiz'}
              </button>
              <button
                type="button"
                className="cancel-btn-modern"
                onClick={() => navigate(`/lms/course/${courseId}`)}
                disabled={loading}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2.5 CSV Import Modal */}
      {showImportModal && (
        <div className="csv-modal-overlay">
          <div className="csv-modal-box">
            <h3 style={{ margin: '0 0 10px 0', color: '#005a2b' }}>📥 Nhập câu hỏi trắc nghiệm từ CSV / Text</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
              Cấu trúc mỗi dòng (cách nhau bằng dấu phẩy):<br />
              <code>Nội dung câu hỏi, Lựa chọn A, Lựa chọn B, Lựa chọn C, Lựa chọn D, Đáp án đúng (A/B/C/D), Điểm số</code>
            </p>

            <textarea
              rows="8"
              className="csv-input-area"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Ví dụ:\n"Thủ đô của Việt Nam là gì?", "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "B", 2.5\n"1 + 1 bằng mấy?", "1", "2", "3", "4", "B", 2.5`}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button
                type="button"
                className="cancel-btn-modern"
                onClick={() => setShowImportModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="submit-btn-modern"
                onClick={handleProcessImportCSV}
              >
                Xác nhận Nhập câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizForm;
