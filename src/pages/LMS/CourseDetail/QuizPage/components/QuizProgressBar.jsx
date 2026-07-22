import React from 'react';

function QuizProgressBar({ current, total, answeredCount }) {
  const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4a5568', marginBottom: '6px' }}>
        <span>Đã trả lời: <strong>{answeredCount} / {total} câu</strong></span>
        <span>{progressPercent}% hoàn thành</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3182ce, #008b44)',
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}

export default QuizProgressBar;
