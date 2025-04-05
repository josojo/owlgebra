import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { Code } from '@geist-ui/core';
import { CheckCircle, XCircle, Clock, Play } from '@geist-ui/icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const stepLinkStyle = {
  cursor: 'pointer',
  color: '#0070f3',
  marginBottom: '8px',
  fontSize: '0.9rem'
};

const stepLinkHoverStyle = {
  color: '#0051b3'
};

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
  const [provenTaskIds, setProvenTaskIds] = useState(new Set());
  const prevFinishedTasksRef = useRef([]);

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
      const response = await fetch(`${API_BASE_URL}/status/${taskId}`);
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

  const isTaskProven = (taskId) => {
    return (selectedTaskId === taskId && 
            selectedTaskDetails?.result?.proof !== null) ||
            provenTaskIds.has(taskId);
  };

  const TaskList = ({ tasks, title }) => {
    // Sort tasks to put proven ones at the top
    const sortedTasks = filterTasks(tasks).sort((a, b) => {
      const taskIdA = a.match(/^([^:]+)/)?.[1];
      const taskIdB = b.match(/^([^:]+)/)?.[1];
      
      const isProvenA = isTaskProven(taskIdA);
      const isProvenB = isTaskProven(taskIdB);
      
      // If A is proven and B isn't, A should come first
      if (isProvenA && !isProvenB) return -1;
      // If B is proven and A isn't, B should come first
      if (!isProvenA && isProvenB) return 1;
      // If both are proven or both are not proven, maintain original order
      return 0;
    });

    return (
      <div className="task-list-container">
        <ul>
          {sortedTasks.map((task, index) => {
            const taskIdMatch = task.match(/^([^:]+)/);
            const taskId = taskIdMatch ? taskIdMatch[1] : null;
            const isSelected = taskId === selectedTaskId;
            const isProven = isTaskProven(taskId);
            
            return (
              <li 
                key={index} 
                onClick={() => handleTaskClick(task)}
                className={`task-item ${isSelected ? 'selected' : ''} ${isProven ? 'proven' : ''}`}
              >
                <div className="task-content">
                  <div className="task-id">{taskId}-{title.toLowerCase()}</div>
                  <StatusBadge status={title} isProven={isProven} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pending-tasks/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const currentFinishedTasks = data.finished_tasks || [];
      const previousFinishedTasks = prevFinishedTasksRef.current || [];

      const finishedTasksChanged = 
        currentFinishedTasks.length !== previousFinishedTasks.length || 
        JSON.stringify(currentFinishedTasks.slice().sort()) !== JSON.stringify(previousFinishedTasks.slice().sort());
        
      if (finishedTasksChanged && currentFinishedTasks.length > 0) {
        console.log("Finished tasks changed, checking for new proven tasks.");
        checkForProvenTasks(currentFinishedTasks);
        prevFinishedTasksRef.current = currentFinishedTasks;
      }

      setPendingTasks(data.pending_tasks || []);
      setRunningTasks(data.running_tasks || []);
      setFailedTasks(data.failed_tasks || []);
      setFinishedTasks(currentFinishedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const checkForProvenTasks = async (tasks) => {
    // Create a new Set to track proven task IDs
    const newProvenTaskIds = new Set(provenTaskIds);
    
    // For each finished task, check if it has a proof
    for (const task of tasks) {
      const taskIdMatch = task.match(/^([^:]+)/);
      const taskId = taskIdMatch ? taskIdMatch[1] : null;
      
      if (taskId && !provenTaskIds.has(taskId)) {
        try {
          const response = await fetch(`${API_BASE_URL}/status/${taskId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.result && 
                data.result.proof && 
                data.result.proof !== null) {
              newProvenTaskIds.add(taskId);
            }
          }
        } catch (error) {
          console.error(`Error checking if task ${taskId} is proven:`, error);
        }
      }
    }
    
    // Update the state if we found new proven tasks
    if (newProvenTaskIds.size !== provenTaskIds.size) {
      setProvenTaskIds(newProvenTaskIds);
    }
  };

  const StatusBadge = ({ status, isProven }) => {
    const getStatusInfo = (status, isProven) => {
      if (status.toLowerCase() === 'finished' && isProven) {
        return {
          icon: <CheckCircle size={16} />,
          color: '#00c853',
          background: '#e6fff0',
          text: 'Proven'
        };
      }
      
      switch (status.toLowerCase()) {
        case 'finished':
          return {
            icon: <CheckCircle size={16} />,
            color: '#0070f3',
            background: '#e6f3ff',
            text: 'Finished'
          };
        case 'failed':
          return {
            icon: <XCircle size={16} />,
            color: '#dc3545',
            background: '#ffe6e6',
            text: 'Failed'
          };
        case 'pending':
          return {
            icon: <Clock size={16} />,
            color: '#0070f3',
            background: '#e6f3ff',
            text: 'Pending'
          };
        case 'running':
          return {
            icon: <Play size={16} />,
            color: '#00a651',
            background: '#e6fff0',
            text: 'Running'
          };
        default:
          return {
            icon: <Clock size={16} />,
            color: '#6c757d',
            background: '#f8f9fa',
            text: status
          };
      }
    };

    const statusInfo = getStatusInfo(status, isProven);

    return (
      <div className="status-badge">
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-text">{statusInfo.text}</span>
        <style jsx>{`
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 16px;
            font-size: 0.75rem;
            font-weight: 500;
            color: ${statusInfo.color};
            background: ${statusInfo.background};
            border: 1px solid ${statusInfo.color}20;
          }
          .status-icon {
            display: flex;
            align-items: center;
          }
          .status-text {
            text-transform: capitalize;
          }
        `}</style>
      </div>
    );
  };

  const StepsOverview = ({ logs, onStepClick }) => {
    return (
      <div className="steps-overview">
        <h3>Logs:</h3>
        <h4>Steps Overview</h4>
        <ul className="steps-list">
          {Object.keys(logs).map((step, index) => {
            // More thorough cleaning of the step name to remove dashes and arrows
            const cleanStepName = step.replace(/^[-–—]\s*[→⟶]\s*/, '');
            return (
              <li 
                key={index} 
                className="step-item"
                onClick={() => onStepClick(step)}
              >
                <span className="step-arrow">→</span>
                {cleanStepName}
              </li>
            );
          })}
        </ul>
        <style jsx>{`
          .steps-overview {
            margin-top: 1rem;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #eaeaea;
          }
          
          .steps-overview h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
            color: #333;
            font-weight: 600;
          }
          
          .steps-overview h4 {
            margin: 0.75rem 0 1rem 0;
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
          }
          
          .steps-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .step-item {
            padding: 0.5rem 1rem;
            margin: 0.25rem 0;
            color: #0070f3;
            font-size: 0.9rem;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .step-item:hover {
            background: #e6f3ff;
            transform: translateX(4px);
          }
          
          .step-arrow {
            color: #0070f3;
            opacity: 0.7;
            font-size: 1rem;
          }
        `}</style>
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

    const handleStopTask = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kill-task/${selectedTaskDetails.task_id}`, {
          method: 'POST',
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to stop task');
        }

        // Refresh task details
        fetchTaskDetails(selectedTaskDetails.task_id);
        // Refresh task lists
        fetchTasks();
      } catch (error) {
        console.error('Error stopping task:', error);
      }
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

      // Construct the full theorem statement
      const theoremStatement = [
        result.code_env || '', // Include code_env if it exists
        `theorem ${result.name || 'unknown'}`, // Add theorem keyword and name
        ...(result.hypotheses || []), // Spread hypotheses array
        `: ${result.goal || ''}` // Add the goal, prefixed with ':='
      ].filter(line => line.trim() !== '').join('\n'); // Filter empty lines and join

      return (
        <div className="result-sections">
          {/* Compact Results Container */}
          <div className="compact-results">
            {/* Theorem Statement Section */}
            {theoremStatement && ( // Only render if theoremStatement is not empty
              <div className="result-section">
                <h4>Theorem Statement</h4>
                <Code block name="lean" className="super-compact-code">
                  {theoremStatement}
                </Code>
              </div>
            )}

            {/* Final Proof Section */}
            {result.proof && (
              <div className="result-section">
                <h4>Final Proof</h4>
                <Code
                  block
                  name="lean"
                  className="finalproven super-compact-code"
                >
                  {result.proof.split('\n').filter(line => line.trim() !== '').join('\n')}
                </Code>
              </div>
            )}

            {/* Theoretical Hypotheses Section */}
            {result.theoretical_hypotheses && result.theoretical_hypotheses.length > 0 && (
              <div className="result-section">
                <h4>Theoretical Hypotheses</h4>
                <div className="hypotheses-grid">
                  {result.theoretical_hypotheses.map((hyp, index) => {
                    // Combine hypothesis and proof, handling cases where proof might be null/empty
                    const combinedContent = `${hyp.assumptions.join(' ')} ${hyp.statement}${hyp.proof ? '\n\n' + hyp.proof : ''}`;
                    // Remove empty lines from the combined content
                    const cleanedContent = combinedContent.split('\n').filter(line => line.trim() !== '').join('\n');
                    
                    return (
                      <Code 
                        key={index} 
                        block 
                        name="lean"
                        className="theoretical super-compact-code"
                      >
                        {cleanedContent}
                      </Code>
                    );
                })} 
                </div>
              </div>
            )}

            {/* Proven Hypotheses Section */}
            {result.proven_hypotheses && result.proven_hypotheses.length > 0 && (
              <div className="result-section">
                <h4>Proven Hypotheses</h4>
                <div className="hypotheses-grid">
                  {result.proven_hypotheses.map((hyp, index) => {
                    // Combine hypothesis and proof, handling cases where proof might be null/empty
                    const combinedContent = `${hyp.assumptions.join(' ')} ${hyp.statement}${hyp.proof ? '\n\n' + hyp.proof : ''}`;
                    // Remove empty lines from the combined content
                    const cleanedContent = combinedContent.split('\n').filter(line => line.trim() !== '').join('\n');
                    
                    return (
                      <Code 
                        key={index} 
                        block 
                        name="lean"
                        className="proven super-compact-code"
                      >
                        {cleanedContent}
                      </Code>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Results */}
            {Object.entries(result)
              // Update filter to exclude the fields used in the theorem statement
              .filter(([key]) => !['goal', 'theoretical_hypotheses', 'proven_hypotheses', 'name', 'hypotheses', 'code_env', 'proof'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="result-section">
                  <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <Code 
                    block 
                    name="lean"
                    className="finalproven super-compact-code"
                  >
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2)
                      : value}
                  </Code>
                </div>
              ))}
          </div>
        </div>
      );
    };

    // Check if this task has a proof
    const isProven = selectedTaskDetails.result && 
                     selectedTaskDetails.result.proof && 
                     selectedTaskDetails.result.proof !== null;

    return (
      <div className="task-details">
        <div className="task-header">
          <div className="task-header-left">
            <h3>Task Details {selectedTaskDetails.task_id}</h3>
          </div>
          <div className="task-header-right">
            <div className="status-badges">
              <StatusBadge status={selectedTaskDetails.status} isProven={isProven} />
              {selectedTaskDetails.status.toLowerCase() === 'finished' && isProven && (
                <div className="status-badge-spacer"></div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {(selectedTaskDetails.status === 'running' || selectedTaskDetails.status === 'pending') && (
                <button 
                  onClick={handleStopTask}
                  className="stop-task-button"
                  style={{  // Add inline style to ensure it takes precedence
                    backgroundColor: '#e2d5b5',
                    color: '#333',
                    border: 'none',
                    padding: '0.25rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginRight: 'auto',
                  }}
                >
                  Stop Task
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedTaskDetails.result && (
          <div className="detail-item result-section">
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
              <TaskList tasks={pendingTasks} title="Pending" />
              <TaskList tasks={runningTasks} title="Running" />
              <TaskList tasks={finishedTasks} title="Finished" />
              <TaskList tasks={failedTasks} title="Failed" />
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
          position: relative;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
        }
        .task-id {
          font-family: monospace;
          font-size: 0.9rem;
          word-break: break-all;
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

        .task-header-right {
          display: flex;
          align-items: center;
          gap: 2rem;
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

        .status-badges {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .status-badge-spacer {
          width: 0.25rem;
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
          gap: 0.5rem;
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

        .compact-results {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 0.75rem;
          border: 1px solid #eaeaea;
        }

        .hypotheses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .result-section {
          margin-bottom: 0.5rem;
        }

        .result-section:last-child {
          margin-bottom: 0;
        }

        .result-section h4 {
          color: #666;
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0.25rem 0;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #eaeaea;
        }

        :global(.theoretical) {
          border-left: 3px solid #7c4dff !important;
        }

        :global(.proven) {
          border-left: 3px solid #00c853 !important;
        }
        
        :global(.finalproven) {
          border-left: 3px solid #002c57!important;
        }

        :global(.super-compact-code) {
          font-size: 0.75rem !important;
          line-height: 1.3 !important;
          margin: 0 !important;
        }

        :global(.super-compact-code pre) {
          padding: 0.35rem 0.5rem !important;
        }

        :global(.super-compact-code header) {
          height: 1.75rem !important;
          padding: 0 0.5rem !important;
          min-height: unset !important;
        }

        :global(.super-compact-code header .copy) {
          width: 1.25rem !important;
          height: 1.25rem !important;
        }

        :global(.super-compact-code header span) {
          font-size: 0.7rem !important;
        }

        .stop-task-button {
          background-color: #e2d5b5 !important;
          color: #333 !important;
          border: none !important;
          padding: 0.75rem 2rem !important;
          border-radius: 8px !important;
          font-size: 1rem !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin-left: auto !important;
        }

        .stop-task-button:hover {
          background-color: #d1c3a3 !important;
        }

        .stop-task-button:active {
          transform: translateY(0) !important;
        }

        :global(.task-item.proven) {
          border-left: 3px solid #00c853;
        }

        :global(.task-item.proven:hover) {
          background-color: #e6fff0;
        }

        :global(.task-item.proven.selected) {
          background-color: #e6fff0;
          border-left: 3px solid #00c853;
        }
      `}</style>
    </Layout>
  );
} 