import React from 'react';
import Header from '../../components/Header/Header';
import HeroSection from '../../components/HeroSection/HeroSection';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-[55px] flex-grow">
        <HeroSection />
      </main>
    </div>
  );
};

export default Home;