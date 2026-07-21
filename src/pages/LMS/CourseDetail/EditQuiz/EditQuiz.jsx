import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import Header from '../../../../components/Header/Header';
import { useToast } from '../../../../components/Toast/ToastContext';
import '../AddQuiz/AddQuiz.css';

function EditQuiz() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [courseName, setCourseName] = useState('');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxEntry, setMaxEntry] = useState(1);
  const [totalScore, setTotalScore] = useState(10);
  const [openTime, setOpenTime] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [chapterId, setChapterId] = useState(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswersMode, setShowAnswersMode] = useState('AFTER_DEADLINE');

  // Danh sách câu hỏi (có thể là câu hỏi đã có hoặc mới thêm)
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId, courseId]);

  const fetchQuizDetails = async () => {
    setLoadingDetails(true);
    try {
      // 1. Lấy thông tin quiz (kèm câu hỏi + options)
      const quizRes = await api.get(`/quizzes/${quizId}/questions`);
      const quiz = quizRes.data;
      if (quiz) {
        setTitle(quiz.title || '');
        setTimeLimit(quiz.time_limit ?? 30);
        setMaxEntry(quiz.max_entry ?? 1);
        setTotalScore(quiz.total_score ?? 10);
        setChapterId(quiz.chapter_id);
        setShuffleQuestions(quiz.shuffle_questions !== false);
        setShowAnswersMode(quiz.show_answers_mode || 'AFTER_DEADLINE');

        if (quiz.open_time) {
          const d = new Date(quiz.open_time);
          if (!isNaN(d.getTime())) setOpenTime(d.toISOString().slice(0, 16));
        }
        if (quiz.deadline_time) {
          const d = new Date(quiz.deadline_time);
          if (!isNaN(d.getTime())) setDeadlineTime(d.toISOString().slice(0, 16));
        }

        // Map câu hỏi đã có từ DB về dạng state local
        const loadedQuestions = (quiz.questions || []).map(q => {
          // correct_answer_indexes lưu 1-based (1,2,3,4), convert về 0-based (0,1,2,3) cho UI
          const correctIdx1Based = q.correct_answer_indexes?.[0];
          const correctIdxLocal = correctIdx1Based != null ? Number(correctIdx1Based) - 1 : 0;

          // Map options về mảng 4 phần tử
          const opts = ['', '', '', ''];
          (q.options || []).forEach(opt => {
            const idx = Number(opt.option_index) - 1;
            if (idx >= 0 && idx < 4) opts[idx] = opt.text_content || '';
          });

          return {
            id: q.question_id,          // ID thật từ DB
            question_id: q.question_id, // giữ lại để biết là câu hỏi cũ
            isNew: false,
            question_type: q.question_type || 'MULTIPLE_CHOICE',
            description: q.description || '',
            question_score: q.question_score ?? 2.5,
            options: opts,
            correct_index: correctIdxLocal,
            short_answer_key: q.short_answer_key || '',
            coding_language: q.coding_language || 'cpp',
            s3_object_code: q.s3_object_code || '',
            // Lưu options gốc có option_id để xóa/cập nhật
            originalOptions: q.options || []
          };
        });
        setQuestions(loadedQuestions);
      }

      // 2. Lấy tên lớp học
      const classRes = await api.get(`/classes/view/${courseId}`);
      const cName = classRes.data?.class?.course_name || classRes.data?.class_name || `Lớp học ${courseId}`;
      setCourseName(cName);
    } catch (err) {
      console.error('Lỗi tải chi tiết Quiz:', err);
      showToast('Không thể tải thông tin bài Quiz.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Thêm câu hỏi MỚI (chưa có trong DB)
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        question_id: null,
        isNew: true,
        question_type: 'MULTIPLE_CHOICE',
        description: '',
        question_score: 2.5,
        options: ['', '', '', ''],
        correct_index: 0,
        short_answer_key: '',
        coding_language: 'cpp',
        s3_object_code: '',
        originalOptions: []
      }
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Xóa câu hỏi: nếu là câu hỏi cũ thì gọi API xóa, nếu mới thì chỉ xóa khỏi state
  const handleRemoveQuestion = async (index) => {
    const q = questions[index];
    if (!q.isNew && q.question_id) {
      if (!window.confirm(`Bạn chắc chắn muốn xóa câu hỏi ${index + 1}? Hành động này không thể hoàn tác.`)) return;
      try {
        await api.delete(`/questions/${q.question_id}`);
        showToast(`Đã xóa câu hỏi ${index + 1}.`, 'success');
      } catch (err) {
        showToast('Xóa câu hỏi thất bại: ' + (err.response?.data?.error || err.message), 'error');
        return;
      }
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài Quiz!', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Cập nhật thông tin Quiz
      await api.put(`/quizzes/${quizId}`, {
        chapter_id: chapterId ? Number(chapterId) : undefined,
        class_id: Number(courseId),
        title: title.trim(),
        time_limit: Number(timeLimit) || 30,
        max_entry: Number(maxEntry) || 1,
        total_score: Number(totalScore) || 10,
        open_time: openTime ? new Date(openTime).toISOString() : undefined,
        deadline_time: deadlineTime ? new Date(deadlineTime).toISOString() : undefined,
        shuffle_questions: shuffleQuestions,
        show_answers_mode: showAnswersMode
      });

      // 2. Xử lý từng câu hỏi
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.description.trim()) continue;

        const qPayload = {
          quiz_id: Number(quizId),
          question_index: i + 1,
          question_type: q.question_type,
          description: q.description.trim(),
          question_score: Number(q.question_score) || 0,
          correct_answer_indexes: q.question_type === 'MULTIPLE_CHOICE' ? [Number(q.correct_index) + 1] : undefined,
          short_answer_key: q.question_type === 'SHORT_ANSWER' ? q.short_answer_key.trim() : undefined,
          coding_language: q.question_type === 'CODE' ? q.coding_language : undefined,
          s3_object_code: q.question_type === 'CODE' ? q.s3_object_code : undefined
        };

        if (q.isNew) {
          // Câu hỏi mới: tạo mới hoàn toàn
          const qRes = await api.post('/questions', qPayload);
          const newQuestionId = qRes.data.question_id;

          if (q.question_type === 'MULTIPLE_CHOICE') {
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              const optText = q.options[optIdx];
              if (optText.trim()) {
                await api.post('/question-options', {
                  question_id: newQuestionId,
                  option_index: optIdx + 1,
                  text_content: optText.trim()
                });
              }
            }
          }
        } else {
          // Câu hỏi cũ: cập nhật thông tin câu hỏi
          await api.put(`/questions/${q.question_id}`, qPayload);

          // Nếu là trắc nghiệm: xóa options cũ và tạo lại
          if (q.question_type === 'MULTIPLE_CHOICE') {
            // Xóa options cũ
            for (const origOpt of (q.originalOptions || [])) {
              if (origOpt.option_id) {
                try { await api.delete(`/question-options/${origOpt.option_id}`); } catch (_) {}
              }
            }
            // Tạo options mới
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              const optText = q.options[optIdx];
              if (optText.trim()) {
                await api.post('/question-options', {
                  question_id: q.question_id,
                  option_index: optIdx + 1,
                  text_content: optText.trim()
                });
              }
            }
          }
        }
      }

      showToast('Đã cập nhật bài Quiz và câu hỏi thành công!', 'success');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error updating quiz:', err);
      showToast(err.response?.data?.error || 'Không thể cập nhật bài Quiz. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-content-page-container">
      <Header view="courses" />
      <div className="add-content-body" style={{ maxWidth: '800px' }}>
        <button className="back-btn-modern" onClick={() => navigate(`/lms/course/${courseId}`)}>
          ← Quay lại môn học
        </button>

        <div className="add-content-card">
          <div className="card-header-gradient">
            <h2>Chỉnh Sửa Bài Quiz</h2>
            {loadingDetails ? (
              <span className="subtitle-loading">Đang tải thông tin...</span>
            ) : (
              <span className="subtitle">
                {courseName} &gt; Bài Quiz #{quizId}
              </span>
            )}
          </div>

          {loadingDetails ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Đang tải dữ liệu Quiz...</div>
          ) : (
            <form onSubmit={handleSubmit} className="add-content-form">
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
                  <label htmlFor="quiz-max-entry">Số lần làm tối đa:</label>
                  <input
                    id="quiz-max-entry"
                    type="number"
                    min="0"
                    value={maxEntry}
                    onChange={(e) => setMaxEntry(e.target.value)}
                    placeholder="1 (0 = không giới hạn)"
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
              <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '15px 0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#2b6cb0', fontSize: '15px' }}>🛡️ Cấu hình Nâng cao cho Giảng viên</h4>
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
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                    >
                      <option value="AFTER_DEADLINE">🔒 Chỉ cho xem đáp án SAU HẠN NỘP BÀI</option>
                      <option value="ALWAYS">🔓 Cho phép xem đáp án NGAY sau khi nộp</option>
                      <option value="NEVER">🚫 KHÔNG bao giờ hiển thị đáp án (Chỉ xem điểm)</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />

              {/* DANH SÁCH CÂU HỎI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>
                  Danh sách câu hỏi ({questions.length})
                </h3>
                <button
                  type="button"
                  className="submit-btn-modern"
                  onClick={handleAddQuestion}
                  style={{ padding: '8px 16px', fontSize: '14px', background: '#2b6cb0' }}
                  disabled={loading}
                >
                  + Thêm câu hỏi mới
                </button>
              </div>

              {questions.length === 0 && (
                <div style={{ textAlign: 'center', color: '#a0aec0', padding: '24px', border: '2px dashed #e2e8f0', borderRadius: '8px', margin: '16px 0' }}>
                  Chưa có câu hỏi nào. Nhấn "+ Thêm câu hỏi mới" để bắt đầu.
                </div>
              )}

              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  style={{
                    background: q.isNew ? '#f0fff4' : '#f8fafc',
                    border: `1px solid ${q.isNew ? '#9ae6b4' : '#cbd5e0'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: q.isNew ? '#276749' : '#008b44' }}>
                      Câu {qIndex + 1} {q.isNew ? '✨ (Mới)' : ''}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕ Xóa câu này
                    </button>
                  </div>

                  <div className="form-group-grid">
                    <div className="form-group-modern">
                      <label>Loại câu hỏi:</label>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
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
                    <label>Nội dung câu hỏi:</label>
                    <textarea
                      rows="2"
                      value={q.description}
                      onChange={(e) => handleQuestionChange(qIndex, 'description', e.target.value)}
                      placeholder="Nhập nội dung đề bài câu hỏi..."
                    />
                  </div>

                  {/* Trắc nghiệm */}
                  {q.question_type === 'MULTIPLE_CHOICE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Các lựa chọn trả lời & Đáp án đúng:</label>
                      {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name={`correct-opt-${qIndex}`}
                            checked={Number(q.correct_index) === optIdx}
                            onChange={() => handleQuestionChange(qIndex, 'correct_index', optIdx)}
                          />
                          <span style={{ fontWeight: 'bold', width: '20px' }}>{label}.</span>
                          <input
                            type="text"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '14px' }}
                            placeholder={`Lựa chọn ${label}...`}
                            value={q.options[optIdx] || ''}
                            onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tự luận ngắn */}
                  {q.question_type === 'SHORT_ANSWER' && (
                    <div className="form-group-modern">
                      <label>Từ khóa đáp án chuẩn:</label>
                      <input
                        type="text"
                        value={q.short_answer_key}
                        onChange={(e) => handleQuestionChange(qIndex, 'short_answer_key', e.target.value)}
                        placeholder="Ví dụ: 3.14 hoặc Hà Nội..."
                      />
                    </div>
                  )}

                  {/* Lập trình CODE */}
                  {q.question_type === 'CODE' && (
                    <div className="form-group-grid">
                      <div className="form-group-modern">
                        <label>Ngôn ngữ lập trình:</label>
                        <select
                          value={q.coding_language}
                          onChange={(e) => handleQuestionChange(qIndex, 'coding_language', e.target.value)}
                        >
                          <option value="cpp">C++</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="javascript">JavaScript</option>
                        </select>
                      </div>
                      <div className="form-group-modern">
                        <label>Mã nguồn/Testcase mẫu:</label>
                        <input
                          type="text"
                          value={q.s3_object_code}
                          onChange={(e) => handleQuestionChange(qIndex, 's3_object_code', e.target.value)}
                          placeholder="Link hoặc mã code..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="form-actions-modern">
                <button type="submit" className="submit-btn-modern" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default EditQuiz;
