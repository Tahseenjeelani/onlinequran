import React from 'react';
import styles from './MessageHistory.module.css';

const MessageHistory = ({ messages, students }) => {
  const getStatusIcon = (message) => {
    if (message.sender === 'teacher') {
      switch (message.status) {
        case 'sent':
          return '✓';
        case 'delivered':
          return '✓✓';
        case 'read':
          return '✓✓🔵';
        default:
          return '✓';
      }
    }
    return '';
  };

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <p className={styles.empty}>{
          messages.length === 0 && 'Select a single student to view message history'
        }</p>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.sender === 'teacher' ? styles.teacher : styles.student}`}>
              <div className={styles.header}>
                <span>{msg.sender === 'teacher' ? 'You' : students.find(s => s.id === msg.sender)?.name}</span>
                <span>{new Date(msg.timestamp?.toDate?.() || msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className={styles.text}>{msg.text}</div>
              {msg.sender === 'teacher' && (
                <div className={styles.status}>
                  {getStatusIcon(msg)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageHistory;