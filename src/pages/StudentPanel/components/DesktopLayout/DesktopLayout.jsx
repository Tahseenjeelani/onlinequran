// src/pages/StudentPanel/components/DesktopLayout/DesktopLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import MessageInput from '../MessageInput/MessageInput';
import StudentFileItem from '../StudentFileItem/StudentFileItem';
import MessageHistory from '../MessageHistory/MessageHistory';
import FileViewer from '../FileViewer/FileViewer';
import StudentCall from '../../../../components/StudentCall/StudentCall';
import CallNotification from '../../../../components/CallNotification/CallNotification';
import { callService } from '../../../../services/callService';
import { notificationService } from '../../../../services/notificationService';
import { presenceService } from '../../../../services/presenceService';
import styles from './DesktopLayout.module.css';

const DesktopLayout = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [isFileViewerFullscreen, setIsFileViewerFullscreen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomName, setCallRoomName] = useState(null);

  useEffect(() => {
    const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));
    if (!currentStudent) {
      navigate('/student-login');
      return;
    }
    setStudent(currentStudent);

    // Update online status
    presenceService.updateStudentStatus(currentStudent.id, 'online');

    // Load files shared with this student
    const filesQuery = query(
      collection(db, 'files'),
      where('sharedWith', 'array-contains', currentStudent.id)
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFiles(filesData);
    });

    // Load messages for this student
    const conversationId = `teacher_${currentStudent.id}`;
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      setMessages(messagesData);
    });

    return () => {
      unsubscribeFiles();
      unsubscribeMessages();
      // Update offline status when leaving
      if (currentStudent) {
        presenceService.updateStudentStatus(currentStudent.id, 'offline');
      }
    };
  }, [navigate]);

  // Listen for incoming calls
  useEffect(() => {
    if (!student) return;

    const unsubscribe = callService.listenForCalls(student.id, (call) => {
      setIncomingCall(call);
      setCallRoomName(call.roomName);
      
      // Add notification to messages
      notificationService.addCallNotification(student.id, 'initiated', call.callId, call.roomName);
    });

    return () => unsubscribe();
  }, [student]);

  const handleAnswerCall = async () => {
    if (incomingCall) {
      await callService.answerCall(incomingCall.callId);
      setIsInCall(true);
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      await callService.markMissedCall(incomingCall.callId);
      notificationService.addCallNotification(student.id, 'missed', incomingCall.callId);
      setIncomingCall(null);
      setCallRoomName(null);
    }
  };

  const handleCallEnd = () => {
    setIsInCall(false);
    setCallRoomName(null);
  };

  const handleFileClick = (file) => {
    setCurrentFile(file);
  };

  const handleSendMessage = async (text) => {
    if (!student || !text.trim()) return;

    try {
      const messageData = {
        text: text.trim(),
        sender: student.id,
        senderId: student.id,
        senderName: student.name,
        recipients: ['teacher'],
        isGroupMessage: false,
        conversationId: `teacher_${student.id}`,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        readBy: {},
        deliveredTo: []
      };

      await addDoc(collection(db, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleFileViewerFullscreen = () => {
    setIsFileViewerFullscreen(!isFileViewerFullscreen);
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`${styles.desktopLayout} ${isFileViewerFullscreen ? styles.fullscreen : ''}`}>
      {/* Live Session - Top Left */}
      <div className={styles.liveSession}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Live Session</h2>
          <div className={styles.panelSubtitle}>
            {isInCall ? 'In Call' : 'Waiting for teacher'}
          </div>
        </div>
        <div className={styles.panelContent}>
          <StudentCall 
            studentId={student.id}
            roomName={callRoomName}
            onCallStart={() => setIsInCall(true)}
            onCallEnd={handleCallEnd}
          />
        </div>
        
        {/* Incoming Call Notification */}
        {incomingCall && !isInCall && (
          <CallNotification 
            call={incomingCall}
            onAnswer={handleAnswerCall}
            onDecline={handleDeclineCall}
          />
        )}
      </div>
      
      {/* Messages - Bottom Left */}
      <div className={styles.messages}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Messages</h2>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.messageHistory}>
            <MessageHistory messages={messages} students={[student]} />
          </div>
          <MessageInput onSend={handleSendMessage} />
        </div>
      </div>
      
      {/* Learning Materials - Bottom Right */}
      <div className={styles.learningMaterials}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Learning Materials</h2>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.filesGrid}>
            {files.map(file => (
              <StudentFileItem
                key={file.id}
                file={file}
                onClick={handleFileClick}
              />
            ))}
            {files.length === 0 && (
              <p className="text-gray-400 text-center py-8 col-span-6">No files shared with you yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* File Viewer - Top Right */}
      <div className={styles.fileViewer}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {currentFile ? `File Viewer - ${currentFile.name.replace(/\.[^/.]+$/, "")}` : 'File Viewer'}
          </h2>
          {currentFile && (
            <button 
              onClick={toggleFileViewerFullscreen}
              className={styles.fullscreenButton}
              title={isFileViewerFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <i className={`ri-${isFileViewerFullscreen ? 'shrink-screen' : 'fullscreen-line'}`}></i>
            </button>
          )}
        </div>
        <div className={styles.panelContent}>
          {currentFile ? (
            <FileViewer 
              file={currentFile} 
              isFullscreen={isFileViewerFullscreen}
              onClose={toggleFileViewerFullscreen}
            />
          ) : (
            <div className={styles.noFileSelected}>
              <i className="ri-file-line text-4xl mb-2 text-gray-400"></i>
              <p className="text-gray-400">Click on a file to view it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;