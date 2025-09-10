import React from 'react';
import styles from './LoadingOverlay.module.css';

const LoadingOverlay = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;