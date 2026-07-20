import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuizQuestionsAPI } from "../../../../api/LMS/CourseDetail/quizzes";
import { 
  getMyQuizEntriesAPI, 
  getAllQuizEntriesAPI, 
  createQuizEntryAPI, 
  submitQuizEntryAPI, 
  deleteQuizEntryAPI,
  gradeQuestionResponseAPI 
} from "../../../../api/LMS/CourseDetail/quizEntries";
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
  const [currentEntryObj, setCurrentEntryObj] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const autoSubmittedRef = useRef(false);

  // States for Landing page & Attempt history
  const [isStarted, setIsStarted] = useState(false);
  const [pastEntries, setPastEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // Dành cho Giảng viên xem tất cả lượt làm
  const [selectedReviewEntry, setSelectedReviewEntry] = useState(null);
  const [reviewResponses, setReviewResponses] = useState([]);

  // Manual grading state
  const [manualScores, setManualScores] = useState({});
  const [savingManualScore, setSavingManualScore] = useState(false);

  // Lấy thông tin user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = currentUser?.role ? String(currentUser.role) : "1";
  const isTeacher = userRole === "2" || userRole === "3";

  // Load quiz data và lịch sử khi mount
  useEffect(() => {
    if (quizId) {
      initQuiz();
    }
  }, [quizId]);

  // ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN LÀM BÀI
  useEffect(() => {
    let timerId = null;

    if (isStarted && currentEntryObj && quizData) {
      const timeLimitMinutes = Number(currentEntryObj.time_limit || quizData.time_limit || 30);
      const startTimeMs = new Date(currentEntryObj.entry_start_time || Date.now()).getTime();
      const endTimeMs = startTimeMs + timeLimitMinutes * 60 * 1000;

      const updateRemaining = () => {
        const now = Date.now();
        const diffSec = Math.floor((endTimeMs - now) / 1000);

        if (diffSec <= 0) {
          setRemainingSeconds(0);
          if (!autoSubmittedRef.current && !submitting) {
            autoSubmittedRef.current = true;
            alert("⌛ Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài làm của bạn.");
            handleAutoSubmitOnTimeOut();
          }
        } else {
          setRemainingSeconds(diffSec);
        }
      };

      updateRemaining();
      timerId = setInterval(updateRemaining, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isStarted, currentEntryObj, quizData]);

  const initQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const quizRes = await getQuizQuestionsAPI(quizId);
      const data = quizRes.data;
      setQuizData(data);
      setQuestions(data.questions || []);

      await fetchPastEntries();

      if (isTeacher) {
        await fetchAllEntries();
      }
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
      console.error("Lỗi tải lịch sử thi cá nhân:", err);
    }
  };

  const fetchAllEntries = async () => {
    try {
      const res = await getAllQuizEntriesAPI(quizId);
      setAllEntries(res.data || []);
    } catch (err) {
      console.error("Lỗi tải tất cả lượt thi cho giảng viên:", err);
    }
  };

  const shuffleQuestionsAndOptions = (qList) => {
    if (!qList || qList.length === 0) return [];
    // Fisher-Yates Shuffle
    const shuffledQ = [...qList].sort(() => Math.random() - 0.5);
    return shuffledQ.map(q => {
      if (q.options && q.options.length > 0) {
        return {
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        };
      }
      return q;
    });
  };

  const handleDeleteEntry = async (entryIdToDelete) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lượt thi #${entryIdToDelete}? Hành động này sẽ hủy kết quả thi này và cho phép sinh viên đăng nhập làm lại.`)) {
      return;
    }
    try {
      await deleteQuizEntryAPI(entryIdToDelete);
      alert(`Đã xóa lượt thi #${entryIdToDelete} thành công! Sinh viên có thể làm lại bài thi.`);
      fetchAllEntries();
      fetchPastEntries();
    } catch (err) {
      console.error("Lỗi xóa lượt thi:", err);
      alert("Xóa lượt thi thất bại: " + (err.response?.data?.error || err.message));
    }
  };

  const handleExportCSV = () => {
    const dataToExport = isTeacher ? allEntries : pastEntries;
    if (dataToExport.length === 0) {
      alert("Chưa có dữ liệu lượt thi nào để xuất file!");
      return;
    }

    let csvContent = "\uFEFFLuot_Thi_ID,MSSV,Thoi_Gian_Bat_Dau,Diem_So,Trang_Thai\n";
    dataToExport.forEach(e => {
      const scoreStr = e.entry_score !== null && e.entry_score !== undefined ? Number(e.entry_score).toFixed(2) : "Dang lam do";
      const status = e.entry_score !== null && e.entry_score !== undefined ? (Number(e.entry_score) >= 5 ? "Dat" : "Chua dat") : "Chua nop";
      csvContent += `${e.entry_id},${e.student_id || currentUser.user_id},"${formatDate(e.entry_start_time)}",${scoreStr},${status}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_Diem_Quiz_${quizId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualGrade = async (responseId, questionId, scoreVal) => {
    if (scoreVal === "" || isNaN(Number(scoreVal))) return;
    setSavingManualScore(true);
    try {
      const res = await gradeQuestionResponseAPI(responseId, Number(scoreVal));
      alert(`Đã cập nhật điểm cho câu hỏi! Điểm mới của bài làm: ${res.data.new_entry_score}`);
      
      setSelectedReviewEntry(prev => ({
        ...prev,
        entry_score: res.data.new_entry_score
      }));

      const respRes = await getStudentQuestionResponsesAPI(selectedReviewEntry.entry_id);
      setReviewResponses(respRes.data || []);
      if (isTeacher) fetchAllEntries();
    } catch (err) {
      console.error("Lỗi chấm điểm thủ công:", err);
      alert("Không thể lưu điểm: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingManualScore(false);
    }
  };

  const handleStartNewAttempt = async () => {
    try {
      setLoading(true);
      autoSubmittedRef.current = false;
      const entryRes = await createQuizEntryAPI({
        quiz_id: Number(quizId),
        time_limit: quizData?.time_limit || 30,
      });
      const newEntryId = entryRes.data.entry_id;
      setEntryId(newEntryId);
      setCurrentEntryObj({
        entry_id: newEntryId,
        entry_start_time: new Date().toISOString(),
        time_limit: quizData?.time_limit || 30
      });

      // Kiểm tra cấu hình trộn đề ngẫu nhiên (shuffle_questions)
      if (quizData?.shuffle_questions !== false) {
        setQuestions(shuffleQuestionsAndOptions(quizData?.questions || []));
      }

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
      autoSubmittedRef.current = false;
      setEntryId(entry.entry_id);
      setCurrentEntryObj(entry);

      const respRes = await getStudentQuestionResponsesAPI(entry.entry_id);
      const savedAnswers = {};
      (respRes.data || []).forEach(resp => {
        const questionIdx = questions.findIndex(q => Number(q.question_id) === Number(resp.question_id));
        if (questionIdx !== -1) {
          let ansVal = resp.student_answer;
          try {
            ansVal = JSON.parse(ansVal);
          } catch(e) {}
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
      const resps = respRes.data || [];
      setReviewResponses(resps);

      const initialManualScores = {};
      resps.forEach(r => {
        initialManualScores[r.response_id] = r.achieved_score ?? 0;
      });
      setManualScores(initialManualScores);

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
      if (isTeacher) fetchAllEntries();
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

  const handleAutoSubmitOnTimeOut = async () => {
    if (!entryId) return;
    setSubmitting(true);
    try {
      const responses = questions.map((q, idx) => ({
        question_id: q.question_id,
        student_answer: answers[idx] !== undefined ? answers[idx] : null,
      })).filter(r => r.student_answer !== null);

      const submitRes = await submitQuizEntryAPI(entryId, responses);
      setResult(submitRes.data);
    } catch (err) {
      console.error("Lỗi tự động nộp bài khi hết giờ:", err);
    } finally {
      setSubmitting(false);
    }
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
      const responses = questions.map((q, idx) => ({
        question_id: q.question_id,
        student_answer: answers[idx] !== undefined ? answers[idx] : null,
      })).filter(r => r.student_answer !== null);

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

  const formatTimerString = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  const analytics = computeAnalytics();
  const currentQuestion = questions[currentIndex];
  const unsubmittedEntry = pastEntries.find(e => e.entry_score === null);

  // Kiểm tra quyền xem đáp án chuẩn của Sinh viên
  const showAnswersMode = quizData?.show_answers_mode || 'AFTER_DEADLINE';
  const isDeadlinePassed = !quizData?.deadline_time || new Date() >= new Date(quizData.deadline_time);
  const canSeeCorrectAnswers = isTeacher || showAnswersMode === 'ALWAYS' || (showAnswersMode === 'AFTER_DEADLINE' && isDeadlinePassed);

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
        <Header view="courses" />

        <div className="quiz-body" style={{ display: "block" }}>
          <div className="quiz-landing-container" style={{ maxWidth: "900px" }}>
            <div className="review-question-header">
              <div>
                <h2 style={{ color: "#005a2b", margin: 0 }}>Xem lại bài làm</h2>
                <div style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>
                  Lượt thi #{selectedReviewEntry.entry_id} • Sinh viên MSSV: <strong>{selectedReviewEntry.student_id || currentUser.user_id}</strong> • Bắt đầu: {formatDate(selectedReviewEntry.entry_start_time)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#008b44" }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginTop: "20px" }}>
              {questions.map((q, idx) => {
                const response = reviewResponses.find(r => Number(r.question_id) === Number(q.question_id));
                const studentAnswer = response ? response.student_answer : null;
                const isCorrect = response ? Number(response.achieved_score) > 0 : false;

                const correctIndexes = canSeeCorrectAnswers && q.correct_answer_indexes
                  ? (Array.isArray(q.correct_answer_indexes) ? q.correct_answer_indexes : [q.correct_answer_indexes]).map(Number)
                  : [];

                const isEssayOrCode = !q.options || q.options.length === 0;

                return (
                  <div key={q.question_id || idx} className="question-card-box" style={{ borderLeft: isCorrect ? "6px solid #2e7d32" : "6px solid #c62828" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                      <span style={{ fontWeight: "bold", color: "#005a2b" }}>Câu hỏi {idx + 1} ({q.question_score || 1}đ)</span>
                      <span className={isCorrect ? "review-badge-correct" : "review-badge-incorrect"}>
                        {isCorrect ? "Đúng" : "Chưa đạt"} ({response?.achieved_score || 0}đ)
                      </span>
                    </div>

                    <div className="question-text" style={{ marginBottom: "15px" }}>
                      {q.description}
                    </div>

                    <div className="options-list">
                      {q.options && q.options.map((opt, optIdx) => {
                        const isStudentSelected = studentAnswer !== null && Number(studentAnswer) === optIdx;
                        const isCorrectOption = canSeeCorrectAnswers && correctIndexes.includes(optIdx);

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

                      {isEssayOrCode && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#666" }}>Câu trả lời của sinh viên:</div>
                          <div style={{
                            padding: "10px 15px",
                            background: "#f9f9f9",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            margin: "5px 0 10px 0",
                            fontStyle: "italic",
                            whiteSpace: "pre-wrap"
                          }}>
                            {studentAnswer || "(Trống)"}
                          </div>

                          {canSeeCorrectAnswers && q.short_answer_key && (
                            <>
                              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#2e7d32" }}>Đáp án gợi ý:</div>
                              <div style={{
                                padding: "10px 15px",
                                background: "#e8f5e9",
                                border: "1.5px dashed #81c784",
                                borderRadius: "6px",
                                margin: "5px 0 10px 0",
                                fontWeight: "bold",
                                color: "#2e7d32"
                              }}>
                                {q.short_answer_key}
                              </div>
                            </>
                          )}

                          {/* KHUNG GIẢNG VIÊN CHẤM ĐIỂM THỦ CÔNG CHO CÂU TỰ LUẬN */}
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
                                onChange={(e) => setManualScores({ ...manualScores, [response.response_id]: e.target.value })}
                              />
                              <button 
                                onClick={() => handleManualGrade(response.response_id, q.question_id, manualScores[response.response_id])}
                                disabled={savingManualScore}
                                style={{ background: '#008b44', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                              >
                                {savingManualScore ? 'Đang lưu...' : '💾 Lưu điểm'}
                              </button>
                            </div>
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
                Quay lại trang quản lý quiz
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="quiz-landing-title" style={{ margin: 0 }}>{quizData?.title || "Quiz"}</h2>
                <button 
                  onClick={handleExportCSV} 
                  style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📥 Xuất báo cáo CSV
                </button>
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
                    {quizData?.time_limit ? `${quizData.time_limit} phút` : "30 phút"}
                  </div>
                </div>
                <div className="quiz-info-card">
                  <div className="quiz-info-label">Số lần làm tối đa</div>
                  <div className="quiz-info-value">
                    {quizData?.max_entry ? `${quizData.max_entry} lần` : "Không giới hạn"}
                  </div>
                </div>
              </div>

              {/* BẢNG THỐNG KÊ PHỔ ĐIỂM (DÀNH CHO GIẢNG VIÊN) */}
              {isTeacher && (
                <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
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
                </div>
              )}

              {/* BẢNG QUẢN LÝ DÀNH CHO GIẢNG VIÊN (Nếu userRole == '2' hoặc '3') */}
              {isTeacher && (
                <div className="quiz-history-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#008b44' }}>🛡️ Quản lý tất cả lượt thi của Sinh viên (Dành cho Giảng viên)</h3>
                    <button onClick={fetchAllEntries} style={{ background: '#edf2f7', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                      🔄 Tải lại danh sách
                    </button>
                  </div>
                  {allEntries.length === 0 ? (
                    <p style={{ color: "#777", fontStyle: "italic" }}>Chưa có sinh viên nào thực hiện bài quiz này.</p>
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
                                <button className="quiz-btn-action" onClick={() => handleReviewAttempt(entry)}>
                                  👁️ Xem bài & Chấm
                                </button>
                                <button 
                                  className="quiz-btn-action" 
                                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                  onClick={() => handleDeleteEntry(entry.entry_id)}
                                >
                                  🗑️ Xóa lượt này (Cho làm lại)
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

              {/* Bảng lịch sử các lượt làm bài CÁ NHÂN */}
              <div className="quiz-history-section">
                <h3>Lịch sử thi cá nhân của bạn</h3>
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
                            {entry.entry_score !== null && entry.entry_score !== undefined ? (
                              <span className="badge-score-submitted">{formatScore(entry.entry_score)}</span>
                            ) : (
                              <span className="badge-score-pending">Đang làm dở</span>
                            )}
                          </td>
                          <td>
                            {entry.entry_score !== null && entry.entry_score !== undefined ? (
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
                    🚀 Bắt đầu làm bài mới ({quizData?.time_limit || 30} phút)
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
  const isTimeWarning = remainingSeconds !== null && remainingSeconds <= 300;
  const isTimeUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="quiz-container">
      <Header view="courses" />

      {/* Quiz content */}
      {!loading && !error && currentQuestion && (
        <div className="quiz-body">
          {/* KHỐI TRÁI: KHU VỰC ĐỌC ĐỀ VÀ TRẢ LỜI CÂU HỎI */}
          <div className="quiz-left-content">
            {/* STICKY COUNTDOWN TIMER BANNER */}
            <div style={{
              background: isTimeUrgent ? '#fff5f5' : isTimeWarning ? '#fffaf0' : '#f0fff4',
              border: `1.5px solid ${isTimeUrgent ? '#feb2b2' : isTimeWarning ? '#fbd38d' : '#9ae6b4'}`,
              borderRadius: '10px',
              padding: '12px 20px',
              marginBottom: '20px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{isTimeUrgent ? '⚠️' : '⏱️'}</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: isTimeUrgent ? '#c53030' : isTimeWarning ? '#c05621' : '#22543d' }}>
                  {isTimeUrgent ? 'Sắp hết giờ!' : 'Thời gian làm bài còn lại:'}
                </span>
              </div>

              <div style={{
                fontSize: '24px',
                fontWeight: '900',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                color: isTimeUrgent ? '#e53e3e' : isTimeWarning ? '#dd6b20' : '#2b6cb0',
                padding: '4px 14px',
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #cbd5e0'
              }}>
                {formatTimerString(remainingSeconds)}
              </div>
            </div>

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
