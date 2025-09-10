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

        // Fetch files
        const filesSnapshot = await getDocs(collection(db, 'teacher-files'));
        const filesData = filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFiles(filesData);
      } catch (error) {
        console.error("Error loading data:", error);
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
    if (!mainSelectedStudent) return;
    
    const fileRef = doc(db, 'teacher-files', fileId);
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
        <div className="flex items-center justify-between mb-4"> {/* Reduced margin-bottom */}
          <h2 className="text-white text-lg font-bold">Students</h2>
          <div className="text-white text-sm truncate max-w-[120px]"> {/* Added truncate */}
            {mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : 'None selected'}
          </div>
        </div>
        <div className={`${styles.studentsList} overflow-y-auto`}> {/* Added scrollable class */}
          <div className="space-y-1 pr-2"> {/* Added right padding for scrollbar */}
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
      
      {/* Files Section */}
      <div className={`${styles.filesSection} panel-section p-4`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-white text-lg font-bold">Files</h2>
          <div className="text-white text-sm">
            {mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : 'None selected'}
          </div>
        </div>
        <div className={`${styles.filesGrid} overflow-y-auto max-h-[200px]`}>
          {files.map(file => (
            <FileItem 
              key={file.id}
              name={file.name}
              isShared={mainSelectedStudent && file.sharedWith?.includes(mainSelectedStudent)}
              onShare={() => toggleFileShare(file.id)}
              onClick={() => window.open(file.url, '_blank')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;