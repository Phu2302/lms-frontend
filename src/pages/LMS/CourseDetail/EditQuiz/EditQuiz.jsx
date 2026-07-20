import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import Header from '../../../../components/Header/Header';
import '../AddQuiz/AddQuiz.css';

function EditQuiz() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState('');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxEntry, setMaxEntry] = useState(1);
  const [totalScore, setTotalScore] = useState(10);
  const [openTime, setOpenTime] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [chapterId, setChapterId] = useState(null);

  // Cấu hình Nâng cao (Trộn đề & Bảo mật đáp án)
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswersMode, setShowAnswersMode] = useState('AFTER_DEADLINE');

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId, courseId]);

  const fetchQuizDetails = async () => {
    setLoadingDetails(true);
    try {
      // 1. Lấy thông tin quiz
      const quizRes = await api.get(`/quizzes/${quizId}`);
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
          if (!isNaN(d.getTime())) {
            setOpenTime(d.toISOString().slice(0, 16));
          }
        }
        if (quiz.deadline_time) {
          const d = new Date(quiz.deadline_time);
          if (!isNaN(d.getTime())) {
            setDeadlineTime(d.toISOString().slice(0, 16));
          }
        }
      }

      // 2. Lấy thông tin lớp học
      const classRes = await api.get(`/classes/view/${courseId}`);
      const cName = classRes.data?.class?.course_name || classRes.data?.class_name || `Lớp học ${courseId}`;
      setCourseName(cName);
    } catch (err) {
      console.error('Lỗi tải chi tiết Quiz:', err);
      alert('Không thể tải thông tin bài Quiz.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài Quiz!');
      return;
    }

    setLoading(true);
    try {
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

      alert('Đã cập nhật bài Quiz thành công!');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error updating quiz:', err);
      alert(err.response?.data?.error || 'Không thể cập nhật bài Quiz. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-content-page-container">
      <Header view="courses" />
      <div className="add-content-body" style={{ maxWidth: '700px' }}>
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

          <form onSubmit={handleSubmit} className="add-content-form">
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
        </div>
      </div>
    </div>
  );
}

export default EditQuiz;
