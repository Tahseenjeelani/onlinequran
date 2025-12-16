import React from 'react';
import styles from './CallNotification.module.css';

const CallNotification = ({ call, onAnswer, onDecline }) => {
  return (
    <div className={styles.notificationOverlay}>
      <div className={styles.notification}>
        <div className={styles.notificationIcon}>📞</div>
        <div className={styles.notificationContent}>
          <h3>Incoming Call</h3>
          <p>Teacher is calling you</p>
        </div>
        <div className={styles.notificationActions}>
          <button 
            className={styles.answerButton}
            onClick={onAnswer}
          >
            Answer
          </button>
          <button 
            className={styles.declineButton}
            onClick={onDecline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;