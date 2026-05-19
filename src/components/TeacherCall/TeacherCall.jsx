import React, { useRef, useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import styles from './TeacherCall.module.css';

const TeacherCall = ({ student, roomName, onCallEnd, currentFile }) => {
  const { localStream, remoteStream, endCall } = useWebRTC(roomName, 'teacher', true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    if (onCallEnd) onCallEnd();
  };

  if (!roomName) {
    return (
      <div className={styles.placeholder}>
        <p>Select a student and start session to begin video call</p>
      </div>
    );
  }

  return (
    <div className={styles.teacherCall} style={{ position: 'relative' }}>
      {/* Remote Video (Full Size) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!remoteStream && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
          Waiting for student...
        </div>
      )}

      {/* Local Video (PiP) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '150px',
          height: '100px',
          objectFit: 'cover',
          borderRadius: '8px',
          border: '2px solid white',
          backgroundColor: '#333'
        }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={handleEndCall}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default TeacherCall;