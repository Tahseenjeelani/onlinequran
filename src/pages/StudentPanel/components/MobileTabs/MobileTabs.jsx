import React, { useState } from 'react';
import PanelSection from '../PanelSection/PanelSection';
import FooterTabs from './FooterTabs';
import styles from './MobileTabs.module.css';
import MessageInput from '../MessageInput/MessageInput';

const MobileTabs = () => {
  const [activeTab, setActiveTab] = useState('conference');

  return (
    <div className={styles.mobileTabs}>
      {/* Conference Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'conference' ? styles.active : ''}`}>
        <PanelSection title="Live Session">
          <div className={styles.mobileContent}>
            <p className="text-white text-subheading">Jitsi Meet Conference will load here</p>
          </div>
        </PanelSection>
      </div>
      
      {/* Messages Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'messages' ? styles.active : ''}`}>
        <PanelSection title="Messages">
          <div className={styles.mobileContent}>
            <div className={styles.mobileMessagesContainer}>
              <div className="space-y-2">
                {/* Message history will appear here */}
              </div>
            </div>
            <MessageInput isMobile/>
          </div>
        </PanelSection>
      </div>
      
      {/* Files Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}>
        <PanelSection title="Learning Materials">
          <div className={`${styles.mobileContent} ${styles.filesContent}`}>
            <div className={styles.filesGrid}>
              {/* Files would be listed here */}
            </div>
          </div>
        </PanelSection>
      </div>
      
      <FooterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MobileTabs;