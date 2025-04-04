"use client";

import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import Modal from '../components/Modal';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function InputPage() {
  const router = useRouter();
  const [leanCode, setLeanCode] = useState('import Mathlib\n\ntheorem example_theorem (n : ℕ) (oh0 : 0 < n) \n : Nat.gcd (21*n + 4) (14*n + 3) = 1 := by');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Parsed states (for verification)
  const [theoremTitle, setTheoremTitle] = useState('');
  const [env0code, setENV0Code] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [goal, setGoal] = useState('');
  
  const [taskId, setTaskId] = useState(null);
  const [showSolverConfig, setShowSolverConfig] = useState(false);
  const [maxIterationHypothesesProof, setMaxIterationHypothesesProof] = useState(1);
  const [maxCorrectionIterationHypothesesProof, setMaxCorrectionIterationHypothesesProof] = useState(1);
  const [maxIterationFinalProof, setMaxIterationFinalProof] = useState(1);
  const [maxCorrectionIterationFinalProof, setMaxCorrectionIterationFinalProof] = useState(1);
  const [aiForHypothesesGeneration, setAIForHypothesesGeneration] = useState('');
  const [aiForHypothesesProof, setAIForHypothesesProof] = useState([]);
  const [aiForFinalProof, setAIForFinalProof] = useState('');
  const [allowedModels, setAllowedModels] = useState({
    hypothesis_generation: [],
    hypothesis_proof: [],
    final_proof: [],
  });

  useEffect(() => {
    const fetchSolverConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/solver-config/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllowedModels(data.limits.allowed_models);

        // Set default AI model selections
        setAIForHypothesesGeneration(data.limits.allowed_models.hypothesis_generation[0] || '');
        setAIForHypothesesProof([data.limits.allowed_models.hypothesis_proof[0] || '']); // Initialize as array
        setAIForFinalProof(data.limits.allowed_models.final_proof[0] || '');
      } catch (error) {
        console.error('Error fetching solver config:', error);
      }
    };

    fetchSolverConfig();
  }, []);

  const parseLeanCode = () => {
    try {
      // Use the existing parseTheorem function from theoremParser.js
      const { parseTheorem } = require('../utils/theoremParser');
      const result = parseTheorem(leanCode);
      
      // Update states with parsed results
      setTheoremTitle(result.theoremTitle);
      setENV0Code(result.env0code);
      setPrerequisites(JSON.stringify(result.hypotheses));
      setGoal(result.goal);
      
      // Show verification modal
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Error parsing Lean code:', error);
      alert('Error parsing Lean code. Please check the format.');
    }
  };

  const handleHypothesesProofModelChange = (model) => {
    setAIForHypothesesProof(prev => {
      if (prev.includes(model)) {
        return prev.filter(m => m !== model);
      } else {
        return [...prev, model];
      }
    });
  };

  const handleSubmit = async () => {
    // Close the verification modal first
    setShowVerificationModal(false);
    
    const requestData = {
      name: theoremTitle,
      hypotheses: JSON.parse(prerequisites),
      goal: goal,
      ai_for_hypotheses_generation: aiForHypothesesGeneration,
      ai_for_hypotheses_proof: aiForHypothesesProof,
      ai_for_final_proof: aiForFinalProof,
      max_iteration_hypotheses_proof: maxIterationHypothesesProof,
      max_correction_iteration_hypotheses_proof: maxCorrectionIterationHypothesesProof,
      max_iteration_final_proof: maxIterationFinalProof,
      max_correction_iteration_final_proof: maxCorrectionIterationFinalProof,
      verbose: true,
      code_for_env_0: env0code || "import Mathlib",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/prove/`, {
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

  const handleTaskClick = () => {
    if (taskId) {
        router.push(`/TasksPage?taskId=${taskId}`, undefined, { shallow: true });
    }
  };

  const MultiSelectDropdown = ({ options, selectedValues, onChange }) => {
    return (
      <div className="custom-select">
        <select
          multiple
          value={selectedValues}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            onChange(selectedOptions);
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <style jsx>{`
          .custom-select {
            width: 300px;
            margin-left: auto; /* This will align it to the right */
          }

          .custom-select select {
            width: 100%;
            height: auto;
            min-height: 42px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            transition: all 0.2s ease;
            background: #f8f9fa;
            box-sizing: border-box;
            cursor: pointer;
            color: #333;
            text-align: left;
          }

          .custom-select select:focus {
            outline: none;
            border-color: #0070f3;
            box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
            background: white;
          }

          .custom-select select option {
            padding: 8px;
            background: white;
            color: #333;
            font-size: 0.95rem;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            box-sizing: border-box;
          }

          .custom-select select option:checked {
            background: #f0f7ff;
            color: #0070f3;
          }

          .custom-select select option:hover {
            background: #f5f5f5;
          }
        `}</style>
      </div>
    );
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
                <span className="label-text">Lean Code</span>
                <textarea
                  className="code-input"
                  value={leanCode}
                  onChange={(e) => setLeanCode(e.target.value)}
                  rows="12"
                  placeholder="Enter your Lean code here..."
                />
              </label>
            </div>

            <div className="button-container">
              <button onClick={parseLeanCode} className="verify-button">
                Prove it!
              </button>
            </div>

            {/* Move task info here, outside the modal */}
            {taskId && (
              <div className="task-info" onClick={handleTaskClick}>
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
              Owlgebra envisions to empower everyone with the latest math-AI innovation. 
              Send us your theorem and we will prove it for you using Lean4 theorem prover.
            </p>
            <div className="image-container">
              <img 
                src="/assets/Owlcuty.png" 
                alt="Owlgebra Vision"
                className="vision-image"
              />
            </div>
          </div>
        </div>
      </div>

      {showVerificationModal && (
        <Modal onClose={() => setShowVerificationModal(false)}>
          <div className="verification-content">
            <h2>Verify Parsed Information</h2>
            
            <div className="input-group">
              <label>
                <span className="label-text">Theorem Name</span>
                <input
                  type="text"
                  value={theoremTitle}
                  onChange={(e) => setTheoremTitle(e.target.value)}
                  className="modal-input"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">Code Before Theorem</span>
                <input
                  type="text"
                  value={env0code}
                  onChange={(e) => setENV0Code(e.target.value)}
                  className="modal-input"
                />
              </label>
            </div>

            <div className="input-group">
              <label>
                <span className="label-text">Assumptions</span>
                <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  className="modal-input"
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
                  className="modal-input"
                />
              </label>
            </div>

            <div className="collapsible-text" onClick={() => setShowSolverConfig(!showSolverConfig)}>
              Show Solver Configuration
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
                        {allowedModels.hypothesis_generation.map((ai) => (
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
                    <label className="checkbox-group-label">
                      <span className="label-text">AI Models for Hypotheses Proof</span>
                      <div className="checkbox-container">
                        {allowedModels.hypothesis_proof.map((ai) => (
                          <label key={ai} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={aiForHypothesesProof.includes(ai)}
                              onChange={() => handleHypothesesProofModelChange(ai)}
                              className="checkbox-input"
                            />
                            <span className="checkbox-text">{ai}</span>
                          </label>
                        ))}
                      </div>
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
                        {allowedModels.final_proof.map((ai) => (
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
                Submit for Proving
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .page-container {
          display: flex;
          min-height: calc(100vh - 120px);
          background-color: #f5f7fa;
          padding: 2rem;
          gap: 4rem;
          margin-top: 60px;
          
          @media (max-width: 768px) {
            flex-direction: column;
            padding: 1rem;
            gap: 2rem;
          }
        }
        .left-section {
          flex: 1;
          max-width: calc(50% - 2rem);
          padding-right: 2rem;

          @media (max-width: 768px) {
            max-width: 100%;
            padding-right: 0;
          }
        }
        .right-section {
          flex: 1;
          max-width: calc(50% - 2rem);
          display: flex;
          align-items: flex-start;
          padding-left: 2rem;

          @media (max-width: 768px) {
            max-width: 100%;
            padding-left: 0;
          }
        }
        .content-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
          margin-bottom: 2rem;
          border: 2px solid #e2d5b5;
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
          padding: 2rem;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border: 2px solid #e2d5b5;
          min-height: 200px;
        }
        .vision-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1rem;
        }
        .vision-text {
          font-size: 1.2rem;
          line-height: 1.5;
          color: #666;
          font-weight: 400;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #eaeaea;
        }
        .input-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .inline-label {
          display: flex;
          align-items: center;
          justify-content: space-between; /* Align items to the right */
          width: 100%;
        }
        .label-text {
          font-size: 1rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input, select, .text-area-input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f8f9fa;
          width: 100%;
          box-sizing: border-box;
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
          justify-content: center;
        }
        .submit-button {
          background-color: #e2d5b5;
          color: #333;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .submit-button:hover {
          background-color: #d1c3a3;
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
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .task-info:hover {
          background: #e0f0ff;
          transform: translateY(-1px);
        }
        .task-info:active {
          transform: translateY(0);
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
          margin-top: auto;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          max-height: 300px;
          overflow: hidden;
        }
        .vision-image {
          width: auto;
          height: auto;
          max-width: 180px;
          max-height: 250px;
          object-fit: contain;
          border-radius: 80%;
        }
        .collapsible-text {
          color: #e2d5b5;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1rem;
          text-align: left;
          text-decoration: underline;
        }
        .collapsible-text:hover {
          color: #b8a88a;
        }
        .solver-config {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
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
        .input-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .inline-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .solver-config .label-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .solver-config .input-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .solver-config .input-group input,
        .solver-config .input-group select {
          width: 100%;
          max-width: 300px;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f8f9fa;
          box-sizing: border-box;
        }
        .solver-config .input-group input:focus,
        .solver-config .input-group select:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
          background: white;
        }
        .code-input {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          line-height: 1.5;
          width: calc(100% - 2rem);
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #f8f9fa;
          margin: 0 0rem;
        }
        .verify-button {
          background-color: #e2d5b5;
          color: #333;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .verify-button:hover {
          background-color: #d1c3a3;
          transform: translateY(-1px);
        }
        .verification-content h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 2rem;
          text-align: center;
        }
        .input-group {
          margin-bottom: 2rem;
        }
        .label-text {
          display: block;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }
        .modal-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          background: #f8f9fa;
          color: #333;
        }
        .modal-input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
        }
        .checkbox-group-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .checkbox-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem;
        }
        .checkbox-input {
          width: auto;
          margin: 0;
        }
        .checkbox-text {
          font-size: 0.9rem;
          color: #333;
        }
        .checkbox-label:hover {
          background: #f5f5f5;
          border-radius: 4px;
        }
      `}</style>
    </Layout>
  );
} 