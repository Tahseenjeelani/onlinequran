import React from 'react';
import styles from './PanelSection.module.css';

const PanelSection = ({ title, children }) => {
  return (
    <div className={styles.panelSection}>
      <h2 className="text-white text-heading mb-1">{title}</h2>
      {children}
    </div>
  );
};

export default PanelSection;