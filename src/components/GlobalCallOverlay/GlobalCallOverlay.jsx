import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../../context/CallContext';
import styles from './GlobalCallOverlay.module.css';

const GlobalCallOverlay = () => {
    const {
        isCallActive,
        localStream,
        remoteStream,
        endCurrentCall,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        connectionStatus,
        targetId,
        userRole
    } = useCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (targetId && !isCallActive) {
            if (!audioRef.current) {
                audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg');
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [targetId, isCallActive]);

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

    if (!targetId) return null;

    return (
        <div className={`${styles.overlayContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
            <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className={styles.expandBtn}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? '↙️' : '↗️'}
            </button>
            <div className={styles.callContent}>

                {/* Remote Video (Main) */}
                <div className={styles.remoteVideoContainer}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={styles.remoteVideo}
                    />
                    {!remoteStream && (
                        <div className={styles.statusMessage}>
                            <p>{!isCallActive ? 'Initiating Call...' : connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting for peer...'}</p>
                            <div className={styles.spinner}></div>
                        </div>
                    )}
                </div>

                {/* Local Video (PiP) */}
                <div className={styles.localVideoContainer}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={styles.localVideo}
                    />
                </div>

                {/* Controls Bar */}
                <div className={styles.controlsBar}>
                    <button
                        onClick={toggleAudio}
                        className={`${styles.controlBtn} ${!isAudioEnabled ? styles.disabled : ''}`}
                        title={isAudioEnabled ? "Mute" : "Unmute"}
                    >
                        {isAudioEnabled ? '🎤' : '🔇'}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`${styles.controlBtn} ${!isVideoEnabled ? styles.disabled : ''}`}
                        title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                    >
                        {isVideoEnabled ? '📷' : '📷🚫'}
                    </button>

                    {userRole !== 'student' && (
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className={`${styles.controlBtn} ${isScreenSharing ? styles.active : ''}`}
                            title="Share Screen"
                        >
                            {isScreenSharing ? 'Stop Share' : '🖥️'}
                        </button>
                    )}

                    <button
                        onClick={endCurrentCall}
                        className={`${styles.controlBtn} ${styles.endCallBtn}`}
                        title="End Call"
                    >
                        📞
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalCallOverlay;
