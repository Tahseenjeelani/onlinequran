import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ActionButton from '../../components/ActionButton/ActionButton';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import styles from './TeacherLanding.module.css';

const TeacherLanding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const navigateWithLoading = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-[55px] flex-grow">
        <section className={styles.heroSection}>
          <div className={`${styles.heroContent} container mx-auto px-4 py-20`}>
            <div className="flex flex-col sm:flex-col justify-center gap-8">
              <ActionButton 
                icon="ri-vidicon-2-line" 
                onClick={() => navigateWithLoading('/teacher-panel')}
              >
                Start Teaching
              </ActionButton>

              <ActionButton 
                icon="ri-user-3-line" 
                onClick={() => navigateWithLoading('/student-management')}
              >
                Student Management
              </ActionButton>

              <ActionButton 
                icon="ri-book-marked-line" 
                onClick={() => navigateWithLoading('/file-management')}
              >
                Files Management
              </ActionButton>
            </div>
          </div>
        </section>
      </main>

      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default TeacherLanding;