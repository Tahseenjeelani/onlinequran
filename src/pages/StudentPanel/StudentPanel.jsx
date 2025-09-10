import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import DesktopLayout from './components/DesktopLayout/DesktopLayout';
import MobileTabs from './components/MobileTabs/MobileTabs';
import styles from './StudentPanel.module.css';

const StudentPanel = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {isDesktop ? (
          <DesktopLayout />
        ) : (
          <MobileTabs />
        )}
      </main>
    </div>
  );
};

export default StudentPanel;