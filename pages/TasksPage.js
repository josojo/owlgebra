import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import { Code } from '@geist-ui/core';

export default function TasksPage() {
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState([]);
  const [runningTasks, setRunningTasks] = useState([]);
  const [failedTasks, setFailedTasks] = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTasks();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskDetails(selectedTaskId);
      const intervalId = setInterval(() => {
        fetchTaskDetails(selectedTaskId);
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (router.query.taskId && router.query.taskId !== selectedTaskId) {
      setSelectedTaskId(router.query.taskId);
    } else if (!selectedTaskId) {
      const firstTask = runningTasks[0] || failedTasks[0] || finishedTasks[0];
      if (firstTask) {
        const taskIdMatch = firstTask.match(/^([^:]+)/);
        const taskId = taskIdMatch ? taskIdMatch[1] : null;
        if (taskId) {
          setSelectedTaskId(taskId);
          router.push(`/TasksPage?taskId=${taskId}`, undefined, { shallow: true });
        }
      }
    }
  }, [runningTasks, failedTasks, finishedTasks, selectedTaskId, router.query.taskId]);

  const fetchTaskDetails = async (taskId) => {
    if (!taskId) return;
    
    try {
      console.log("fetching task details for", taskId);
      const response = await fetch(`http://127.0.0.1:8000/status/${taskId}`);
      const data = await response.json();
      
      if (response.status === 404) {
        setSelectedTaskDetails({
          task_id: taskId,
          status: 'not_found',
          result: { error: 'Task not found' },
          logs: {}
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const logsArray = data.logs.split('\n');
      logsArray.pop(); // Take out the last element

      // Parse logs by step
      const logsByStep = logsArray.reduce((acc, logLine) => {
        try {
          const logData = JSON.parse(logLine);
          const step = logData.step || 'unknown';
          if (!acc[step]) acc[step] = [];
          acc[step].push(logData.message);
        } catch (e) {
          console.error('Error parsing log line:', e);
        }
        return acc;
      }, {});

      setSelectedTaskDetails({ ...data, logs: logsByStep });
    } catch (error) {
      console.error('Error fetching task details:', error);
      setSelectedTaskDetails({
        task_id: taskId,
        status: 'error',
        result: { error: error.message },
        logs: {}
      });
    }
  };

  const handleTaskClick = (task) => {
    const taskIdMatch = task.match(/^([^:]+)/);
    const taskId = taskIdMatch ? taskIdMatch[1] : null;
    if (taskId) {
      setSelectedTaskId(taskId);
      router.push(`/TasksPage?taskId=${taskId}`, undefined, { shallow: true });
      fetchTaskDetails(taskId);
    }
  };

  const filterTasks = (tasks) => {
    return tasks.filter(task => 
      task.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const TaskList = ({ tasks, color, title }) => (
    <div className="task-list-container">
      <ul style={{ color }}>
        {filterTasks(tasks).map((task, index) => {
          const taskIdMatch = task.match(/^([^:]+)/);
          const taskId = taskIdMatch ? taskIdMatch[1] : null;
          const isSelected = taskId === selectedTaskId;
          
          return (
            <li 
              key={index} 
              onClick={() => handleTaskClick(task)}
              className={`task-item ${isSelected ? 'selected' : ''}`}
            >
              <div className="task-content">
                <div className="task-id">{taskId}</div>
                <div className={`task-label ${title.toLowerCase().replace(' ', '-')}`}>
                  {title}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/pending-tasks/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPendingTasks(data.pending_tasks);
      setRunningTasks(data.running_tasks);
      setFailedTasks(data.failed_tasks);
      setFinishedTasks(data.finished_tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  // Add a CSS class for clickable steps styled as links
const stepLinkStyle = {
    cursor: 'pointer', // Change cursor to pointer
    color: '#007bff', // Typical link color
    textDecoration: 'underline', // Underline to mimic a link
    transition: 'color 0.3s', // Smooth transition for hover effect
};

// Add hover effect
const stepLinkHoverStyle = {
    color: '#0056b3', // Darker shade on hover
};


  const StepsOverview = ({ logs, onStepClick }) => {
    return (
      <div className="steps-overview">
        <h3>Logs:</h3>
        <h4>Steps Overview</h4>
        <ul>
          {Object.keys(logs).map((step, index) => (
            <li 
            key={index} 
            style={stepLinkStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = stepLinkHoverStyle.color}
            onMouseLeave={(e) => e.currentTarget.style.color = stepLinkStyle.color}
            onClick={() => onStepClick(step)}>
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTaskDetails = () => {
    if (!selectedTaskDetails) {
      return <p>No task details available</p>;
    }

    const handleStepClick = (step) => {
      setSelectedStep(step);
    };

    // Format the result object for better display
    const formatResult = (result) => {
      if (result.error) {
        return (
          <div className="error-result">
            <span className="error-icon">⚠️</span>
            {result.error}
          </div>
        );
      }

      return (
        <div className="result-sections">
          {/* Goal Section */}
          {result.goal && (
            <div className="result-section">
              <h4>Goal</h4>
              <Code block name="lean">
                {result.goal}
              </Code>
            </div>
          )}

          {/* Theoretical Hypotheses Section */}
          {result.theoretical_hypotheses && result.theoretical_hypotheses.length > 0 && (
            <div className="result-section">
              <h4>Theoretical Hypotheses</h4>
              <div className="hypotheses-grid">
                {result.theoretical_hypotheses.map((hyp, index) => (
                  <Code 
                    key={index} 
                    block 
                    name="lean"
                    className="theoretical"
                  >
                    {hyp.hypothesis}
                  </Code>
                ))}
              </div>
            </div>
          )}

          {/* Proven Hypotheses Section */}
          {result.proven_hypotheses && result.proven_hypotheses.length > 0 && (
            <div className="result-section">
              <h4>Proven Hypotheses</h4>
              <div className="hypotheses-grid">
                {result.proven_hypotheses.map((hyp, index) => (
                  <Code 
                    key={index} 
                    block 
                    name="lean"
                    className="proven"
                  >
                    {`${hyp.hypothesis}${hyp.proof ? '\n\n' + hyp.proof : ''}`}
                  </Code>
                ))}
              </div>
            </div>
          )}

          {/* Other Results */}
          {Object.entries(result)
            .filter(([key]) => !['goal', 'theoretical_hypotheses', 'proven_hypotheses'].includes(key))
            .map(([key, value]) => (
              <div key={key} className="result-section">
                <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                <div className="result-value">
                  {typeof value === 'object' 
                    ? JSON.stringify(value, null, 2)
                    : value}
                </div>
              </div>
            ))}
        </div>
      );
    };

    return (
      <div className="task-details">
        <div className="task-header">
          <div className="task-header-left">
            <h3>Task Details</h3>
            <span className={`status-badge status-${selectedTaskDetails.status}`}>
              {selectedTaskDetails.status}
            </span>
          </div>
          <div className="task-id-badge">
            ID: {selectedTaskDetails.task_id}
          </div>
        </div>

        {selectedTaskDetails.result && (
          <div className="detail-item result-section">
            <h4>Result</h4>
            <div className="result-container">
              {formatResult(selectedTaskDetails.result)}
            </div>
          </div>
        )}

        <StepsOverview logs={selectedTaskDetails.logs} onStepClick={handleStepClick} />
        {selectedStep && selectedTaskDetails.logs[selectedStep] && (
          <div className="detail-item">
            <strong>Logs for Step: {selectedStep}</strong>
            <div className="thinking-output">
              <pre>
                {selectedTaskDetails.logs[selectedStep].map((message, index) => {
                  const segments = parseAnsiString(message);
                  return (
                    <div key={index}>
                      {segments.map((segment, segIndex) => (
                        <span key={segIndex} style={{ color: segment.color }}>
                          {segment.text}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Convert ANSI color codes to CSS colors
  const ansiToCSS = {
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': '#CC7000', // Changed from yellow to dark orange
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
    let currentColor = 'inherit';
    
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 0) {
        // This is text content
        if (segments[i]) {
          result.push({
            text: segments[i],
            color: currentColor
          });
        }
      } else {
        // This is a color code - update the current color
        currentColor = ansiToCSS[segments[i]] || 'inherit';
      }
    }
    return result;
  };

  return (
    <Layout>
      <Head>
        <title>Owlgebra - Tasks</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-container">
        <div className="column left-column">
          <div className="tasks-container">
            <h2 className="overview-title">Tasks Overview</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            <div className="tasks-list">
              <TaskList tasks={pendingTasks} color="#0070f3" title="Pending" />
              <TaskList tasks={runningTasks} color="#00a651" title="Running" />
              <TaskList tasks={finishedTasks} color="#6c757d" title="Finished" />
              <TaskList tasks={failedTasks} color="#dc3545" title="Failed" />
            </div>
          </div>
        </div>

        <div className="column right-column">
          {renderTaskDetails()}
        </div>
      </div>

      <style jsx>{`
        .page-container {
          display: flex;
          min-height: calc(100vh - 80px);
          width: 100%;
          position: relative;
          background-color: #f5f7fa;
          padding-top: 1.5rem;
        }
        .column {
          padding: 1.5rem;
          height: calc(100vh - 80px);
          overflow-y: auto;
        }
        .left-column {
          width: 30%;
          position: fixed;
          left: 0;
          top: 80px;
          background: #f5f7fa;
          height: calc(100vh - 80px);
          overflow-y: hidden;
        }
        .right-column {
          width: 60%;
          margin-left: 30%;
          padding-top: 0;
          position: fixed;
          right: 0;
          top: 80px;
        }
        .content-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          height: calc(100% - 3rem);
          overflow-y: auto;
          max-width: 100%;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #eaeaea;
        }
        .task-details {
          padding: 1rem;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        .detail-item {
          margin-bottom: 1rem;
          padding: 0.5rem;
          border-bottom: 1px solid #eaeaea;
        }
        .detail-item strong {
          font-size: 1rem;
          color: #333;
        }
        .status-failed {
          color: #dc3545;
          font-weight: bold;
        }
        .status-running {
          color: #00a651;
          font-weight: bold;
        }
        .status-finished {
          color: #0070f3;
          font-weight: bold;
        }
        .scroll-container {
          border: 1px solid #eaeaea;
          border-radius: 6px;
          background: #f8f9fa;
          max-height: 300px;
          overflow: auto;
          padding: 0.5rem;
        }
        .result-content, .logs-content {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .thinking-output {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #eaeaea;
        }
        .task-content {
          position: relative;
          min-height: 50px;
          padding: 0.75rem;
        }
        .task-id {
          font-family: monospace;
          font-size: 0.9rem;
          word-break: break-all;
          padding-right: 80px; /* Make space for the label */
        }
        .task-label {
          position: absolute;
          bottom: 8px;
          right: 8px;
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        :global(.pending) {
          background-color: #e6f3ff;
          color: #0070f3;
        }
        :global(.running) {
          background-color: #e6fff0;
          color: #00a651;
        }
        :global(.failed) {
          background-color: #ffe6e6;
          color: #dc3545;
        }
        :global(.finished) {
          background-color: #f2f2f2;
          color: #6c757d;
        }
        :global(.task-item) {
          cursor: pointer;
          margin: 0.75rem 0;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: #f8f9fa;
          overflow: hidden;
          border: 1px solid #eaeaea;
        }
        :global(.task-item:hover) {
          background-color: #f0f0f0;
          transform: translateX(2px);
          border-color: #d0d0d0;
        }
        :global(.task-item.selected) {
          background-color: #e3f2fd;
          border-left: 3px solid #0070f3;
        }
        .tasks-list {
          margin-top: 1rem;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .tasks-list::-webkit-scrollbar {
          width: 8px;
        }

        .tasks-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .tasks-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .tasks-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 500;
          color: #444;
          margin: 1.5rem 0 1rem 0;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .thinking-output {
          white-space: pre-wrap;
          word-wrap: break-word;
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          height: 600px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
          border: 1px solid #eaeaea;
        }

        .thinking-output pre {
          margin: 0;
          font-family: inherit;
        }
        .task-list-container {
          margin-bottom: 1.5rem;
        }
        .tasks-container {
          padding-top: 1rem;
        }
        .overview-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 1.5rem 0;
          padding: 0 1rem 0.75rem 1rem;
          border-bottom: 2px solid #eaeaea;
        }
        .tasks-list {
          margin-top: 1rem;
        }
        .search-container {
          position: relative;
          margin: 0 1rem 1.5rem 1rem;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem;
          padding-right: 2.5rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          background: #f8f9fa;
        }
        .search-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
          background: white;
        }
        .search-input::placeholder {
          color: #999;
        }
        .clear-search {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #666;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }
        .clear-search:hover {
          color: #333;
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #eaeaea;
        }

        .task-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .task-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .task-id-badge {
          background: #f0f0f0;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
          color: #666;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.status-running {
          background-color: #e6fff0;
          color: #00a651;
        }

        .status-badge.status-failed {
          background-color: #ffe6e6;
          color: #dc3545;
        }

        .status-badge.status-finished {
          background-color: #e6f3ff;
          color: #0070f3;
        }

        .result-section {
          background: #fff;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }

        .result-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1rem;
        }

        .result-container {
          background: #f8f9fa;
          border-radius: 4px;
          padding: 1rem;
        }

        .result-row {
          display: flex;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }

        .result-row:last-child {
          border-bottom: none;
        }

        .result-key {
          font-weight: 500;
          color: #666;
          width: 150px;
          flex-shrink: 0;
        }

        .result-value {
          color: #333;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-result {
          color: #dc3545;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-icon {
          font-size: 1.2rem;
        }

        .result-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .code-block {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          margin: 0.5rem 0;
        }

        .code-block pre {
          margin: 0;
          padding: 1rem;
          overflow-x: auto;
        }

        .code-block code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .lean-block {
          background: #1e1e1e;
          color: #d4d4d4;
          border: 1px solid #333;
        }

        .lean-block.theoretical {
          border-left: 4px solid #7c4dff;
        }

        .lean-block.proven {
          border-left: 4px solid #00c853;
        }

        .block-header {
          background: #2d2d2d;
          color: #fff;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          border-bottom: 1px solid #333;
        }

        .hypotheses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .result-section h4 {
          color: #333;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #eaeaea;
        }

        .result-value {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Syntax highlighting colors */
        .lean-block .keyword { color: #569cd6; }
        .lean-block .type { color: #4ec9b0; }
        .lean-block .variable { color: #9cdcfe; }
        .lean-block .operator { color: #d4d4d4; }
        .lean-block .comment { color: #6a9955; }

        .hypotheses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .result-section h4 {
          color: #333;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #eaeaea;
        }

        .result-value {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        :global(.theoretical) {
          border-left: 4px solid #7c4dff !important;
        }

        :global(.proven) {
          border-left: 4px solid #00c853 !important;
        }
      `}</style>
    </Layout>
  );
} 