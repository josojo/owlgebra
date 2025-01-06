import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className={styles.container}>
      <header className="header">
        <div className="headerContent">
          <div className="logo-section">
            <Image 
              src="/assets/logo.png"
              alt="Owlgebra Logo"
              width={30}
              height={30}
              className="logo"
            />
            <h1 className="title">Owlgebra</h1>
          </div>
          <nav className="nav">
            <Link href="/InputPage" className="navLink">
              Start Proving
            </Link>
            <Link href="/TasksPage" className="navLink">
              Job Overview
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.mainContent}>{children}</main>
      <Footer />

      <style jsx>{`
        .header {
          width: 100%;
          background-color: #e2d5b5;
          border-bottom: 2px solid #eaeaea;
          padding: 1.5rem;
          position: fixed;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 30px;
        }
        .headerContent {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        :global(.logo) {
          border-radius: 4px;
        }
        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .nav {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        :global(.navLink) {
          text-decoration: none;
          color: #666;
          font-size: 1.1rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
          margin: 0 0.5rem;
        }
        :global(.navLink:hover) {
          color: #0070f3;
          background-color: #f5f5f5;
        }
        .mainContent {
          padding-top: 120px;
          width: 100%;
        }
        @media (max-width: 600px) {
          .headerContent {
            flex-direction: column;
            gap: 1rem;
            padding: 0 1rem;
          }
          .nav {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
} 