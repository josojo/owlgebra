import Head from 'next/head';
import { useState } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';

export default function InputPage() {
  const [theoremTitle, setTheoremTitle] = useState('IMO');
  const [prerequisites, setPrerequisites] = useState('["(n : ℕ)", "(oh0 : 0 < n)"]');
  const [goal, setGoal] = useState('Nat.gcd (21*n + 4) (14*n + 3) = 1');
  const [taskId, setTaskId] = useState(null);

  const handleSubmit = async () => {
    const requestData = {
      name: theoremTitle,
      hypotheses: JSON.parse(prerequisites),
      goal: goal,
    };

    try {
      const response = await fetch('http://localhost:8000/prove/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTaskId(data.task_id);
    } catch (error) {
      console.error('Error submitting proof:', error);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Owlgebra - Start Proving</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-container">
        <div className="left-section">
          <div className="content-box">
            <h2 className="section-title">Find your lean proof</h2>
            
            <div className="input-group">
              <label>
                <span className="label-text">Your Theorem Name</span>
                <input
                  type="text"
                  value={theoremTitle}
                  onChange={(e) => setTheoremTitle(e.target.value)}
                  placeholder="Enter theorem title"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">Assumptions</span>
                <textarea
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Enter prerequisites as JSON array"
                  rows="4"
                  className="text-area-input"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">Goal</span>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Enter your goal"
                />
              </label>
            </div>

            <div className="button-container">
              <button onClick={handleSubmit} className="submit-button">
                Start Proving
              </button>
            </div>

            {taskId && (
              <div className="task-info">
                <strong>Task Created:</strong>
                <span className="task-id">{taskId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="right-section">
          <div className="vision-box">
            <h2 className="vision-title">Our Vision</h2>
            <p className="vision-text">
              Project Owlgebra envisions to empower everyone with the latest math-AI innovation. 
              Send us your theorem and we will prove it for you using Lean4 theorem prover.
            </p>
            <div className="image-container" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flex: 1,
              minHeight: '300px' // Add minimum height to ensure vertical centering space
            }}>
              <img 
                src="/assets/image_small.png" 
                alt="Owlgebra Vision"
                className="vision-image"
                style={{
                  maxWidth: '80%',
                  maxHeight: '80%',
                  objectFit: 'center'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          display: flex;
          min-height: calc(100vh - 120px);
          background-color: #f5f7fa;
          padding: 2rem;
          gap: 4rem;
          margin-top: 30px;
        }
        .left-section {
          flex: 1;
          max-width: calc(50% - 2rem);
          padding-right: 2rem;
        }
        .right-section {
          flex: 1;
          max-width: calc(50% - 2rem);
          display: flex;
          align-items: flex-start;
          padding-left: 2rem;
        }
        .content-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
        }
        .vision-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .vision-title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1.5rem;
        }
        .vision-text {
          font-size: 1.5rem;
          line-height: 1.6;
          color: #666;
          font-weight: 400;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 2rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #eaeaea;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        .label-text {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input, .text-area-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f8f9fa;
        }
        
        .text-area-input {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        input:focus, .text-area-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
          background: white;
        }

        input::placeholder, .text-area-input::placeholder {
          color: #aaa;
        }
        
        .button-container {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
        }
        .submit-button {
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .submit-button:hover {
          background-color: #0060df;
          transform: translateY(-1px);
        }
        .submit-button:active {
          transform: translateY(0);
        }
        .task-info {
          margin-top: 2rem;
          padding: 1rem;
          background: #f0f7ff;
          border-radius: 6px;
          border: 1px solid #cce4ff;
        }
        .task-info strong {
          display: block;
          color: #0070f3;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .task-id {
          font-family: 'Monaco', 'Menlo', monospace;
          color: #666;
          font-size: 0.9rem;
        }
        .image-container {
          margin-top: 2rem;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .vision-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
      `}</style>
    </Layout>
  );
} 