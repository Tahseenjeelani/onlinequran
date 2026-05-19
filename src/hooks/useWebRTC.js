import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (targetId, isInitiator = false, updateDebug) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);
    const iceCandidateQueue = useRef([]);
    const pendingOfferRef = useRef(null); // Used if student accepts call and passes offer into hook

    const setStatus = useCallback((status) => {
        setConnectionStatus(status);
        if (updateDebug) updateDebug({ connectionState: status });
    }, [updateDebug]);

    const flushIceCandidateQueue = useCallback(async () => {
        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding queued ice candidate', e);
                }
            } else {
                iceCandidateQueue.current.unshift(candidate);
                break;
            }
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) return;

        console.log('Creating PeerConnection');
        peerConnection.current = new RTCPeerConnection(STUN_SERVERS);
        setStatus('connecting');

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[CALL] ICE candidate sent');
                if (updateDebug) updateDebug({ iceCount: prev => prev + 1 });
                socketService.emit('ice-candidate', {
                    candidate: event.candidate,
                    targetId
                });
            }
        };

        peerConnection.current.ontrack = (event) => {
            console.log('Received remote track', event.streams[0]);
            setRemoteStream(event.streams[0]);
            setStatus('connected');
        };

        peerConnection.current.onconnectionstatechange = () => {
            console.log('[CALL] connection state:', peerConnection.current?.connectionState);
            if (peerConnection.current?.connectionState === 'connected') {
                setStatus('connected');
                if (updateDebug) updateDebug({ callState: 'connected' });
            } else if (peerConnection.current?.connectionState === 'disconnected' || peerConnection.current?.connectionState === 'failed') {
                setStatus('disconnected');
            }
        };

    }, [targetId, setStatus, updateDebug]);

    const startLocalStream = useCallback(async () => {
        try {
            if (localStreamRef.current) return localStreamRef.current;
            console.log('Getting user media');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            return null;
        }
    }, []);

    const startCall = useCallback(async () => {
        if (!targetId) return;
        console.log('Starting call...');
        
        if (updateDebug) updateDebug({ callState: 'initiating' });

        const stream = await startLocalStream();
        if (!stream) return;

        createPeerConnection();

        stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, stream);
        });

        console.log('Creating offer');
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        console.log('[CALL] offer sent');
        socketService.emit('offer', { offer, targetId });
        
        if (updateDebug) updateDebug({ offerSent: true });
        setIsCallActive(true);
    }, [createPeerConnection, startLocalStream, targetId, updateDebug]);

    const answerCall = useCallback(async (incomingOffer) => {
        if (!targetId) return;
        console.log('Answering call...');
        
        if (updateDebug) updateDebug({ callState: 'answering' });

        const stream = await startLocalStream();
        if (!stream) return;

        createPeerConnection();

        stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, stream);
        });

        console.log('Setting remote description (offer)');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        await flushIceCandidateQueue();

        console.log('Creating answer');
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        console.log('[CALL] answer sent');
        socketService.emit('answer', { answer, targetId });
        
        if (updateDebug) updateDebug({ answerSent: true });
        setIsCallActive(true);
    }, [createPeerConnection, startLocalStream, targetId, flushIceCandidateQueue, updateDebug]);

    const handleIceCandidate = useCallback(async (candidate) => {
        console.log('[CALL] ICE candidate received');
        if (peerConnection.current && peerConnection.current.remoteDescription) {
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        } else {
            console.log('Queueing ICE candidate until remote description is set');
            iceCandidateQueue.current.push(candidate);
        }
    }, []);

    const handleAnswer = useCallback(async (answer) => {
        if (peerConnection.current) {
            console.log('[CALL] answer received');
            if (updateDebug) updateDebug({ answerReceived: true });
            
            console.log('Setting remote description (answer)');
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            await flushIceCandidateQueue();
        }
    }, [flushIceCandidateQueue, updateDebug]);

    const endCall = useCallback((emitSocket = true) => {
        console.log('call ended');
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            setLocalStream(null);
            localStreamRef.current = null;
        }
        setRemoteStream(null);
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setIsCallActive(false);
        setStatus('disconnected');
        if (updateDebug) updateDebug({ callState: 'idle', offerSent: false, offerReceived: false, answerSent: false, answerReceived: false, iceCount: 0 });
        
        if (emitSocket && targetId) {
            socketService.emit('end-call', { targetId });
        }
    }, [targetId, setStatus, updateDebug]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, []);

    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            if (peerConnection.current && localStreamRef.current) {
                const senders = peerConnection.current.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');

                if (videoSender) {
                    await videoSender.replaceTrack(screenTrack);
                    setIsScreenSharing(true);
                    
                    const newStream = new MediaStream([screenTrack, localStreamRef.current.getAudioTracks()[0]]);
                    setLocalStream(newStream);
                }

                screenTrack.onended = () => {
                    stopScreenShare();
                };
            }
        } catch (error) {
            console.error("Error starting screen share:", error);
        }
    }, []);

    const stopScreenShare = useCallback(async () => {
        if (peerConnection.current && localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const senders = peerConnection.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');

            if (videoSender && videoTrack) {
                await videoSender.replaceTrack(videoTrack);
                setIsScreenSharing(false);
                setLocalStream(localStreamRef.current);
            }
        }
    }, []);

    // Set incoming offer resolving via ref mechanism
    const processPendingOffer = useCallback((offer) => {
        pendingOfferRef.current = offer;
    }, []);

    useEffect(() => {
        if (isInitiator && targetId && !isCallActive) {
            startCall();
        } else if (!isInitiator && targetId && pendingOfferRef.current && !isCallActive) {
            answerCall(pendingOfferRef.current);
            pendingOfferRef.current = null;
        }
    }, [isInitiator, targetId, isCallActive, startCall, answerCall]);

    useEffect(() => {
        const onAnswer = (answer) => handleAnswer(answer);
        const onIceCandidate = (candidate) => handleIceCandidate(candidate);
        const onRemoteCallEnd = () => endCall(false); // Do not echo back end call
        
        socketService.on('answer', onAnswer);
        socketService.on('ice-candidate', onIceCandidate);
        socketService.on('call-ended', onRemoteCallEnd);

        return () => {
            socketService.off('answer', onAnswer);
            socketService.off('ice-candidate', onIceCandidate);
            socketService.off('call-ended', onRemoteCallEnd);
        };
    }, [handleAnswer, handleIceCandidate, endCall]);

    return {
        localStream,
        remoteStream,
        endCall,
        isCallActive,
        connectionStatus,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        processPendingOffer
    };
};
