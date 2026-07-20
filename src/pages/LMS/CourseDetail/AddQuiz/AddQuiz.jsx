import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import Header from '../../../../components/Header/Header';
import './AddQuiz.css';

function AddQuiz() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();

  // Thông tin bài Quiz
  const [courseName, setCourseName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxEntry, setMaxEntry] = useState(1);
  const [totalScore, setTotalScore] = useState(10);
  const [openTime, setOpenTime] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  
  // Cấu hình Nâng cao (Trộn đề & Bảo mật đáp án)
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswersMode, setShowAnswersMode] = useState('AFTER_DEADLINE');

  // Danh sách các câu hỏi của Quiz
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/classes/view/${courseId}`);
        const data = res.data;
        const cName = data?.class?.course_name || data?.class_name || data?.course_name || `Lớp học ${courseId}`;
        setCourseName(cName);

        const chapterList = data.chapters || data.Chapters || [];
        const currentChapter = chapterList.find(c => Number(c.chapter_id) === Number(chapterId));
        if (currentChapter) {
          setChapterName(currentChapter.chapter_name);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin chi tiết:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [courseId, chapterId]);

  // Thêm một câu hỏi mới vào danh sách dạng draft
  const handleAddQuestionPrompt = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        question_type: 'MULTIPLE_CHOICE',
        description: '',
        question_score: 2.5,
        options: ['', '', '', ''],
        correct_index: 0,
        short_answer_key: '',
        coding_language: 'cpp',
        s3_object_code: ''
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

  const handleRemoveQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài Quiz!');
      return;
    }

    setLoading(true);
    try {
      // 1. Tạo Quiz
      const quizRes = await api.post('/quizzes', {
        chapter_id: Number(chapterId),
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

      const newQuizId = quizRes.data.quiz_id;

      // 2. Tạo từng câu hỏi & options
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.description.trim()) continue;

        const qPayload = {
          quiz_id: newQuizId,
          question_index: i + 1,
          question_type: q.question_type,
          description: q.description.trim(),
          question_score: Number(q.question_score) || 0,
          correct_answer_indexes: q.question_type === 'MULTIPLE_CHOICE' ? [Number(q.correct_index)] : undefined,
          short_answer_key: q.question_type === 'SHORT_ANSWER' ? q.short_answer_key.trim() : undefined,
          coding_language: q.question_type === 'CODE' ? q.coding_language : undefined,
          s3_object_code: q.question_type === 'CODE' ? q.s3_object_code : undefined
        };

        const qRes = await api.post('/questions', qPayload);
        const newQuestionId = qRes.data.question_id;

        // Nếu là MULTIPLE_CHOICE, tạo các Lựa chọn (Options)
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
      }

      alert('Tạo bài Quiz và danh sách câu hỏi thành công!');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      alert(err.response?.data?.error || 'Không thể tạo quiz mới. Vui lòng thử lại.');
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
            <h2>Thêm Bài Quiz & Danh Sách Câu Hỏi</h2>
            {loadingDetails ? (
              <span className="subtitle-loading">Đang tải thông tin...</span>
            ) : (
              <span className="subtitle">
                {courseName} &gt; {chapterName || `Chương ${chapterId}`}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="add-content-form">
            {/* THÔNG TIN CHUNG CỦA QUIZ */}
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
                <label htmlFor="quiz-max-entry">Số lần làm tối đa (max_entry):</label>
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
                <label htmlFor="quiz-total-score">Tổng điểm bài thi (total_score):</label>
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

            {/* CẤU HÌNH TRỘN ĐỀ & BẢO MẬT ĐÁP ÁN */}
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

            {/* QUẢN LÝ CÂU HỎI THUỘC QUIZ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>
                Danh sách câu hỏi ({questions.length})
              </h3>
              <button
                type="button"
                className="submit-btn-modern"
                onClick={handleAddQuestionPrompt}
                style={{ padding: '8px 16px', fontSize: '14px', background: '#2b6cb0' }}
                disabled={loading}
              >
                + Thêm câu hỏi
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e0',
                  borderRadius: '8px',
                  padding: '16px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#008b44' }}>Câu {qIndex + 1}</strong>
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
                    <label>Loại câu hỏi (question_type):</label>
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
                    <label>Điểm câu hỏi (question_score):</label>
                    <input
                      type="number"
                      step="0.25"
                      value={q.question_score}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_score', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Nội dung câu hỏi (description):</label>
                  <textarea
                    rows="2"
                    value={q.description}
                    onChange={(e) => handleQuestionChange(qIndex, 'description', e.target.value)}
                    placeholder="Nhập nội dung đề bài câu hỏi..."
                    required
                  />
                </div>

                {/* 1. Nếu là Trắc nghiệm MULTIPLE_CHOICE */}
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

                {/* 2. Nếu là Tự luận ngắn SHORT_ANSWER */}
                {q.question_type === 'SHORT_ANSWER' && (
                  <div className="form-group-modern">
                    <label>Từ khóa đáp án chuẩn (short_answer_key):</label>
                    <input
                      type="text"
                      value={q.short_answer_key}
                      onChange={(e) => handleQuestionChange(qIndex, 'short_answer_key', e.target.value)}
                      placeholder="Ví dụ: 3.14 hoặc Hà Nội..."
                    />
                  </div>
                )}

                {/* 3. Nếu là Lập trình CODE */}
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
                      <label>Mã nguồn/Testcase mẫu (s3_object_code):</label>
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
                {loading ? 'Đang lưu bài Quiz & Câu hỏi...' : 'Hoàn tất & Lưu Quiz'}
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
    </div>
  );
}

export default AddQuiz;
