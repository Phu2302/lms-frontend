import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuizQuestionsAPI } from "../../../../api/LMS/CourseDetail/quizzes";
import { getMyQuizEntriesAPI, createQuizEntryAPI, submitQuizEntryAPI } from "../../../../api/LMS/CourseDetail/quizEntries";
import { getStudentQuestionResponsesAPI, submitBulkResponsesAPI } from "../../../../api/LMS/CourseDetail/studentQuestionResponses";
import Header from "../../../../components/Header/Header";
import "./QuizPage.css";

function QuizPage() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Quiz data state
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quiz taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [entryId, setEntryId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // New states for Landing page & Attempt history
  const [isStarted, setIsStarted] = useState(false);
  const [pastEntries, setPastEntries] = useState([]);
  const [selectedReviewEntry, setSelectedReviewEntry] = useState(null);
  const [reviewResponses, setReviewResponses] = useState([]);

  // Lấy thông tin user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Load quiz data và lịch sử khi mount
  useEffect(() => {
    if (quizId) {
      initQuiz();
    }
  }, [quizId]);

  const initQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Lấy quiz kèm câu hỏi và options
      const quizRes = await getQuizQuestionsAPI(quizId);
      const data = quizRes.data;
      setQuizData(data);
      setQuestions(data.questions || []);

      // 2. Tải lịch sử làm bài của sinh viên
      await fetchPastEntries();
    } catch (err) {
      console.error("Lỗi tải quiz:", err);
      const status = err.response?.status;
      if (status === 404) {
        setError("Không tìm thấy quiz này.");
      } else if (status === 403) {
        setError("Bạn không có quyền truy cập quiz này.");
      } else {
        setError("Không thể tải quiz. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPastEntries = async () => {
    try {
      const res = await getMyQuizEntriesAPI(quizId);
      setPastEntries(res.data || []);
    } catch (err) {
      console.error("Lỗi tải lịch sử thi:", err);
    }
  };

  const handleStartNewAttempt = async () => {
    try {
      setLoading(true);
      const entryRes = await createQuizEntryAPI({
        quiz_id: Number(quizId),
        time_limit: quizData?.time_limit || null,
      });
      setEntryId(entryRes.data.entry_id);
      setAnswers({});
      setFlags({});
      setCurrentIndex(0);
      setIsStarted(true);
    } catch (err) {
      console.error("Lỗi tạo quiz entry:", err);
      alert("Không thể bắt đầu làm bài: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResumeAttempt = async (entry) => {
    try {
      setLoading(true);
      setEntryId(entry.entry_id);

      // Tải lại tiến trình câu trả lời đã lưu
      const respRes = await getStudentQuestionResponsesAPI(entry.entry_id);
      const savedAnswers = {};
      (respRes.data || []).forEach(resp => {
        const questionIdx = questions.findIndex(q => Number(q.question_id) === Number(resp.question_id));
        if (questionIdx !== -1) {
          let ansVal = resp.student_answer;
          try {
            ansVal = JSON.parse(ansVal);
          } catch(e) {}
          // convert to number if it's a choice index, otherwise leave as string
          savedAnswers[questionIdx] = isNaN(ansVal) ? ansVal : Number(ansVal);
        }
      });
      setAnswers(savedAnswers);
      setFlags({});
      setCurrentIndex(0);
      setIsStarted(true);
    } catch (err) {
      console.error("Lỗi tiếp tục làm bài:", err);
      alert("Không thể tiếp tục làm bài: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAttempt = async (entry) => {
    try {
      setLoading(true);
      const respRes = await getStudentQuestionResponsesAPI(entry.entry_id);
      setReviewResponses(respRes.data || []);
      setSelectedReviewEntry(entry);
    } catch (err) {
      console.error("Lỗi tải chi tiết bài làm:", err);
      alert("Không thể xem lại bài làm: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAutosaveProgress = async (updatedAnswers) => {
    if (!entryId) return;
    try {
      const responses = questions.map((q, idx) => ({
        question_id: q.question_id,
        student_answer: updatedAnswers[idx] !== undefined ? updatedAnswers[idx] : null,
      })).filter(r => r.student_answer !== null);

      await submitBulkResponsesAPI({
        entry_id: entryId,
        responses
      });
    } catch (err) {
      console.error("Lỗi tự động lưu tiến trình:", err);
    }
  };

  const handleOptionChange = (optionIndex) => {
    const updatedAnswers = {
      ...answers,
      [currentIndex]: optionIndex,
    };
    setAnswers(updatedAnswers);
    handleAutosaveProgress(updatedAnswers);
  };

  const handleToggleFlag = () => {
    setFlags({
      ...flags,
      [currentIndex]: !flags[currentIndex],
    });
  };

  const handleBackToLanding = () => {
    if (window.confirm("Bạn đang làm bài, tiến trình làm bài đã được tự động lưu lại. Bạn có chắc chắn muốn thoát ra ngoài?")) {
      setIsStarted(false);
      fetchPastEntries();
    }
  };

  const handleBackToCourse = () => {
    if (quizData && quizData.class_id) {
      navigate(`/lms/course/${quizData.class_id}`);
    } else {
      navigate(-1);
    }
  };

  const handleCloseReview = () => {
    setSelectedReviewEntry(null);
    setReviewResponses([]);
  };

  const handleSubmitQuiz = async () => {
    if (!entryId) {
      alert("Không thể nộp bài: Quiz entry chưa được tạo.");
      return;
    }

    const totalDone = Object.keys(answers).length;
    if (!window.confirm(`Bạn có chắc chắn muốn nộp bài? Bạn đã làm ${totalDone}/${questions.length} câu.`)) {
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị danh sách câu trả lời
      const responses = questions.map((q, idx) => ({
        question_id: q.question_id,
        student_answer: answers[idx] !== undefined ? answers[idx] : null,
      })).filter(r => r.student_answer !== null);

      // Nộp bài
      const submitRes = await submitQuizEntryAPI(entryId, responses);
      setResult(submitRes.data);
    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      alert("Nộp bài thất bại: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không giới hạn";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return "—";
    const num = Number(score);
    return isNaN(num) ? score : num.toFixed(2);
  };

  const currentQuestion = questions[currentIndex];
  const unsubmittedEntry = pastEntries.find(e => e.entry_score === null);

  // 1. Hiển thị kết quả sau khi nộp
  if (result) {
    const percentage = result.max_score > 0
      ? Math.round((result.total_score / result.max_score) * 100)
      : 0;

    return (
      <div className="quiz-container">
        <Header view="courses" />

        <div className="quiz-body" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="quiz-result-card" style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: "480px",
            width: "100%",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            border: "1px solid #008b44"
          }}>
            <div style={{ fontSize: "72px", marginBottom: "16px" }}>
              {percentage >= 80 ? "🏆" : percentage >= 60 ? "✅" : "📝"}
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "#005a2b" }}>
              Nộp bài thành công!
            </h2>
            <p style={{ color: "#666", marginBottom: "32px" }}>
              {quizData?.title || "Quiz"}
            </p>

            <div style={{
              background: percentage >= 80 ? "#e8f5e9" : percentage >= 60 ? "#fff3e0" : "#fce4ec",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px"
            }}>
              <div style={{ fontSize: "48px", fontWeight: "800", color: percentage >= 80 ? "#2e7d32" : percentage >= 60 ? "#e65100" : "#c62828" }}>
                {formatScore(result.total_score)} / {formatScore(result.max_score)}
              </div>
              <div style={{ fontSize: "16px", color: "#555", marginTop: "8px" }}>
                Đạt {percentage}% • {result.answers_count} câu đã trả lời
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setResult(null);
                  setIsStarted(false);
                  initQuiz();
                }}
                className="quiz-btn quiz-btn-primary"
              >
                Về trang lịch sử thi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Hiển thị lỗi tải Quiz (Error Layer)
  if (error) {
    return (
      <div className="quiz-container">
        <Header view="courses" />
        <div className="quiz-body" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{
            textAlign: "center",
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            maxWidth: "400px",
            border: "1px solid #c62828",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h3 style={{ color: "#c62828", marginBottom: "12px" }}>Không thể tải quiz</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>{error}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => navigate(-1)} className="quiz-btn quiz-btn-secondary">
                ← Quay lại
              </button>
              <button onClick={initQuiz} className="quiz-btn quiz-btn-primary">
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Hiển thị trang Xem lại bài (Review Layer)
  if (selectedReviewEntry) {
    return (
      <div className="quiz-container">
        {/* NAVBAR */}
        <Header view="courses" />

        <div className="quiz-body" style={{ display: "block" }}>
          <div className="quiz-landing-container" style={{ maxWidth: "900px" }}>
            <div className="review-question-header">
              <div>
                <h2 style={{ color: "#005a2b", margin: 0 }}>Xem lại bài làm</h2>
                <div style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>
                  Lượt thi #{selectedReviewEntry.entry_id} • Bắt đầu: {formatDate(selectedReviewEntry.entry_start_time)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#008b44" }}>
                  Điểm: {formatScore(selectedReviewEntry.entry_score)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginTop: "20px" }}>
              {questions.map((q, idx) => {
                const response = reviewResponses.find(r => Number(r.question_id) === Number(q.question_id));
                const studentAnswer = response ? response.student_answer : null;
                const isCorrect = response ? Number(response.achieved_score) > 0 : false;

                // parse correct answer if available
                const correctIndexes = q.correct_answer_indexes
                  ? (Array.isArray(q.correct_answer_indexes) ? q.correct_answer_indexes : [q.correct_answer_indexes]).map(Number)
                  : [];

                return (
                  <div key={q.question_id || idx} className="question-card-box" style={{ borderLeft: isCorrect ? "6px solid #2e7d32" : "6px solid #c62828" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                      <span style={{ fontWeight: "bold", color: "#005a2b" }}>Câu hỏi {idx + 1}</span>
                      <span className={isCorrect ? "review-badge-correct" : "review-badge-incorrect"}>
                        {isCorrect ? "Đúng" : "Sai"} ({response?.achieved_score || 0}đ)
                      </span>
                    </div>

                    <div className="question-text" style={{ marginBottom: "15px" }}>
                      {q.description}
                    </div>

                    <div className="options-list">
                      {q.options && q.options.map((opt, optIdx) => {
                        const isStudentSelected = studentAnswer !== null && Number(studentAnswer) === optIdx;
                        const isCorrectOption = correctIndexes.includes(optIdx);

                        let optionClass = "option-item-label";
                        if (isStudentSelected) {
                          optionClass += isCorrectOption ? " correct" : " incorrect";
                        } else if (isCorrectOption) {
                          optionClass += " missed-correct";
                        }

                        return (
                          <div key={opt.option_id || optIdx} className={optionClass} style={{ pointerEvents: "none" }}>
                            <input
                              type="radio"
                              disabled
                              checked={isStudentSelected}
                            />
                            {String.fromCharCode(65 + optIdx)}. {opt.text_content}
                          </div>
                        );
                      })}

                      {(!q.options || q.options.length === 0) && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#666" }}>Câu trả lời của bạn:</div>
                          <div style={{
                            padding: "10px 15px",
                            background: "#f9f9f9",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            margin: "5px 0 10px 0",
                            fontStyle: "italic"
                          }}>
                            {studentAnswer || "(Trống)"}
                          </div>
                          {q.short_answer_key && (
                            <>
                              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#2e7d32" }}>Đáp án chính xác:</div>
                              <div style={{
                                padding: "10px 15px",
                                background: "#e8f5e9",
                                border: "1.5px dashed #81c784",
                                borderRadius: "6px",
                                margin: "5px 0",
                                fontWeight: "bold",
                                color: "#2e7d32"
                              }}>
                                {q.short_answer_key}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "30px", display: "flex", justifyContent: "center" }}>
              <button className="quiz-btn quiz-btn-secondary" onClick={handleCloseReview}>
                Quay lại trang thông tin quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Hiển thị màn hình Chi tiết Quiz & Lịch sử thi (Landing Layer)
  if (!isStarted) {
    const totalAttempts = pastEntries.length;
    const canAttempt = !unsubmittedEntry && (quizData?.max_entry === 0 || totalAttempts < (quizData?.max_entry || 99));

    return (
      <div className="quiz-container">
        {/* NAVBAR */}
        <Header view="courses" />

        {loading && (
          <div className="quiz-body" style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ textAlign: "center", color: "#666" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
              <p>Đang tải thông tin quiz...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="quiz-body" style={{ display: "block" }}>
            <div className="quiz-landing-container">
              <h2 className="quiz-landing-title">{quizData?.title || "Quiz"}</h2>
              
              <div className="quiz-info-grid">
                <div className="quiz-info-card">
                  <div className="quiz-info-label">Thời gian mở</div>
                  <div className="quiz-info-value">{formatDate(quizData?.open_time)}</div>
                </div>
                <div className="quiz-info-card">
                  <div className="quiz-info-label">Hạn nộp bài</div>
                  <div className="quiz-info-value">{formatDate(quizData?.deadline_time)}</div>
                </div>
                <div className="quiz-info-card">
                  <div className="quiz-info-label">Thời gian làm bài</div>
                  <div className="quiz-info-value">
                    {quizData?.time_limit ? `${quizData.time_limit} phút` : "Không giới hạn"}
                  </div>
                </div>
                <div className="quiz-info-card">
                  <div className="quiz-info-label">Số lần làm tối đa</div>
                  <div className="quiz-info-value">
                    {quizData?.max_entry ? `${quizData.max_entry} lần` : "Không giới hạn"}
                  </div>
                </div>
              </div>

              {/* Bảng lịch sử các lượt làm bài */}
              <div className="quiz-history-section">
                <h3>Lịch sử thi của bạn</h3>
                {pastEntries.length === 0 ? (
                  <p style={{ color: "#777", fontStyle: "italic" }}>Bạn chưa thực hiện lượt làm bài nào.</p>
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
                            {entry.entry_score !== null ? (
                              <span className="badge-score-submitted">{formatScore(entry.entry_score)}</span>
                            ) : (
                              <span className="badge-score-pending">Đang làm dở</span>
                            )}
                          </td>
                          <td>
                            {entry.entry_score !== null ? (
                              <button className="quiz-btn-action" onClick={() => handleReviewAttempt(entry)}>
                                Xem lại bài làm
                              </button>
                            ) : (
                              <button className="quiz-btn-action" style={{ background: "#e8f5e9", color: "#2e7d32" }} onClick={() => handleResumeAttempt(entry)}>
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

              {/* Nút thao tác chính */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-start", marginTop: "20px" }}>
                <button className="quiz-btn quiz-btn-secondary" onClick={handleBackToCourse}>
                  ← Quay lại lớp học
                </button>

                {unsubmittedEntry ? (
                  <button className="quiz-btn quiz-btn-primary" onClick={() => handleResumeAttempt(unsubmittedEntry)}>
                    Tiếp tục làm bài (Lượt đang mở)
                  </button>
                ) : canAttempt ? (
                  <button className="quiz-btn quiz-btn-primary" onClick={handleStartNewAttempt}>
                    🚀 Bắt đầu làm bài mới
                  </button>
                ) : (
                  <button className="quiz-btn quiz-btn-primary" disabled>
                    ❌ Đã dùng hết lượt thi
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. Hiển thị Màn hình làm bài (Active Quiz View)
  return (
    <div className="quiz-container">
      {/* NAVBAR */}
      <Header view="courses" />

      {/* Quiz content */}
      {!loading && !error && currentQuestion && (
        <div className="quiz-body">
          {/* KHỐI TRÁI: KHU VỰC ĐỌC ĐỀ VÀ TRẢ LỜI CÂU HỎI */}
          <div className="quiz-left-content">
            <div className="quiz-course-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {quizData?.title || "Quiz"}
                {entryId && <span style={{ marginLeft: "12px", fontSize: "12px", color: "#aaa" }}>Lượt thi #{entryId}</span>}
              </div>
              <button 
                className="quiz-btn quiz-btn-secondary" 
                style={{ padding: "6px 12px", fontSize: "13px" }}
                onClick={handleBackToLanding}
              >
                ← Quay lại (Tự động lưu)
              </button>
            </div>

            <div className="quiz-title-header-row">
              <div className="quiz-title-row">
                <span>❓ {quizData?.title || "Quiz"}</span>
              </div>

              {!isSidebarOpen && (
                <button className="open-sidebar-btn" onClick={() => setIsSidebarOpen(true)}>
                  📁 Xem bảng trạng thái câu hỏi
                </button>
              )}
            </div>

            <div className="quiz-tools-bar">
              <div className="btn-current-text">
                Câu {currentIndex + 1} / {questions.length}
              </div>
              <button
                className={`btn-flag-toggle ${flags[currentIndex] ? "flagged" : ""}`}
                onClick={handleToggleFlag}
              >
                🚩 {flags[currentIndex] ? "Đã đánh dấu" : "Đánh dấu câu hỏi"}
              </button>
            </div>

            <div className="question-card-box">
              {/* Mô tả câu hỏi */}
              <div className="question-text">
                {currentQuestion.description}
              </div>

              {/* Danh sách options */}
              <div className="options-list">
                {(currentQuestion.options || []).map((opt, optIdx) => (
                  <label key={opt.option_id || optIdx} className="option-item-label">
                    <input
                      type="radio"
                      name={`quiz-options-${currentQuestion.question_id}`}
                      checked={answers[currentIndex] === optIdx}
                      onChange={() => handleOptionChange(optIdx)}
                    />
                    {String.fromCharCode(65 + optIdx)}. {opt.text_content}
                  </label>
                ))}

                {/* Nếu không có options (short_answer, coding) */}
                {(!currentQuestion.options || currentQuestion.options.length === 0) && (
                  <div style={{ marginTop: "16px" }}>
                    <textarea
                      className="short-answer-input"
                      placeholder="Nhập câu trả lời của bạn..."
                      value={answers[currentIndex] || ""}
                      onChange={(e) => {
                        const updatedAnswers = { ...answers, [currentIndex]: e.target.value };
                        setAnswers(updatedAnswers);
                      }}
                      onBlur={() => handleAutosaveProgress(answers)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "14px",
                        resize: "vertical"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Nút điều hướng */}
              <div className="quiz-navigation-buttons-row">
                <button
                  className="nav-step-btn"
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  ← Lùi lại
                </button>
                <button
                  className="nav-step-btn"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                >
                  Kế tiếp →
                </button>
              </div>
            </div>
          </div>

          {/* KHỐI PHẢI: SIDEBAR TRẠNG THÁI */}
          {isSidebarOpen && (
            <div className="quiz-right-sidebar">
              <button
                className="sidebar-collapse-btn"
                onClick={() => setIsSidebarOpen(false)}
              >
                &lt;
              </button>

              <table className="matrix-table">
                <thead>
                  <tr>
                    {questions.map((q, idx) => (
                      <th
                        key={q.question_id || idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{ cursor: "pointer" }}
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
                      <td key={q.question_id || idx} onClick={() => setCurrentIndex(idx)} style={{ cursor: "pointer" }}>
                        <div className={`status-circle ${answers[idx] !== undefined ? "filled" : ""}`}></div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div
                className="submit-quiz-link"
                onClick={!submitting ? handleSubmitQuiz : undefined}
                style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Đang nộp bài..." : "Nộp bài"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuizPage;
