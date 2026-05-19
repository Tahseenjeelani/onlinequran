import React, { useRef, useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import styles from './StudentCall.module.css';

const StudentCall = ({ studentId, roomName, onCallStart, onCallEnd }) => {
  const { localStream, remoteStream, endCall, isCallActive } = useWebRTC(roomName, studentId, false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (isCallActive && onCallStart) {
      onCallStart();
    }
  }, [isCallActive, onCallStart]);

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
        <p>Waiting for teacher to start session...</p>
      </div>
    );
  }

  return (
    <div className={styles.studentCall} style={{ position: 'relative' }}>
      {/* Remote Video (Full Size) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!remoteStream && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
          Connecting to teacher...
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

export default StudentCall;