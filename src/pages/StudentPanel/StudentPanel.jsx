import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import DesktopLayout from './components/DesktopLayout/DesktopLayout';
import MobileTabs from './components/MobileTabs/MobileTabs';
import { presenceService } from '../../services/presenceService';
import styles from './StudentPanel.module.css';

const StudentPanel = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    
    // Update student online status
    const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));
    if (currentStudent) {
      presenceService.updateStudentStatus(currentStudent.id, 'online');
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      // Update student offline status when leaving
      if (currentStudent) {
        presenceService.updateStudentStatus(currentStudent.id, 'offline');
      }
    };
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