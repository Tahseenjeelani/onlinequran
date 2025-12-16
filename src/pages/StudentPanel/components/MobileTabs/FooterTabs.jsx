import React from 'react';
import styles from './MobileTabs.module.css';

const FooterTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.footer}>
      <div className={styles.footerGrid}>
        <button
          className={`${styles.tabButton} ${activeTab === 'conference' ? styles.active : ''}`}
          onClick={() => setActiveTab('conference')}
        >
          <i className="ri-video-line"></i>
          <span>Meeting</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <i className="ri-file-line"></i>
          <span>Files</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'messages' ? styles.active : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="ri-message-line"></i>
          <span>Messages</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'fileViewer' ? styles.active : ''}`}
          onClick={() => setActiveTab('fileViewer')}
        >
          <i className="ri-eye-line"></i>
          <span>Viewer</span>
        </button>
      </div>
    </div>
  );
};

export default FooterTabs;