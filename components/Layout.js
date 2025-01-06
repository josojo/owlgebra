import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Footer from './Footer';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();
  const isTasksPage = router.pathname === '/TasksPage';

  return (
    <div className={styles.container}>
      <header className="header">
        <div className="headerContent">
          <div className="logo-section">
            <Link href="/InputPage">
              <Image 
                src="/assets/logo.png"
                alt="Owlgebra Logo"
                width={30}
                height={30}
                className="logo"
              />
            </Link>
            <Link href="/InputPage" className="title-link">
              <h1 className="title">Owlgebra</h1>
            </Link>
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
      {!isTasksPage && <Footer />}

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
          padding-top: 80px;
          padding-bottom: ${isTasksPage ? '0' : '80px'};
          width: 100%;
          min-height: ${isTasksPage ? '100vh' : 'calc(100vh - 160px)'};
          position: relative;
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
        :global(.footer) {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: #fff;
        }
        .title-link {
          text-decoration: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
} 