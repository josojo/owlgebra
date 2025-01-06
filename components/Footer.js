import styles from '../styles/Home.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="footer-content">
        <a href="https://github.com/josojo/smarthammer" target="_blank" rel="noopener noreferrer" className="footer-link">
          <img src="/assets/github-icon.png" alt="GitHub" className="github-icon" />
          Backend: SmartHammer
        </a>
        <a href="https://github.com/josojo/owlgebra" target="_blank" rel="noopener noreferrer" className="footer-link">
          <img src="/assets/github-icon.png" alt="GitHub" className="github-icon" />
          Frontend: Owlgebra
        </a>
        <a href="mailto:josojo341@gmail.com" className="footer-link">
          <img src="/assets/email-icon.png" alt="Email" className="email-icon" />
          Contact Us
        </a>
      </div>

      <style jsx>{`
        .footer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3rem;
          padding: 1rem;
          border-top: 2px solid #eaeaea;
          background-color: #fff;
          position: relative;
          z-index: 1000;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .footer-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #333;
          font-size: 1rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: #0070f3;
        }
        .github-icon, .email-icon {
          width: 28px;
          height: 20px;
          margin-right: 0.75rem;
        }
      `}</style>
    </footer>
  );
} 