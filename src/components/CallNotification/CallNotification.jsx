import React, { useEffect } from 'react';
import styles from './CallNotification.module.css';

const CallNotification = ({ call, onAnswer, onDecline }) => {
  useEffect(() => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg');
    audio.loop = true;
    audio.play().catch(e => console.log('Audio autoplay blocked', e));

    return () => {
      audio.pause();
    };
  }, []);

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