import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import DesktopLayout from './components/DesktopLayout/DesktopLayout';
import MobileTabs from './components/MobileTabs/MobileTabs';
import { presenceService } from '../../services/presenceService';
import styles from './TeacherPanel.module.css';

const TeacherPanel = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStudentSelect = (studentId, isMultiple = false) => {
    if (isMultiple) {
      setSelectedStudents(prev => 
        prev.includes(studentId) 
          ? prev.length > 1 ? prev.filter(id => id !== studentId) : prev
          : [...prev, studentId]
      );
    } else {
      setSelectedStudents([studentId]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/teacher-landing" />
      <main className="flex-grow">
        {isDesktop ? (
          <DesktopLayout 
            selectedStudents={selectedStudents}
            onStudentSelect={handleStudentSelect}
          />
        ) : (
          <MobileTabs 
            selectedStudents={selectedStudents}
            onStudentSelect={handleStudentSelect}
          />
        )}
      </main>
    </div>
  );
};

export default TeacherPanel;