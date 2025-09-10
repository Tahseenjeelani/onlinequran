import React from 'react';
import styles from './ActionButton.module.css';

const ActionButton = ({ children, icon, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.button} text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 shadow-lg shadow-teal-500/50 font-medium rounded-lg px-5 py-2.5 text-center transition-all duration-200 active:brightness-75 active:scale-[0.98] text-button cursor-pointer`}
    >
      <i className={`${icon} mr-2`}></i>
      {children}
    </button>
  );
};

export default ActionButton;