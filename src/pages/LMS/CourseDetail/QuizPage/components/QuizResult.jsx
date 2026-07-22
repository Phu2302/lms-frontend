import React from 'react';

function QuizResult({ result, quizTitle, onReturnToLanding }) {
  if (!result) return null;

  const percentage = result.max_score > 0
    ? Math.round((result.total_score / result.max_score) * 100)
    : 0;

  const formatScore = (score) => {
    if (score === null || score === undefined) return '0.00';
    const num = Number(score);
    return isNaN(num) ? score : num.toFixed(2);
  };

  return (
    <div className="quiz-body" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="quiz-result-card" style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid #008b44'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '✅' : '📝'}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#005a2b' }}>
          Nộp bài thành công!
        </h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          {quizTitle || 'Quiz'}
        </p>

        <div style={{
          background: percentage >= 80 ? '#e8f5e9' : percentage >= 60 ? '#fff3e0' : '#fce4ec',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '48px', fontWeight: '800', color: percentage >= 80 ? '#2e7d32' : percentage >= 60 ? '#e65100' : '#c62828' }}>
            {formatScore(result.total_score)} / {formatScore(result.max_score)}
          </div>
          <div style={{ fontSize: '16px', color: '#555', marginTop: '8px' }}>
            Đạt {percentage}% • {result.answers_count} câu đã trả lời
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onReturnToLanding}
            className="quiz-btn quiz-btn-primary"
          >
            Về trang lịch sử thi
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizResult;
