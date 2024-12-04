import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import CurrentThinking from '../components/CurrentThinking';

export default function ThinkingPage() {
  const [currentTaskId, setCurrentTaskId] = useState(null);

  useEffect(() => {
    const fetchRunningTask = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/pending-tasks/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.running_tasks.length > 0) {
          const latestTaskId = data.running_tasks[0].split(':')[0];
          setCurrentTaskId(latestTaskId);
        }
      } catch (error) {
        console.error('Error fetching running task:', error);
      }
    };

    fetchRunningTask();
    const intervalId = setInterval(fetchRunningTask, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Owlgebra - Current Thinking</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="thinking-container">
        <CurrentThinking taskId={currentTaskId} />
      </div>

      <style jsx>{`
        .thinking-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
      `}</style>
    </Layout>
  );
} 