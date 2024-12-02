import { useState, useEffect } from 'react';

export default function CurrentThinking({ taskId }) {
  const [currentThinking, setCurrentThinking] = useState('Awaiting input...');

  // Convert ANSI color codes to CSS colors
  const ansiToCSS = {
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': 'orange',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white',
    '0': 'inherit' // Reset to default color
  };

  const parseAnsiString = (str) => {
    // Split the string into segments based on ANSI escape codes
    const segments = str.split(/\u001b\[(\d+)m/);
    let result = [];
    
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 0) {
        // This is text content
        if (segments[i]) {
          result.push({
            text: segments[i],
            color: result.length > 0 ? result[result.length - 1].color : 'inherit'
          });
        }
      } else {
        // This is a color code
        const colorCode = segments[i];
        const nextText = segments[i + 1] || '';
        if (nextText) {
          result.push({
            text: nextText,
            color: ansiToCSS[colorCode] || 'inherit'
          });
        }
      }
    }
    return result;
  };

  const renderColoredText = (text) => {
    const segments = parseAnsiString(text);
    return (
      <>
        {segments.map((segment, index) => (
          <span key={index} style={{ color: segment.color }}>
            {segment.text}
          </span>
        ))}
      </>
    );
  };

  useEffect(() => {
    if (taskId) {
      streamLogs(taskId);
    }
  }, [taskId]);

  const streamLogs = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:8000/logs/${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const logData = JSON.parse(jsonStr);
              if (logData.message) {
                setCurrentThinking(prev => 
                  prev === 'Awaiting input...' || prev === 'No tasks currently running...' ? 
                  logData.message : 
                  `${prev}\n${logData.message}`
                );
              }
            } catch (e) {
              console.error('Error parsing log line:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming logs:', error);
      setCurrentThinking(`Error streaming logs: ${error.message}`);
    }
  };

  return (
    <div className="current-thinking">
      <h2>Current Thinking</h2>
      <pre className="thinking-output">
        {renderColoredText(currentThinking)}
      </pre>

      <style jsx>{`
        .current-thinking {
          width: 100%;
          height: 100%;
          padding: 2rem;
        }
        .thinking-output {
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          height: 600px; /* Fixed height */
          overflow-y: auto;
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
          border: 1px solid #eaeaea;
        }
      `}</style>
    </div>
  );
} 