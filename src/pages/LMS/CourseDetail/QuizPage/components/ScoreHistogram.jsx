import React from 'react';

function ScoreHistogram({ entries = [] }) {
  const validScores = entries
    .filter(e => e.entry_score !== null && e.entry_score !== undefined)
    .map(e => Number(e.entry_score));

  // Score buckets: 0-2, 2-4, 4-6, 6-8, 8-10
  const buckets = [
    { label: '0.0 - 2.0', count: 0, color: '#e53e3e' },
    { label: '2.0 - 4.0', count: 0, color: '#dd6b20' },
    { label: '4.0 - 6.0', count: 0, color: '#d69e2e' },
    { label: '6.0 - 8.0', count: 0, color: '#3182ce' },
    { label: '8.0 - 10.0', count: 0, color: '#38a169' }
  ];

  validScores.forEach(score => {
    if (score < 2) buckets[0].count++;
    else if (score < 4) buckets[1].count++;
    else if (score < 6) buckets[2].count++;
    else if (score < 8) buckets[3].count++;
    else buckets[4].count++;
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
      <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#2b6cb0' }}>📊 Biểu đồ phân bố điểm số (Score Distribution)</h4>
      
      {validScores.length === 0 ? (
        <p style={{ color: '#a0aec0', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>Chưa có dữ liệu bài nộp để vẽ biểu đồ.</p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', paddingTop: '20px', borderBottom: '1px solid #cbd5e0' }}>
          {buckets.map((b, idx) => {
            const heightPercent = Math.round((b.count / maxCount) * 100);
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: b.color, marginBottom: '4px' }}>
                  {b.count} SV
                </span>
                <div
                  style={{
                    width: '80%',
                    height: `${Math.max(heightPercent, 4)}%`,
                    backgroundColor: b.color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease'
                  }}
                  title={`${b.label}: ${b.count} bài thi`}
                />
                <span style={{ fontSize: '11px', color: '#718096', marginTop: '6px' }}>{b.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScoreHistogram;
