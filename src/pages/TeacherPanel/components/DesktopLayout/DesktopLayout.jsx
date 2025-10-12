import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, storage } from '../../../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import StudentItem from '../StudentItem/StudentItem';
import FileItem from '../FileItem/FileItem';
import MessageInput from '../MessageInput/MessageInput';
import MessageHistory from '../MessageHistory/MessageHistory';
import styles from './DesktopLayout.module.css';

const DesktopLayout = () => {
  const [students, setStudents] = useState([]);
  const [files, setFiles] = useState([]);
  const [mainSelectedStudent, setMainSelectedStudent] = useState(null);
  const [sessionStudent, setSessionStudent] = useState(null);
  const [messageSelectedStudents, setMessageSelectedStudents] = useState([]);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [messages, setMessages] = useState([]);

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

  // Real-time messages listener - FIXED
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

  // Rest of your existing functions remain the same...
  const handleMainStudentSelect = (studentId) => {
    setMainSelectedStudent(studentId);
    setMessageSelectedStudents([studentId]);
    if (!isLiveSessionActive) {
      setSessionStudent(studentId);
    }
  };

  const handleToggleSession = () => {
    if (isLiveSessionActive) {
      setIsLiveSessionActive(false);
    } else {
      if (mainSelectedStudent) {
        setSessionStudent(mainSelectedStudent);
        setIsLiveSessionActive(true);
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

  return (
    <div className={styles.desktopLayout}>
      {/* Students List Section */}
      <div className={`${styles.studentsSection} panel-section p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Students</h2>
          <div className="text-white text-sm truncate max-w-[120px]">
            {mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : 'None selected'}
          </div>
        </div>
        <div className={`${styles.studentsList} overflow-y-auto`}>
          <div className="space-y-1 pr-2">
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
      
      {/* Conference Section */}
      <div className={`${styles.conferenceSection} panel-section p-4 ${isLiveSessionActive ? styles.disabledPanel : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Live Session</h2>
          <div className="text-white text-sm">
            {sessionStudent ? students.find(s => s.id === sessionStudent)?.name : 'None selected'}
            {isLiveSessionActive && ' (Active)'}
          </div>
        </div>
        <div className={styles.conferenceContent}>
          <p className="text-white text-center">Jitsi Meet Conference will load here</p>
          <button 
            className={`mt-2 px-4 py-2 rounded text-sm ${
              isLiveSessionActive 
                ? 'bg-red-500' 
                : mainSelectedStudent 
                  ? 'bg-green-500' 
                  : 'bg-gray-500 cursor-not-allowed'
            } text-white`}
            onClick={handleToggleSession}
            disabled={!isLiveSessionActive && !mainSelectedStudent}
          >
            {isLiveSessionActive ? 'End Session' : 'Start Session'}
          </button>
        </div>
      </div>
      
      {/* Messages Section */}
      <div className={`${styles.messagesSection} panel-section p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-base font-bold">Messages</h2>
          <div className="text-white text-xs">
            {messageSelectedStudents.length > 0 
              ? messageSelectedStudents.map(id => students.find(s => s.id === id)?.name).join(', ')
              : 'None selected'}
          </div>
        </div>
        <div className={styles.messagesContent}>
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
      
      {/* Files Section */}
      <div className={`${styles.filesSection} panel-section p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Files</h2>
          <div className="text-white text-sm">
            {mainSelectedStudent 
              ? `Shared with ${students.find(s => s.id === mainSelectedStudent)?.name}` 
              : 'All Files - Select student to share'}
          </div>
        </div>
        <div className={`${styles.filesGridContainer} overflow-y-auto`}>
          {files.length > 0 ? (
            <div className={styles.filesGrid}>
              {files.map(file => (
                <div key={file.id} className={styles.fileCard}>
                  <FileItem 
                    file={file}
                    onShare={() => toggleFileShare(file.id)}
                    isShared={mainSelectedStudent && file.sharedWith?.includes(mainSelectedStudent)}
                    onClick={downloadAndOpenFile}
                    showShareButton={!!mainSelectedStudent}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No files found</p>
              <p className="text-gray-500 text-sm">Upload files in File Management</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;