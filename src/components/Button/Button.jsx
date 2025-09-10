import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'button', fullWidth = false }) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      className={`${styles.button} ${
        fullWidth ? 'w-full' : ''
      } text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg px-5 py-2 text-center me-2 transition-all duration-200 active:brightness-75 active:scale-[0.98] text-button`}
    >
      {children}
    </button>
  );
};

export default Button;