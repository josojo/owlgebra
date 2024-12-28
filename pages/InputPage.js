"use client";

import Head from 'next/head';
import { useState } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';

// Define the AIForHypothesesProof enum using a plain object
const AIForHypothesesProof = {
  CLAUDE: 'Claude',
  OPENAI_O1: 'OpenAI(o1)',
  OPENAI_4O: 'OpenAI(4o)',
  DEEPSEEK_1_5: 'DeepSeek1.5',
};

export default function InputPage() {
  const [theoremTitle, setTheoremTitle] = useState('THEROEM123');
  const [env0code, setENV0Code] = useState('import Mathlib');
  const [prerequisites, setPrerequisites] = useState('["(n : ℕ)", "(oh0 : 0 < n)"]');
  const [goal, setGoal] = useState('Nat.gcd (21*n + 4) (14*n + 3) = 1');
  const [taskId, setTaskId] = useState(null);
  const [showSolverConfig, setShowSolverConfig] = useState(false);
  const [maxIterationHypothesesProof, setMaxIterationHypothesesProof] = useState(3);
  const [maxCorrectionIterationHypothesesProof, setMaxCorrectionIterationHypothesesProof] = useState(3);
  const [maxIterationFinalProof, setMaxIterationFinalProof] = useState(5);
  const [maxCorrectionIterationFinalProof, setMaxCorrectionIterationFinalProof] = useState(5);
  const [aiForHypothesesGeneration, setAIForHypothesesGeneration] = useState(AIForHypothesesProof.CLAUDE);
  const [aiForHypothesesProof, setAIForHypothesesProof] = useState(AIForHypothesesProof.DEEPSEEK_1_5);
  const [aiForFinalProof, setAIForFinalProof] = useState(AIForHypothesesProof.DEEPSEEK_1_5);


  const handleSubmit = async () => {
    const requestData = {
      name: theoremTitle,
      hypotheses: JSON.parse(prerequisites),
      goal: goal,
      ai_for_hypotheses_generation: aiForHypothesesGeneration,
      ai_for_hyptheses_proof: aiForHypothesesProof,
      ai_for_final_proof: aiForFinalProof,
      max_iteration_hypotheses_proof: maxIterationHypothesesProof,
      max_correction_iteration_hypotheses_proof: maxCorrectionIterationHypothesesProof,
      max_iteration_final_proof: maxIterationFinalProof,
      max_correction_iteration_final_proof: maxCorrectionIterationFinalProof,
      verbose: true,
      code_for_env_0: env0code || "import Mathlib",
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

  const handleTheoremTitleChange = (e) => {
    const value = e.target.value;
    const regex = /^[a-zA-Z0-9]*$/; // Regex to allow only letters and numbers
    if (regex.test(value)) {
      setTheoremTitle(value);
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
                <span className="label-text">Theorem Name</span>
                <input
                  type="text"
                  value={theoremTitle}
                  onChange={handleTheoremTitleChange}
                  placeholder="Enter theorem title"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">LEAN CODE BEFORE</span>
                <textarea
                  className="text-area-input"
                  value={env0code}
                  onChange={(e) => setENV0Code(e.target.value)}
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">Assumptions</span>
                <textarea
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Enter assumptions as JSON array"
                  rows="5"
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

            <div className="collapsible-text" onClick={() => setShowSolverConfig(!showSolverConfig)}>
              {showSolverConfig ? 'Hide Solver Configuration' : 'Show Solver Configuration'}
            </div>

            {showSolverConfig && (
              <div className="solver-config">
                {/* Section 1: AI for Hypotheses Generation */}
                <div className="solver-section">
                  <h3 className="solver-section-title">Hypotheses Generation</h3>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">AI for Hypotheses Generation</span>
                      <select
                        value={aiForHypothesesGeneration}
                        onChange={(e) => setAIForHypothesesGeneration(e.target.value)}
                      >
                        {Object.values(AIForHypothesesProof).map((ai) => (
                          <option key={ai} value={ai}>
                            {ai}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Section 2: Hypotheses Proof */}
                <div className="solver-section">
                  <h3 className="solver-section-title">Hypotheses Proof</h3>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">AI for Hypotheses Proof</span>
                      <select
                        value={aiForHypothesesProof}
                        onChange={(e) => setAIForHypothesesProof(e.target.value)}
                      >
                        {Object.values(AIForHypothesesProof).map((ai) => (
                          <option key={ai} value={ai}>
                            {ai}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">Max Iteration Hypotheses Proof</span>
                      <input
                        type="number"
                        value={maxIterationHypothesesProof}
                        onChange={(e) => setMaxIterationHypothesesProof(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">Max Correction Iteration Hypotheses Proof</span>
                      <input
                        type="number"
                        value={maxCorrectionIterationHypothesesProof}
                        onChange={(e) => setMaxCorrectionIterationHypothesesProof(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Final Proof */}
                <div className="solver-section">
                  <h3 className="solver-section-title">Final Proof</h3>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">AI for Final Proof</span>
                      <select
                        value={aiForFinalProof}
                        onChange={(e) => setAIForFinalProof(e.target.value)}
                      >
                        {Object.values(AIForHypothesesProof).map((ai) => (
                          <option key={ai} value={ai}>
                            {ai}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">Max Iteration Final Proof</span>
                      <input
                        type="number"
                        value={maxIterationFinalProof}
                        onChange={(e) => setMaxIterationFinalProof(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="input-group">
                    <label className="inline-label">
                      <span className="label-text">Max Correction Iteration Final Proof</span>
                      <input
                        type="number"
                        value={maxCorrectionIterationFinalProof}
                        onChange={(e) => setMaxCorrectionIterationFinalProof(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

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
        .solver-section {
          margin-bottom: 2rem;
        }
        .solver-section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
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
        .inline-label {
          display: flex;
          align-items: center;
          justify-content: space-between; /* Align items to the right */
          width: 100%;
        }
        .label-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
          margin-bottom: 0.5rem; /* Add margin for line break */
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        input, select, .text-area-input {
          flex: 0 0 200px; /* Fixed width for consistency */
          padding: 0.75rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f8f9fa;
        }
        .text-area-input {
          width: 100%; /* Full width for non-solver config fields */
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }
        input:focus, select:focus, .text-area-input:focus {
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
        .collapsible-text {
          color: #0070f3;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1rem;
          text-align: left;
          text-decoration: underline;
        }
        .collapsible-text:hover {
          color: #005bb5;
        }
        .solver-config {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </Layout>
  );
} 