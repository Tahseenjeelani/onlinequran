import React, { useState } from 'react';
import styles from './MessageInput.module.css';

const MessageInput = ({ isMobile = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      // Send message to teacher (placeholder for actual logic)
      console.log(`Message sent to teacher: ${message}`);
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
        placeholder="Type your message..."
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
