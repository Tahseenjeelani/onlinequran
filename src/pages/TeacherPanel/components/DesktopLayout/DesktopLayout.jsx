// src/pages/TeacherPanel/components/DesktopLayout/DesktopLayout.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import StudentItem from '../StudentItem/StudentItem';
import FileItem from '../FileItem/FileItem';
import MessageInput from '../MessageInput/MessageInput';
import MessageHistory from '../MessageHistory/MessageHistory';
import FileViewer from '../FileViewer/FileViewer';
// TeacherCall removed, using Global Overlay
import { presenceService } from '../../../../services/presenceService';
import { useCall } from '../../../../context/CallContext'; // Import useCall
import GlobalCallOverlay from '../../../../components/GlobalCallOverlay/GlobalCallOverlay';
import styles from './DesktopLayout.module.css';

const DesktopLayout = ({ selectedStudents, onStudentSelect }) => {
  const [students, setStudents] = useState([]);
  const [files, setFiles] = useState([]);
  const [mainSelectedStudent, setMainSelectedStudent] = useState(null);
  const [messageSelectedStudents, setMessageSelectedStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileViewerFullscreen, setIsFileViewerFullscreen] = useState(false);
  const [studentStatus, setStudentStatus] = useState({});

  // Global Call Context
  const { initiateCall, endCurrentCall, isCallActive, targetId, initializeSocket } = useCall();

  useEffect(() => {
    initializeSocket('teacher', 'teacher');
  }, [initializeSocket]);

  // Load students and files
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsData);

        // Fetch files
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const filesData = filesSnapshot.docs.map(doc => {
          const fileData = doc.data();
          return {
            id: doc.id,
            name: fileData.name || 'Unnamed File',
            size: fileData.size || 0,
            uploadedAt: fileData.createdAt || fileData.uploadedAt || new Date(),
            url: fileData.url,
            path: fileData.path,  // ← ADD THIS LINE
            type: fileData.type,   // ← ALSO ADD THIS (important for FileViewer)
            sharedWith: fileData.sharedWith || []
          };
        });
        setFiles(filesData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, []);

  // Listen to student online status
  useEffect(() => {
    const statusUnsubscribes = students.map(student =>
      presenceService.listenToStudentStatus(student.id, (status) => {
        setStudentStatus(prev => ({
          ...prev,
          [student.id]: status
        }));
      })
    );

    return () => {
      statusUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [students]);

  // Real-time messages listener
  useEffect(() => {
    if (messageSelectedStudents.length === 1) {
      const studentId = messageSelectedStudents[0];
      const conversationId = `teacher_${studentId}`;

      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).reverse();

        setMessages(messagesData);

        // Mark student messages as read
        messagesData.forEach(message => {
          if (message.sender !== 'teacher' && (!message.readBy || !message.readBy.teacher)) {
            markMessageAsRead(message.id);
          }
        });
      }, (error) => {
        console.error('Messages listener error:', error);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [messageSelectedStudents]);

  const markMessageAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        'readBy.teacher': new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMainStudentSelect = (studentId) => {
    setMainSelectedStudent(studentId);
    setMessageSelectedStudents([studentId]);
  };

  const handleToggleSession = async () => {
    if (targetId) {
      // End session
      endCurrentCall();
    } else {
      // Start session
      if (mainSelectedStudent) {
        await initiateCall(mainSelectedStudent, 'teacher');
      } else {
        alert('Please select a student first');
      }
    }
  };

  const handleMessageStudentSelect = (studentId) => {
    setMessageSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const toggleFileShare = async (fileId) => {
    if (!mainSelectedStudent) {
      alert('Please select a student first');
      return;
    }

    const fileRef = doc(db, 'files', fileId);
    const file = files.find(f => f.id === fileId);
    const isShared = file.sharedWith?.includes(mainSelectedStudent);

    try {
      await updateDoc(fileRef, {
        sharedWith: isShared
          ? arrayRemove(mainSelectedStudent)
          : arrayUnion(mainSelectedStudent)
      });

      setFiles(files.map(f =>
        f.id === fileId
          ? {
            ...f,
            sharedWith: isShared
              ? f.sharedWith.filter(id => id !== mainSelectedStudent)
              : [...(f.sharedWith || []), mainSelectedStudent]
          }
          : f
      ));
    } catch (error) {
      console.error('Error updating file sharing:', error);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const toggleFileViewerFullscreen = () => {
    setIsFileViewerFullscreen(!isFileViewerFullscreen);
  };

  const handleCloseFileViewer = () => {
    setIsFileViewerFullscreen(false);
  };

  const handleSendMessage = async (text) => {
    if (text.trim() && messageSelectedStudents.length > 0) {
      try {
        const messageData = {
          text: text.trim(),
          sender: 'teacher',
          senderId: 'teacher',
          senderName: 'Teacher',
          recipients: messageSelectedStudents,
          isGroupMessage: messageSelectedStudents.length > 1,
          conversationId: messageSelectedStudents.length === 1 ? `teacher_${messageSelectedStudents[0]}` : `broadcast_${Date.now()}`,
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
    }
  };

  // If in fullscreen mode, only show FileViewer
  if (isFileViewerFullscreen && selectedFile) {
    return (
      <div className={styles.fullscreenContainer}>
        <FileViewer
          file={selectedFile}
          isFullscreen={true}
          onClose={handleCloseFileViewer}
        />
      </div>
    );
  }

  return (
    <div className={styles.desktopLayout}>
      {/* Students List Section */}
      <div className={styles.studentsSection}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Students</h2>
          <div className={styles.panelSubtitle}>
            {mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : 'None selected'}
          </div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.studentsList}>
            {students.map(student => (
              <StudentItem
                key={student.id}
                student={student}
                isSelected={mainSelectedStudent === student.id}
                onClick={() => handleMainStudentSelect(student.id)}
                showName={true}
                status={studentStatus[student.id]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live Session Section */}
      <div className={styles.liveSessionSection}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Live Session</h2>
          <div className={styles.panelSubtitle}>
            {targetId ? 'Call Active (See Overlay)' : 'Ready to start'}
          </div>
        </div>
        <div className={styles.panelContent} style={{ padding: targetId ? '0' : '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {targetId ? (
            <div style={{ flex: 1, position: 'relative', width: '100%' }}>
              <GlobalCallOverlay />
            </div>
          ) : (
            <div className={styles.sessionControls}>
              <button
                className={`${styles.sessionButton} ${mainSelectedStudent
                    ? styles.startSession
                    : styles.disabledSession
                  }`}
                onClick={handleToggleSession}
                disabled={!mainSelectedStudent}
              >
                Start Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File View Section */}
      <div className={styles.fileViewSection}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {selectedFile ? `File Viewer - ${selectedFile.name.replace(/\.[^/.]+$/, "")}` : 'File Viewer'}
          </h2>
          {selectedFile && (
            <button
              onClick={toggleFileViewerFullscreen}
              className={styles.fullscreenButton}
              title="Enter Fullscreen"
            >
              <i className="ri-fullscreen-line"></i>
            </button>
          )}
        </div>
        <div className={styles.panelContent}>
          {selectedFile ? (
            <FileViewer
              file={selectedFile}
              isFullscreen={false}
              onClose={() => setSelectedFile(null)}
            />
          ) : (
            <div className={styles.noFileSelected}>
              <i className="ri-file-line text-4xl mb-2 text-gray-400"></i>
              <p className="text-gray-400">Click on a file to view it here</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Section */}
      <div className={styles.messagesSection}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Messages</h2>
          <div className={styles.panelSubtitle}>
            {messageSelectedStudents.length > 0
              ? messageSelectedStudents.map(id => students.find(s => s.id === id)?.name).join(', ')
              : 'None selected'}
          </div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.messageHistory}>
            <MessageHistory
              messages={messages}
              students={students}
            />
          </div>
          <MessageInput
            students={students}
            selectedStudents={messageSelectedStudents}
            onStudentSelect={handleMessageStudentSelect}
            onSend={handleSendMessage}
          />
        </div>
      </div>

      {/* Files Section */}
      <div className={styles.filesSection}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Files</h2>
          <div className={styles.panelSubtitle}>
            {mainSelectedStudent
              ? `Shared with ${students.find(s => s.id === mainSelectedStudent)?.name}`
              : 'All Files - Select student to share'}
          </div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.filesGridContainer}>
            {files.length > 0 ? (
              <div className={styles.filesGrid}>
                {files.map(file => (
                  <div key={file.id} className={styles.fileCard}>
                    <FileItem
                      file={file}
                      onShare={() => toggleFileShare(file.id)}
                      isShared={mainSelectedStudent && file.sharedWith?.includes(mainSelectedStudent)}
                      onClick={() => handleFileSelect(file)}
                      showShareButton={!!mainSelectedStudent}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noFiles}>
                <p className="text-gray-400 mb-2">No files found</p>
                <p className="text-gray-500 text-sm">Upload files in File Management</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;