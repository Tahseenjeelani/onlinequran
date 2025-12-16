import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { jitsiConfig } from '../../config/jitsiConfig';
import styles from './TeacherCall.module.css';

const TeacherCall = ({ student, roomName, onCallEnd, currentFile }) => {
  const apiRef = useRef();

  const handleApiReady = (api) => {
    apiRef.current = api;
    
    // Teacher automatically joins without prompting
    api.executeCommand('toggleVideo'); // Camera off
    
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Teacher joined conference');
      
      // Set teacher as moderator
      try {
        api.executeCommand('password', 'moderator123');
        api.executeCommand('displayName', 'Teacher');
      } catch (error) {
        console.log('Moderator commands not available');
      }
    });

    // Handle screen sharing
    api.addEventListener('screenSharingStatusChanged', (sharingStatus) => {
      if (sharingStatus.on && currentFile) {
        console.log('Screen sharing started with file:', currentFile);
      }
    });
  };

  const handleReadyToClose = () => {
    console.log('Call ended');
    if (apiRef.current) {
      apiRef.current.dispose();
    }
    onCallEnd();
  };

  if (!roomName) {
    return (
      <div className={styles.placeholder}>
        <p>Select a student and start session to begin video call</p>
      </div>
    );
  }

  return (
    <div className={styles.teacherCall}>
      <JitsiMeeting
        roomName={roomName}
        configOverwrite={{
          ...jitsiConfig.options.configOverwrite,
          startWithVideoMuted: true,
        }}
        interfaceConfigOverwrite={jitsiConfig.options.interfaceConfigOverwrite}
        onApiReady={handleApiReady}
        getIFrameRef={(iframe) => {
          iframe.style.height = '100%';
          iframe.style.width = '100%';
          iframe.style.borderRadius = '8px';
          iframe.style.border = 'none';
        }}
        onReadyToClose={handleReadyToClose}
      />
    </div>
  );
};

export default TeacherCall;