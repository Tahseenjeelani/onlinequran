import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';
import Button from '../Button/Button';

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1 className="mb-10 text-heading">
          Learn Quran Online <br />
          <span className="text-teal-300">With Certified Teachers</span>
        </h1>
        <p className="max-w-2xl mx-auto mb-16 text-subheading">
          Personalized 1-on-1 Quran classes for all ages. Start your journey today with native Arabic instructors.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/teacher-login">
            <Button>Teacher Login</Button>
          </Link>
          <Link to="/student-login">
            <Button>Student Login</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;