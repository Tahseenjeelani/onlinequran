import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../firebase';
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

        // Fetch files - Enhanced to handle different Firebase structures
        const filesSnapshot = await getDocs(collection(db, 'teacher-files'));
        console.log('Files from Firebase:', filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const filesData = filesSnapshot.docs.map(doc => {
          const fileData = doc.data();
          console.log('Processing file:', fileData);
          
          // Handle different possible field names in Firebase
          return {
            id: doc.id,
            name: fileData.name || fileData.fileName || fileData.filename || 'Unnamed File',
            size: fileData.size || fileData.fileSize || 0,
            uploadedAt: fileData.uploadedAt || fileData.createdAt || fileData.timestamp || new Date(),
            url: fileData.url || fileData.downloadURL || fileData.fileUrl,
            sharedWith: fileData.sharedWith || fileData.sharedTo || []
          };
        });
        
        console.log('Processed files:', filesData);
        setFiles(filesData);
      } catch (error) {
        console.error("Error loading data:", error);
        
        // Fallback sample data if Firebase fails
        const sampleFiles = [
          {
            id: '1',
            name: 'Quran_Study_Guide.pdf',
            size: 2.4,
            uploadedAt: '2024-01-15',
            url: '#',
            sharedWith: []
          }
        ];
        setFiles(sampleFiles);
      }
    };

    fetchData();
  }, []);

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
      console.log('No student selected for sharing');
      return;
    }
    
    const fileRef = doc(db, 'teacher-files', fileId);
    const file = files.find(f => f.id === fileId);
    const isShared = file.sharedWith?.includes(mainSelectedStudent);

    console.log(`Toggling share for file ${fileId} with student ${mainSelectedStudent}, currently shared: ${isShared}`);

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
      
      console.log(`File ${fileId} share status updated successfully`);
    } catch (error) {
      console.error('Error updating file sharing:', error);
    }
  };

  const handleFileClick = (file) => {
    console.log('File clicked:', file);
    if (file.url && file.url !== '#') {
      window.open(file.url, '_blank');
    } else {
      console.warn('No valid URL for file:', file.name);
      // You can add a fallback behavior here, like showing a message
      alert(`File "${file.name}" doesn't have a valid download link.`);
    }
  };

  const handleSendMessage = (text) => {
    if (text.trim() && messageSelectedStudents.length > 0) {
      const newMessage = {
        id: Date.now(),
        text,
        sender: 'teacher',
        timestamp: new Date(),
        recipients: [...messageSelectedStudents]
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const filteredMessages = messageSelectedStudents.length === 1 
    ? messages.filter(msg => (
        msg.sender === messageSelectedStudents[0] || 
        (msg.sender === 'teacher' && msg.recipients.includes(messageSelectedStudents[0]))
      ))
    : [];

  return (
    <div className={styles.desktopLayout}>
      {/* Students List Section - Fixed */}
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
            messages={filteredMessages} 
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
      
      {/* Files Section - Updated with proper FileItem integration */}
      <div className={`${styles.filesSection} panel-section p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Files</h2>
          <div className="text-white text-sm">
            {mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : 'None selected'}
          </div>
        </div>
        <div className={`${styles.filesList} overflow-y-auto`}>
          <div className="space-y-2 pr-2">
            {files.length > 0 ? (
              files.map(file => (
                <FileItem 
                  key={file.id}
                  file={file}
                  onShare={() => toggleFileShare(file.id)}
                  isShared={mainSelectedStudent && file.sharedWith?.includes(mainSelectedStudent)}
                  onClick={() => handleFileClick(file)}
                />
              ))
            ) : (
              <div className="text-center py-8">
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