import React, { useEffect, useRef } from 'react';
import styles from './MessageHistory.module.css';

const MessageHistory = ({ messages, students }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages
      .sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || a.timestamp;
        const dateB = b.timestamp?.toDate?.() || b.timestamp;
        return new Date(dateA) - new Date(dateB);
      })
      .forEach((message) => {
        const messageDate = new Date(message.timestamp?.toDate?.() || message.timestamp);
        const dateKey = messageDate.toDateString();
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      });
    
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(dateString);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <p className={styles.empty}>No messages yet. Start a conversation with your teacher!</p>
      ) : (
        <div className={styles.messages}>
          {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              <div className={styles.dateHeader}>
                {formatDateHeader(dateKey)}
              </div>
              {dateMessages.map((msg) => (
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
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageHistory;