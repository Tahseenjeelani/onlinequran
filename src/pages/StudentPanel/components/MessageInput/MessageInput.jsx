import React, { useState } from 'react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSend, isMobile = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className={`${styles.messageInputContainer} ${isMobile ? styles.mobile : ''}`}>
      <input 
        type="text" 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        className={styles.messageInput}
        placeholder="Type your message to teacher..."
      />
      <div className={styles.messageButtons}>
        <button 
          className={styles.sendButton}
          onClick={handleSend}
        >
          <i className="ri-send-plane-line"></i>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;