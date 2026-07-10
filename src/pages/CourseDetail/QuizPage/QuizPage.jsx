import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuizPage.css";

function QuizPage() {
  const navigate = useNavigate();

  // Biến State mới: Kiểm soát trạng thái Đóng/Mở thanh bên (Mặc định ban đầu mở = true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Danh sách 7 câu hỏi ảo dữ liệu gốc
  const [questions] = useState([
    {
      id: 1,
      text: "Which of the following are NOT subjects of Software technical review?",
      options: [
        { key: "a", text: "a. Developer qualifications." },
        { key: "b", text: "b. All of the other answers." },
        { key: "c", text: "c. Use cases." },
        { key: "d", text: "d. Technical documentation." },
      ],
    },
    {
      id: 2,
      text: "What is the primary focus of Syntax Analysis in compiler design?",
      options: [
        { key: "a", text: "a. Type checking" },
        {
          key: "b",
          text: "b. Parsing token sequences into abstract syntax trees",
        },
        { key: "c", text: "c. Code optimization" },
        { key: "d", text: "d. Lexical scanning" },
      ],
    },
    {
      id: 3,
      text: "Which grammar formalisms are typically used for syntax analysis?",
      options: [
        { key: "a", text: "a. Regular Grammar" },
        { key: "b", text: "b. Context-Free Grammar" },
        { key: "c", text: "c. Context-Sensitive Grammar" },
        { key: "d", text: "d. Unrestricted Grammar" },
      ],
    },
    {
      id: 4,
      text: "A parser that builds the parse tree from the top down is called:",
      options: [
        { key: "a", text: "a. Bottom-up parser" },
        { key: "b", text: "b. Top-down parser" },
        { key: "c", text: "c. Shift-reduce parser" },
        { key: "d", text: "d. LR parser" },
      ],
    },
    {
      id: 5,
      text: "What is a conflict in an LR parser table?",
      options: [
        { key: "a", text: "a. Shift/Reduce conflict" },
        { key: "b", text: "b. Error conflict" },
        { key: "c", text: "c. Go-to conflict" },
        { key: "d", text: "d. Success conflict" },
      ],
    },
    {
      id: 6,
      text: "Which tool is widely used for generating parsers in Java/Python/C++?",
      options: [
        { key: "a", text: "a. Lex" },
        { key: "b", text: "b. ANTLR" },
        { key: "c", text: "c. GCC" },
        { key: "d", text: "d. Make" },
      ],
    },
    {
      id: 7,
      text: "Ambiguous grammars can lead to:",
      options: [
        { key: "a", text: "a. Infinite loops" },
        {
          key: "b",
          text: "b. Multiple distinct parse trees for the same input string",
        },
        { key: "c", text: "c. Faster compilation speeds" },
        { key: "d", text: "d. Lexical errors" },
      ],
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});

  const currentQuestion = questions[currentIndex];

  const handleOptionChange = (optionKey) => {
    setAnswers({
      ...answers,
      [currentIndex]: optionKey,
    });
  };

  const handleToggleFlag = () => {
    setFlags({
      ...flags,
      [currentIndex]: !flags[currentIndex],
    });
  };

  const handleSubmitQuiz = () => {
    const totalDone = Object.keys(answers).length;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn nộp bài? Bạn đã làm ${totalDone}/${questions.length} câu.`,
      )
    ) {
      alert("Nộp bài thi thành công!");
      navigate("/lms/course");
    }
  };

  return (
    <div className="quiz-container">
      {/* NAVBAR */}
      <nav className="lms-navbar">
        <div className="navbar-left">
          <div className="nav-logo">BHX</div>
          <button className="nav-item" onClick={() => navigate("/lms")}>
            Trang chủ
          </button>
          <button
            className="nav-item active"
            onClick={() => navigate("/lms/course")}
          >
            Các khóa học của tôi
          </button>
        </div>
        <div className="navbar-right">
          <div className="nav-avatar">SV</div>
        </div>
      </nav>

      {/* THÂN MÀN HÌNH LÀM BÀI */}
      <div className="quiz-body">
        {/* KHỐI TRÁI: KHU VỰC ĐỌC ĐỀ VÀ TRẢ LỜI CÂU HỎI */}
        <div className="quiz-left-content">
          <div className="quiz-course-header">
            Principles of Programming Languages (CO3005)_NGUYỄN HỨA PHÙNG
            (CLC_HK252) [CC04,CC05]
          </div>

          <div className="quiz-title-header-row">
            <div className="quiz-title-row">
              <span>❓ Syntax Quiz</span>
            </div>

            {/* Nếu thanh bên đang đóng (false) -> Hiện nút để người dùng bấm mở lại */}
            {!isSidebarOpen && (
              <button
                className="open-sidebar-btn"
                onClick={() => setIsSidebarOpen(true)}
              >
                📁 Xem bảng trạng thái câu hỏi
              </button>
            )}
          </div>

          <div className="quiz-tools-bar">
            <div className="btn-current-text">Câu {currentQuestion.id}</div>
            <button
              className={`btn-flag-toggle ${flags[currentIndex] ? "flagged" : ""}`}
              onClick={handleToggleFlag}
            >
              🚩 {flags[currentIndex] ? "Đã đánh dấu" : "Đánh dấu câu hỏi"}
            </button>
          </div>

          <div className="question-card-box">
            <div className="question-text">{currentQuestion.text}</div>

            <div className="options-list">
              {currentQuestion.options.map((opt) => (
                <label key={opt.key} className="option-item-label">
                  <input
                    type="radio"
                    name={`quiz-options-${currentQuestion.id}`}
                    checked={answers[currentIndex] === opt.key}
                    onChange={() => handleOptionChange(opt.key)}
                  />
                  {opt.text}
                </label>
              ))}
            </div>

            {/* BỔ SUNG: HÀNG NÚT ĐIỀU HƯỚNG SÁT GÓC PHẢI DƯỚI CÙNG HỘP CÂU HỎI */}
            <div className="quiz-navigation-buttons-row">
              <button
                className="nav-step-btn"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0} // Vô hiệu hóa nếu đang ở câu 1
              >
                ← Lùi lại
              </button>

              <button
                className="nav-step-btn"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1} // Vô hiệu hóa nếu đang ở câu cuối
              >
                Kế tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* KHỐI PHẢI: SIDEBAR TRẠNG THÁI (Chỉ hiển thị khi biến isSidebarOpen là true) */}
        {isSidebarOpen && (
          <div className="quiz-right-sidebar">
            {/* Nút đóng thanh bên hình dấu < đúng vị trí ảnh mẫu */}
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
                    <th key={q.id} onClick={() => setCurrentIndex(idx)}>
                      {q.id}
                      {flags[idx] && <span className="flag-indicator">🚩</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {questions.map((q, idx) => (
                    <td key={q.id} onClick={() => setCurrentIndex(idx)}>
                      <div
                        className={`status-circle ${answers[idx] ? "filled" : ""}`}
                      ></div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="submit-quiz-link" onClick={handleSubmitQuiz}>
              Nộp bài
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
