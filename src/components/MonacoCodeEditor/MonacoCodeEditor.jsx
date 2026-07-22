import React, { useState, useEffect } from 'react';

// Language Map for Monaco
const MONACO_LANG_MAP = {
  cpp: 'cpp',
  c: 'c',
  python: 'python',
  java: 'java',
  javascript: 'javascript'
};

function MonacoCodeEditor({
  value = '',
  onChange,
  language = 'cpp',
  theme = 'vs-dark',
  height = '300px',
  readOnly = false
}) {
  const [MonacoEditor, setMonacoEditor] = useState(null);

  useEffect(() => {
    // Dynamically import @monaco-editor/react without breaking Vite import analysis
    const pkgName = '@monaco-editor/react';
    import(/* @vite-ignore */ pkgName)
      .then((mod) => {
        setMonacoEditor(() => mod.default || mod);
      })
      .catch((err) => {
        console.warn('Monaco Editor load error, using fallback code editor:', err);
      });
  }, []);

  const monacoLanguage = MONACO_LANG_MAP[(language || 'cpp').toLowerCase()] || 'cpp';

  if (MonacoEditor) {
    return (
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #4a5568' }}>
        <MonacoEditor
          height={height}
          language={monacoLanguage}
          theme={theme === 'dark' || theme === 'vs-dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(val) => onChange && onChange(val || '')}
          options={{
            readOnly,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            lineNumbers: 'on'
          }}
        />
      </div>
    );
  }

  // Fallback Code Editor with Tab key handling & line numbers
  return (
    <textarea
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      disabled={readOnly}
      rows={12}
      onKeyDown={(e) => {
        if (!readOnly && e.key === 'Tab') {
          e.preventDefault();
          const start = e.target.selectionStart;
          const end = e.target.selectionEnd;
          const val = e.target.value;
          const newText = val.substring(0, start) + '    ' + val.substring(end);
          e.target.value = newText;
          e.target.selectionStart = e.target.selectionEnd = start + 4;
          onChange && onChange(newText);
        }
      }}
      placeholder="// Write code here..."
      style={{
        width: '100%',
        height,
        fontFamily: 'Courier New, Courier, monospace',
        fontSize: '13px',
        lineHeight: 1.5,
        backgroundColor: theme === 'dark' || theme === 'vs-dark' ? '#1a202c' : '#ffffff',
        color: theme === 'dark' || theme === 'vs-dark' ? '#f7fafc' : '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '8px',
        padding: '12px',
        resize: 'vertical'
      }}
    />
  );
}

export default MonacoCodeEditor;
