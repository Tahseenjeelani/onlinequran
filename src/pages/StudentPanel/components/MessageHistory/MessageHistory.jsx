import React from 'react';
import styles from './MessageHistory.module.css';

const MessageHistory = ({ messages, students }) => {
  const getStatusIcon = (message) => {
    if (message.sender !== 'teacher') {
      switch (message.status) {
        case 'sent':
          return '✓';
        case 'delivered':
          return '✓✓';
        case 'read':
          return '✓✓';
        default:
          return '✓';
      }
    }
    return '';
  };

  const isMessageRead = (message) => {
    return message.status === 'read' && message.readBy && message.readBy.teacher;
  };

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <p className={styles.empty}>No messages yet. Start a conversation with your teacher!</p>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.sender === 'teacher' ? styles.teacher : styles.student}`}>
              <div className={styles.messageContent}>
                <div className={styles.header}>
                  <span className={styles.sender}>
                    {msg.sender === 'teacher' ? 'Teacher' : 'You'}
                  </span>
                  <span className={styles.time}>
                    {new Date(msg.timestamp?.toDate?.() || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={styles.textWrapper}>
                  <div className={styles.text}>{msg.text}</div>
                  {msg.sender !== 'teacher' && (
                    <div className={`${styles.status} ${isMessageRead(msg) ? styles.read : ''}`}>
                      {getStatusIcon(msg)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageHistory;