import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import LoginForm from '../../components/LoginForm/LoginForm';
import styles from './TeacherLogin.module.css';

const TeacherLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('quranTeacherUsername');
    if (savedUsername) {
      navigate('/teacher-landing');
    }
  }, [navigate]);

  const handleLogin = (username) => {
    localStorage.setItem('quranTeacherUsername', username);
    navigate('/teacher-landing');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-[55px] flex-grow">
        <section className={styles.heroSection}>
          <div className={`${styles.heroContent} container mx-auto px-4 py-16`}>
            <h1 className="mb-4 text-heading">
              Teacher Login
            </h1>
            
            <LoginForm onSubmit={handleLogin} />
            
            <p className="text-white text-opacity-70 mt-6 text-note">
              Note: Your username will be saved for future logins.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherLogin;