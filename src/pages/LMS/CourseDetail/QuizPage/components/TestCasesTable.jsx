import React from 'react';
import './TestCasesTable.css';

function TestCasesTable({ testResults = [], canSeeExpected = true }) {
  if (!testResults || testResults.length === 0) return null;

  const total = testResults.length;
  const passedCount = testResults.filter(tc => tc.passed).length;
  const allPassed = passedCount === total;
  const passRatePercent = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  return (
    <div className={`testcases-table-wrapper ${allPassed ? 'all-passed-bg' : 'has-failed-bg'}`}>
      <table className="testcases-custom-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}></th>
            <th style={{ width: '90px' }}>Test</th>
            <th style={{ width: '120px' }}>Input</th>
            {canSeeExpected && <th>Expected</th>}
            <th>Output</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((tc, idx) => {
            const isPassed = tc.passed;
            const inputVal = tc.input !== undefined && tc.input !== null ? String(tc.input).trim() : '—';
            const expectedVal = tc.expected_output !== undefined && tc.expected_output !== null ? String(tc.expected_output).trim() : '—';
            const studentOutputVal = tc.stdout !== undefined && tc.stdout !== null && String(tc.stdout).trim() !== '' ? String(tc.stdout).trim() : (tc.stderr ? `Lỗi: ${tc.stderr}` : '—');

            return (
              <tr key={idx} className={isPassed ? 'row-passed' : 'row-failed'}>
                <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                  {isPassed ? (
                    <span style={{ color: '#2e7d32' }}>✔</span>
                  ) : (
                    <span style={{ color: '#c62828' }}>❌</span>
                  )}
                </td>
                <td style={{ fontWeight: '600', color: '#333' }}>Test {idx + 1}</td>
                <td className="code-font-cell">{inputVal || '(Rỗng)'}</td>
                {canSeeExpected && <td className="code-font-cell expected-cell">{expectedVal || '(Rỗng)'}</td>}
                <td className={`code-font-cell ${isPassed ? 'output-success' : 'output-failed'}`}>
                  {studentOutputVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Progress pill & Status banner matching Moodle/CodeRunner design */}
      <div className="testcases-summary-bar">
        <div className="progress-pill-track">
          <div
            className={`progress-pill-fill ${allPassed ? 'fill-success' : 'fill-warning'}`}
            style={{ width: `${passRatePercent}%` }}
          />
        </div>

        <div className="summary-status-text">
          {allPassed ? (
            <span style={{ color: '#155724', fontWeight: 'bold', fontSize: '15px' }}>
              Passed all tests! ✔
            </span>
          ) : (
            <span style={{ color: '#721c24', fontWeight: 'bold', fontSize: '15px' }}>
              Passed {passedCount} / {total} tests ({passRatePercent}%) ⚠️
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestCasesTable;
