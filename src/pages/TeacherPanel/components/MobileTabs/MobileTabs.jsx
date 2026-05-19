import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, storage } from '../../../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import StudentItem from '../StudentItem/StudentItem';
import FileItem from '../FileItem/FileItem';
import MessageInput from '../MessageInput/MessageInput';
import MessageHistory from '../MessageHistory/MessageHistory';
import FileViewer from '../FileViewer/FileViewer';
import FooterTabs from './FooterTabs';
import { useCall } from '../../../../context/CallContext';
import GlobalCallOverlay from '../../../../components/GlobalCallOverlay/GlobalCallOverlay';
import styles from './MobileTabs.module.css';

const MobileTabs = () => {
  const [activeTab, setActiveTab] = useState('conference');
  const [students, setStudents] = useState([]);
  const [files, setFiles] = useState([]);
  const [mainSelectedStudent, setMainSelectedStudent] = useState(null);
  const [sessionStudent, setSessionStudent] = useState(null);
  const [messageSelectedStudents, setMessageSelectedStudents] = useState([]);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileViewerFullscreen, setIsFileViewerFullscreen] = useState(false);

  const { initiateCall, endCurrentCall, targetId, initializeSocket } = useCall();

  // Load students and files
  useEffect(() => {
    initializeSocket('teacher', 'teacher');
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
        console.error("Error loading mobile data:", error);
      }
    };
    fetchData();
  }, []);

  // Real-time messages listener for mobile - FIXED
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
        })).reverse(); // Reverse to show latest at bottom
        
        setMessages(messagesData);
        
        // Mark student messages as read
        messagesData.forEach(message => {
          if (message.sender !== 'teacher' && (!message.readBy || !message.readBy.teacher)) {
            markMessageAsRead(message.id);
          }
        });
      }, (error) => {
        console.error('Mobile messages listener error:', error);
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

  // File selection handler
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setActiveTab('fileviewer'); // Automatically switch to file viewer tab
  };

  const handleCloseFileViewer = () => {
    setSelectedFile(null);
    setActiveTab('files'); // Switch back to files tab
  };

  const toggleFileViewerFullscreen = () => {
    setIsFileViewerFullscreen(!isFileViewerFullscreen);
  };

  // If in fullscreen mode, only show FileViewer
  if (isFileViewerFullscreen && selectedFile) {
    return (
      <div className={styles.fullscreenContainer}>
        <FileViewer 
          file={selectedFile} 
          isFullscreen={true}
          onClose={() => {
            setIsFileViewerFullscreen(false);
            handleCloseFileViewer();
          }}
          isMobile={true}
        />
      </div>
    );
  }

  // Rest of your existing functions...
  const handleMainStudentSelect = (studentId) => {
    setMainSelectedStudent(studentId);
    setMessageSelectedStudents([studentId]);
    if (!isLiveSessionActive) {
      setSessionStudent(studentId);
    }
  };

  const handleMessageStudentSelect = (studentId) => {
    setMessageSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
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

  const downloadAndOpenFile = async (file) => {
    try {
      if (file.url) {
        const link = document.createElement('a');
        link.href = file.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = file.name;
        window.open(file.url, '_blank');
        link.click();
      } else {
        alert(`Unable to open file "${file.name}". No valid download link.`);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Error opening file: ${error.message}`);
    }
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

  const handleToggleSession = async () => {
    if (targetId) {
      endCurrentCall();
    } else {
      if (mainSelectedStudent) {
        setSessionStudent(mainSelectedStudent);
        await initiateCall(mainSelectedStudent, 'teacher');
      }
    }
  };

  const renderSectionHeader = (title, selectedName) => (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionSubtitle}>
        {selectedName || 'None selected'}
      </div>
    </div>
  );

  return (
    <div className={styles.mobileTabs}>
      {/* Students Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'students' ? styles.active : ''}`}>
        {renderSectionHeader(
          'Students',
          mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : null
        )}
        <div className={styles.mobileContent}>
          <div className={styles.mobileStudentsList}>
            <div className={styles.studentsContainer}>
              {students.map(student => (
                <StudentItem
                  key={student.id}
                  student={student}
                  isSelected={mainSelectedStudent === student.id}
                  onClick={() => handleMainStudentSelect(student.id)}
                  showName={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Conference Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'conference' ? styles.active : ''}`}>
        {renderSectionHeader(
          'Live Session',
          sessionStudent ? `${students.find(s => s.id === sessionStudent)?.name}${targetId ? ' (Active)' : ''}` : null
        )}
        <div className={`${styles.mobileContent} ${styles.conferenceContent}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: targetId ? 0 : '16px' }}>
          {targetId ? (
            <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '300px' }}>
              <GlobalCallOverlay />
            </div>
          ) : (
            <div className={styles.conferenceContainer}>
              <p className={styles.conferenceText}>Ready to start</p>
              <div className={styles.conferenceButtonContainer}>
                <button 
                  className={`${styles.conferenceButton} ${
                    targetId 
                      ? styles.endSession 
                      : mainSelectedStudent 
                        ? styles.startSession 
                        : styles.disabledSession
                  }`}
                  onClick={handleToggleSession}
                  disabled={!targetId && !mainSelectedStudent}
                >
                  {targetId ? 'End Session' : 'Start Session'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Messages Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'messages' ? styles.active : ''}`}>
        {renderSectionHeader(
          'Messages',
          messageSelectedStudents.length > 0 
            ? messageSelectedStudents.map(id => students.find(s => s.id === id)?.name).join(', ')
            : null
        )}
        <div className={styles.mobileContent}>
          <div className={styles.mobileMessagesContainer}>
            <div className={styles.messagesHistory}>
              <MessageHistory messages={messages} students={students} />
            </div>
          </div>
          <div className={styles.messageInputWrapper}>
            <MessageInput 
              students={students}
              selectedStudents={messageSelectedStudents}
              onStudentSelect={handleMessageStudentSelect}
              onSend={handleSendMessage}
              isMobile={true}
            />
          </div>
        </div>
      </div>
      
      {/* Files Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}>
        {renderSectionHeader(
          'Files',
          mainSelectedStudent 
            ? `${students.find(s => s.id === mainSelectedStudent)?.name}`
            : 'All Files - Select student to share'
        )}
        <div className={`${styles.mobileContent} ${styles.filesContent}`}>
          <div className={styles.filesContainer}>
            {files.length > 0 ? (
              <div className={styles.filesGrid}>
                {files.map(file => (
                  <div key={file.id} className={styles.mobileFileCard}>
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
                <p className={styles.noFilesText}>No files found</p>
                <p className={styles.noFilesSubtext}>Upload files in File Management</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Viewer Tab - Only shows when a file is selected */}
      {selectedFile && (
        <div className={`${styles.mobileTab} ${activeTab === 'fileviewer' ? styles.active : ''}`}>
          <div className={styles.fileViewerHeader}>
            <h2 className={styles.fileViewerTitle}>
              {selectedFile.name.replace(/\.[^/.]+$/, "").substring(0, 20)}
              {selectedFile.name.length > 20 ? '...' : ''}
            </h2>
            <button 
              onClick={toggleFileViewerFullscreen}
              className={styles.fullscreenButton}
              title="Enter Fullscreen"
            >
              <i className="ri-fullscreen-line"></i>
            </button>
          </div>
          <div className={styles.mobileContent}>
            <div className={styles.fileViewerContent}>
              <FileViewer 
                file={selectedFile} 
                isFullscreen={false}
                onClose={handleCloseFileViewer}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}
      
      <FooterTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedFile={selectedFile} 
      />
    </div>
  );
};

export default MobileTabs;