import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socketService';

const CallContext = createContext();

export const useCall = () => {
    return useContext(CallContext);
};

export const CallProvider = ({ children }) => {
    const [targetId, setTargetId] = useState(null);
    const [userId, setUserId] = useState(null); // Keep user self identification
    const [userRole, setUserRole] = useState(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null); // { offer, callerId }

    const [debugState, setDebugState] = useState({
        socketConnected: false,
        offerSent: false,
        offerReceived: false,
        answerSent: false,
        answerReceived: false,
        iceCount: 0,
        connectionState: 'disconnected',
        callState: 'idle'
    });

    const updateDebug = useCallback((updates) => {
        setDebugState(prev => {
            const newState = { ...prev };
            for (let k in updates) {
                if (typeof updates[k] === 'function') {
                    newState[k] = updates[k](prev[k]);
                } else {
                    newState[k] = updates[k];
                }
            }
            return newState;
        });
    }, []);

    useEffect(() => {
        // Track socket connection state
        const checkSocket = setInterval(() => {
            const connected = socketService.getInstance()?.connected;
            setDebugState(prev => prev.socketConnected !== connected ? { ...prev, socketConnected: !!connected } : prev);
        }, 1000);
        return () => clearInterval(checkSocket);
    }, []);

    const webRTC = useWebRTC(targetId, isInitiator, updateDebug);

    // Mount global socket incoming call handler here!
    useEffect(() => {
        const handleIncomingCall = ({ offer, callerId }) => {
            console.log('[CALL] offer received');
            updateDebug({ offerReceived: true });
            // Only strictly trigger UI if no active call
            setIncomingCall({ offer, callerId });
        };

        const handleCallEnded = () => {
            // Nullify incoming call if they hang up while ringing
            setIncomingCall(null);
            setTargetId(null);
            setIsInitiator(false);
            updateDebug({ callState: 'idle' });
        };

        socketService.on('incoming-call', handleIncomingCall);
        socketService.on('call-ended', handleCallEnded); // UI reset fallback
        
        return () => {
            socketService.off('incoming-call', handleIncomingCall);
            socketService.off('call-ended', handleCallEnded);
        };
    }, [updateDebug]);

    const initiateCall = async (studentId, teacherId = 'teacher') => {
        setTargetId(studentId);
        setUserId(teacherId);
        setUserRole('teacher');
        setIsInitiator(true);
        // useWebRTC will auto-start call when it sees targetId and initiator
    };

    const answerIncomingCall = async () => {
        if (!incomingCall) return;
        setTargetId(incomingCall.callerId);
        setUserRole('student');
        setIsInitiator(false);
        webRTC.processPendingOffer(incomingCall.offer);
        setIncomingCall(null); // Clear ringing UI
    };

    const declineIncomingCall = () => {
        setIncomingCall(null);
        // Optional: emit decline so teacher knows instantly
    };

    const endCurrentCall = useCallback(async () => {
        webRTC.endCall(); // emit socket locally
        setTargetId(null);
        setIsInitiator(false);
        setIncomingCall(null);
        updateDebug({ callState: 'idle' });
    }, [webRTC]);

    const initializeSocket = useCallback((userId, role) => {
        const socket = socketService.connect();
        socket.emit('register', { userId, role });
    }, []);

    const value = {
        ...webRTC,
        initiateCall,
        answerIncomingCall,
        declineIncomingCall,
        endCurrentCall,
        initializeSocket,
        targetId,
        userRole,
        incomingCall,
        debugState
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
