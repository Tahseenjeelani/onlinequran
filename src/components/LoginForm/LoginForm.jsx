import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import Button from '../Button/Button';

const LoginForm = ({ onSubmit }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className={styles.loginForm}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            id="username"
            name="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`${styles.formInput} text-input`}
            placeholder="Enter your username"
          />
        </div>
        
        <Button type="submit" fullWidth>
          Continue
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;