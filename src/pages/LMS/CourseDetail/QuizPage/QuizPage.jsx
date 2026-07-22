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
import { useToast } from "../../../../components/Toast/ToastContext";
import { useAuth } from "../../../../contexts/AuthContext";

import QuizLanding from "./components/QuizLanding";
import QuizActive from "./components/QuizActive";
import QuizResult from "./components/QuizResult";
import QuizReview from "./components/QuizReview";
import "./QuizPage.css";

function QuizPage() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { showToast } = useToast();

  // 5.1 Use useAuth() instead of reading localStorage directly
  const { user } = useAuth();
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = currentUser?.role ? String(currentUser.role) : "1";
  const isTeacher = userRole === "2" || userRole === "3";

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
  const [allEntries, setAllEntries] = useState([]);
  const [selectedReviewEntry, setSelectedReviewEntry] = useState(null);
  const [reviewResponses, setReviewResponses] = useState([]);

  // Manual grading state
  const [manualScores, setManualScores] = useState({});
  const [savingManualScore, setSavingManualScore] = useState(false);

  // Load quiz data and history on mount
  useEffect(() => {
    if (quizId) {
      initQuiz();
    }
  }, [quizId]);

  // COUNTDOWN TIMER EFFECT
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
            showToast("⌛ Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài làm của bạn.", "info");
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
      showToast(`Đã xóa lượt thi #${entryIdToDelete} thành công!`, 'success');
      fetchAllEntries();
      fetchPastEntries();
    } catch (err) {
      console.error("Lỗi xóa lượt thi:", err);
      showToast("Xóa lượt thi thất bại: " + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = isTeacher ? allEntries : pastEntries;
    if (dataToExport.length === 0) {
      showToast("Chưa có dữ liệu lượt thi nào để xuất file!", 'error');
      return;
    }

    let csvContent = "\uFEFFLuot_Thi_ID,MSSV,Thoi_Gian_Bat_Dau,Diem_So,Trang_Thai\n";
    dataToExport.forEach(e => {
      const scoreStr = e.entry_score !== null && e.entry_score !== undefined ? Number(e.entry_score).toFixed(2) : "Dang lam do";
      const status = e.entry_score !== null && e.entry_score !== undefined ? (Number(e.entry_score) >= 5 ? "Dat" : "Chua dat") : "Chua nop";
      csvContent += `${e.entry_id},${e.student_id || currentUser.user_id},"${new Date(e.entry_start_time).toLocaleString('vi-VN')}",${scoreStr},${status}\n`;
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
      showToast(`Đã cập nhật điểm cho câu hỏi! Điểm mới của bài làm: ${res.data.new_entry_score}`, 'success');
      
      setSelectedReviewEntry(prev => ({
        ...prev,
        entry_score: res.data.new_entry_score
      }));

      const respRes = await getStudentQuestionResponsesAPI(selectedReviewEntry.entry_id);
      setReviewResponses(respRes.data || []);
      if (isTeacher) fetchAllEntries();
    } catch (err) {
      console.error("Lỗi chấm điểm thủ công:", err);
      showToast("Không thể lưu điểm: " + (err.response?.data?.error || err.message), 'error');
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

      if (quizData?.shuffle_questions !== false) {
        setQuestions(shuffleQuestionsAndOptions(quizData?.questions || []));
      }

      setAnswers({});
      setFlags({});
      setCurrentIndex(0);
      setIsStarted(true);
    } catch (err) {
      console.error("Lỗi tạo quiz entry:", err);
      showToast("Không thể bắt đầu làm bài: " + (err.response?.data?.error || err.message), 'error');
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
          savedAnswers[questionIdx] = ansVal;
        }
      });
      setAnswers(savedAnswers);
      setFlags({});
      setCurrentIndex(0);
      setIsStarted(true);
    } catch (err) {
      console.error("Lỗi tiếp tục làm bài:", err);
      showToast("Không thể tiếp tục làm bài: " + (err.response?.data?.error || err.message), 'error');
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
      showToast("Không thể xem lại bài làm: " + (err.response?.data?.error || err.message), 'error');
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

  const handleMultiSelectOptionChange = (optionIndex) => {
    const currentList = Array.isArray(answers[currentIndex]) ? answers[currentIndex] : (answers[currentIndex] ? [answers[currentIndex]] : []);
    let newList = [];
    if (currentList.includes(optionIndex)) {
      newList = currentList.filter(i => i !== optionIndex);
    } else {
      newList = [...currentList, optionIndex].sort((a, b) => a - b);
    }
    const updatedAnswers = {
      ...answers,
      [currentIndex]: newList,
    };
    setAnswers(updatedAnswers);
    handleAutosaveProgress(updatedAnswers);
  };

  const handleTextAnswerChange = (val) => {
    const updatedAnswers = {
      ...answers,
      [currentIndex]: val,
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
      showToast("Không thể nộp bài: Quiz entry chưa được tạo.", 'error');
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
      showToast("Nộp bài thi thành công!", "success");
    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      showToast("Nộp bài thất bại: " + (err.response?.data?.error || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showAnswersMode = quizData?.show_answers_mode || 'AFTER_DEADLINE';
  const isDeadlinePassed = !quizData?.deadline_time || new Date() >= new Date(quizData.deadline_time);
  const canSeeCorrectAnswers = isTeacher || showAnswersMode === 'ALWAYS' || (showAnswersMode === 'AFTER_DEADLINE' && isDeadlinePassed);

  return (
    <div className="quiz-container">
      <Header view="courses" />

      {/* 1. HIỂN THỊ KẾT QUẢ SAU KHI NỘP (Result View) */}
      {result ? (
        <QuizResult
          result={result}
          quizTitle={quizData?.title}
          onReturnToLanding={() => {
            setResult(null);
            setIsStarted(false);
            initQuiz();
          }}
        />
      ) : error ? (
        /* 2. ERROR LAYER */
        <div className="quiz-body" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center", background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "400px", border: "1px solid #c62828" }}>
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
      ) : selectedReviewEntry ? (
        /* 3. REVIEW LAYER */
        <QuizReview
          quizData={quizData}
          questions={questions}
          selectedReviewEntry={selectedReviewEntry}
          reviewResponses={reviewResponses}
          currentUser={currentUser}
          isTeacher={isTeacher}
          canSeeCorrectAnswers={canSeeCorrectAnswers}
          showAnswersMode={showAnswersMode}
          manualScores={manualScores}
          savingManualScore={savingManualScore}
          onManualScoreChange={(respId, val) => setManualScores({ ...manualScores, [respId]: val })}
          onManualGrade={handleManualGrade}
          onCloseReview={handleCloseReview}
        />
      ) : !isStarted ? (
        /* 4. LANDING LAYER */
        <QuizLanding
          quizData={quizData}
          pastEntries={pastEntries}
          allEntries={allEntries}
          isTeacher={isTeacher}
          currentUser={currentUser}
          onStartAttempt={handleStartNewAttempt}
          onResumeAttempt={handleResumeAttempt}
          onReviewAttempt={handleReviewAttempt}
          onDeleteEntry={handleDeleteEntry}
          onExportCSV={handleExportCSV}
          onBackToCourse={handleBackToCourse}
          onRefreshEntries={fetchAllEntries}
        />
      ) : (
        /* 5. ACTIVE QUIZ VIEW */
        <QuizActive
          quizData={quizData}
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          flags={flags}
          entryId={entryId}
          remainingSeconds={remainingSeconds}
          submitting={submitting}
          isSidebarOpen={isSidebarOpen}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          onOptionChange={handleOptionChange}
          onMultiSelectOptionChange={handleMultiSelectOptionChange}
          onTextAnswerChange={handleTextAnswerChange}
          onToggleFlag={handleToggleFlag}
          onToggleSidebar={(val) => setIsSidebarOpen(val)}
          onPrevQuestion={() => setCurrentIndex(currentIndex - 1)}
          onNextQuestion={() => setCurrentIndex(currentIndex + 1)}
          onSubmitQuiz={handleSubmitQuiz}
          onBackToLanding={handleBackToLanding}
        />
      )}
    </div>
  );
}

export default QuizPage;
