import React from 'react';
import styles from './MobileTabs.module.css';

const FooterTabs = ({ activeTab, setActiveTab, selectedFile }) => {
  const baseTabs = [
    { id: 'students', icon: 'ri-group-line'},
    { id: 'conference', icon: 'ri-vidicon-line'},
    { id: 'messages', icon: 'ri-chat-3-line' },
    { id: 'files', icon: 'ri-folder-2-line' }
  ];

  const fileViewerTab = { 
    id: 'fileviewer', 
    icon: 'ri-file-line', 
    
  };

  const tabs = selectedFile ? [...baseTabs, fileViewerTab] : baseTabs;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(tab => (
          <div key={tab.id} className="w-full text-center">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            >
              <i className={tab.icon}></i>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default FooterTabs;