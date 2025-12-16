import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../firebase'; 
import StudentItem from '../StudentItem/StudentItem';
import FileItem from '../FileItem/FileItem';
import MessageInput from '../MessageInput/MessageInput';
import MessageHistory from '../MessageHistory/MessageHistory';
import FileViewer from '../FileViewer/FileViewer';
import TeacherCall from '../../../../components/TeacherCall/TeacherCall';
import { callService } from '../../../../services/callService';
import { presenceService } from '../../../../services/presenceService';
import styles from './DesktopLayout.module.css';

const DesktopLayout = ({ selectedStudents, onStudentSelect }) => {
  const [students, setStudents] = useState([]);
  const [files, setFiles] = useState([]);
  const [mainSelectedStudent, setMainSelectedStudent] = useState(null);
  const [sessionStudent, setSessionStudent] = useState(null);
  const [messageSelectedStudents, setMessageSelectedStudents] = useState([]);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileViewerFullscreen, setIsFileViewerFullscreen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [callRoomName, setCallRoomName] = useState(null);
  const [studentStatus, setStudentStatus] = useState({});

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

  // Listen for active calls
  useEffect(() => {
    const unsubscribe = callService.listenForActiveCalls('teacher', (calls) => {
      if (calls.length > 0) {
        setActiveCall(calls[0]);
      } else {
        setActiveCall(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
    if (!isLiveSessionActive) {
      setSessionStudent(studentId);
    }
  };

const handleToggleSession = async () => {
  if (isLiveSessionActive) {
    // End session
    if (activeCall) {
      await callService.endCall(activeCall.id, 0);
    }
    setIsLiveSessionActive(false);
    setCallRoomName(null);
    setActiveCall(null);
  } else {
    // Start session
    if (mainSelectedStudent) {
      try {
        const student = students.find(s => s.id === mainSelectedStudent);
        console.log('Starting session with:', student?.name);
        
        const call = await callService.initiateCall(mainSelectedStudent, 'teacher');
        console.log('Created call with room:', call.roomName);
        
        setCallRoomName(call.roomName);
        setIsLiveSessionActive(true);
        setSessionStudent(mainSelectedStudent);
        
        // Force re-render of TeacherCall component
        setTimeout(() => {
          // This ensures the room name is passed to Jitsi
        }, 100);
      } catch (error) {
        console.error('Error starting call:', error);
        alert('Failed to start session. Error: ' + error.message);
      }
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
        
        // Update delivered status immediately for better UX
        setTimeout(async () => {
          try {
            const messagesSnapshot = await getDocs(query(
              collection(db, 'messages'), 
              where('text', '==', text.trim()),
              where('sender', '==', 'teacher'),
              orderBy('timestamp', 'desc'),
              limit(1)
            ));
            
            if (!messagesSnapshot.empty) {
              const latestDoc = messagesSnapshot.docs[0];
              await updateDoc(doc(db, 'messages', latestDoc.id), {
                status: 'delivered',
                deliveredTo: messageSelectedStudents
              });
            }
          } catch (error) {
            console.error('Error updating delivery status:', error);
          }
        }, 500);

      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
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
      <div className={`${styles.liveSessionSection} ${isLiveSessionActive ? styles.disabledPanel : ''}`}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Live Session</h2>
          <div className={styles.panelSubtitle}>
            {sessionStudent ? students.find(s => s.id === sessionStudent)?.name : 'None selected'}
            {isLiveSessionActive && ' (Active)'}
          </div>
        </div>
        <div className={styles.panelContent}>
          <TeacherCall 
            student={sessionStudent ? students.find(s => s.id === sessionStudent) : null}
            roomName={callRoomName}
            onCallEnd={() => {
              setIsLiveSessionActive(false);
              setCallRoomName(null);
              setActiveCall(null);
             
            }}
            currentFile={selectedFile}
          />
          {!isLiveSessionActive && (
            <div className={styles.sessionControls}>
              <button 
                className={`${styles.sessionButton} ${
                  mainSelectedStudent 
                    ? styles.startSession 
                    : styles.disabledSession
                }`}
                onClick={handleToggleSession}
                disabled={!mainSelectedStudent}
              >
                {isLiveSessionActive ? 'End Session' : 'Start Session'}
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