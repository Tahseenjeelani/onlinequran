import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';
import Button from '../Button/Button';

const HeroSection = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        {/* Main content */}
        <div className="text-center space-y-6">
          <h1 className="mb-5 text-heading">
            Learn Quran Online <br />
            <span className="text-teal-300">With a Certified Teacher</span>
          </h1>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/teacher-login">
              <Button>Teacher Login</Button>
            </Link>
            <Link to="/student-login">
              <Button>Student Login</Button>
            </Link>
          </div>
        </div>
        
        {/* Bottom text - moved outside the main content div */}
        <div className={styles.bottomText}>
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            <span className="relative bg-transparent px-8 text-xl md:text-2xl font-['Cormorant_Garamond'] font-semibold text-[#4f8c85] italic tracking-wider">
              Ancient Wisdom for the Modern Student
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;