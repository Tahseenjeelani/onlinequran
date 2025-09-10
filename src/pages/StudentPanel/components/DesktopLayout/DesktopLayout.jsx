import React from 'react';
import PanelSection from '../PanelSection/PanelSection';
import MessageInput from '../MessageInput/MessageInput';
import styles from './DesktopLayout.module.css';

const DesktopLayout = () => {
  return (
    <div className={styles.desktopLayout}>
      {/* Conference Section */}
      <PanelSection title="Live Session" className={styles.conferencePanel}>
        <div className={styles.conferenceContent}>
          <p className="text-white text-subheading">Jitsi Meet Conference will load here</p>
        </div>
      </PanelSection>
      
      {/* Messages Section */}
      <PanelSection title="Messages" className={styles.messagesPanel}>
        <div className={styles.messagesContent}>
          <div className={styles.messageHistory}>
            {/* messages go here */}
          </div>
          <MessageInput />
        </div>
      </PanelSection>
      
      {/* Files Section */}
      <PanelSection title="Learning Materials" className={styles.filesPanel}>
        <div className={styles.filesGrid}>
          {/* Files would be listed here */}
        </div>
      </PanelSection>
    </div>
  );
};

export default DesktopLayout;