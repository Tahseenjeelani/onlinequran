import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { jitsiConfig } from '../../config/jitsiConfig';
import styles from './StudentCall.module.css';

const StudentCall = ({ studentId, roomName, onCallStart, onCallEnd }) => {
  const apiRef = useRef();

  const handleApiReady = (api) => {
    apiRef.current = api;
    
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Student joined conference');
      if (onCallStart) onCallStart();
    });

    // Auto-set student display name
    api.addEventListener('participantJoined', (participant) => {
      if (participant.isLocal) {
        try {
          api.executeCommand('displayName', 'Student');
        } catch (error) {
          console.log('Could not set display name');
        }
      }
    });
  };

  const handleReadyToClose = () => {
    console.log('Student left call');
    if (apiRef.current) {
      apiRef.current.dispose();
    }
    if (onCallEnd) onCallEnd();
  };

  if (!roomName) {
    return (
      <div className={styles.placeholder}>
        <p>Waiting for teacher to start session...</p>
      </div>
    );
  }

  return (
    <div className={styles.studentCall}>
      <JitsiMeeting
        roomName={roomName}
        configOverwrite={{
          ...jitsiConfig.options.configOverwrite,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
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

export default StudentCall;