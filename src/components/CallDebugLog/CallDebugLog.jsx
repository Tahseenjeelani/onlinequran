import React from 'react';
import { useCall } from '../../context/CallContext';

const CallDebugLog = () => {
    const { debugState } = useCall();
    
    // Inline styling so it doesn't break external CSS setups
    const panelStyle = {
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.85)',
        color: '#00FF00',
        padding: '10px 15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10000,
        pointerEvents: 'none',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '200px'
    };

    return (
        <div style={panelStyle}>
            <div style={{fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px'}}>WebRTC Debug</div>
            <div>Socket Connected: {debugState.socketConnected ? 'true' : 'false'}</div>
            <div>Offer Sent: {debugState.offerSent ? 'Yes' : 'No'}</div>
            <div>Offer Received: {debugState.offerReceived ? 'Yes' : 'No'}</div>
            <div>Answer Sent: {debugState.answerSent ? 'Yes' : 'No'}</div>
            <div>Answer Received: {debugState.answerReceived ? 'Yes' : 'No'}</div>
            <div>ICE Count: {debugState.iceCount}</div>
            <div>Connection State: {debugState.connectionState}</div>
            <div>Call State: {debugState.callState}</div>
        </div>
    );
};

export default CallDebugLog;
