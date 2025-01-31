export default function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        {children}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .close-button {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          padding: 0.5rem;
          line-height: 1;
          color: #999;
          transition: color 0.2s ease;
          z-index: 1001;
        }

        .close-button:hover {
          color: #666;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 