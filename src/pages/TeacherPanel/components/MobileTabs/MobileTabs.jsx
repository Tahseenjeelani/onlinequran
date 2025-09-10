import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../firebase';
import StudentItem from '../StudentItem/StudentItem';
import FileItem from '../FileItem/FileItem';
import MessageInput from '../MessageInput/MessageInput';
import MessageHistory from '../MessageHistory/MessageHistory';
import FooterTabs from './FooterTabs';
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

  // Load students and files
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        setStudents(studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));

        // Fetch files
        const filesSnapshot = await getDocs(collection(db, 'teacher-files'));
        setFiles(filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
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

  const handleMessageStudentSelect = (studentId) => {
    setMessageSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
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
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'teacher',
        timestamp: new Date(),
        recipients: [...messageSelectedStudents]
      }]);
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

  const filteredMessages = messageSelectedStudents.length === 1 
    ? messages.filter(msg => (
        msg.sender === messageSelectedStudents[0] || 
        (msg.sender === 'teacher' && msg.recipients.includes(messageSelectedStudents[0]))
      ))
    : [];

  const renderSectionHeader = (title, selectedName) => (
    <div className="flex items-center justify-between mb-4 px-4 pt-4">
      <h2 className="text-white text-heading">{title}</h2>
      <div className="text-white font-medium">{selectedName || 'None selected'}</div>
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
            <div className="space-y-1 px-4 text-small">
              {students.map(student => (
                <StudentItem
                  key={student.id}
                  student={student}
                  isSelected={mainSelectedStudent === student.id}
                  onClick={() => handleMainStudentSelect(student.id)}
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
          sessionStudent ? `${students.find(s => s.id === sessionStudent)?.name}${isLiveSessionActive ? ' (Active)' : ''}` : null
        )}
        <div className={`${styles.mobileContent} ${styles.conferenceContent}`}>
          <div className="w-full px-4">
            <p className="text-white text-subheading text-center">Jitsi Meet Conference will load here</p>
            <div className="flex justify-center mt-4">
              <button 
                className={`px-4 py-2 rounded ${
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
          <div className={styles.mobileMessagesContainer} style={{ height: 'calc(100% - 80px)' }}>
            <div className="px-4">
              <MessageHistory messages={filteredMessages} students={students} />
            </div>
          </div>
          <div className={styles.messageInputWrapper}>
            <MessageInput 
              students={students}
              selectedStudents={messageSelectedStudents}
              onStudentSelect={handleMessageStudentSelect}
              onSend={handleSendMessage}
              isMobile
            />
          </div>
        </div>
      </div>
      
      {/* Files Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}>
        {renderSectionHeader(
          'Files',
          mainSelectedStudent ? students.find(s => s.id === mainSelectedStudent)?.name : null
        )}
        <div className={`${styles.mobileContent} ${styles.filesContent}`}>
          <div className="px-4">
            <div className={styles.filesGrid}>
              {files.map(file => (
                <FileItem 
                  key={file.id}
                  name={file.name}
                  isShared={mainSelectedStudent && file.sharedWith?.includes(mainSelectedStudent)}
                  onShare={() => toggleFileShare(file.id)}
                  onClick={() => window.open(file.url, '_blank')}
                  isMobile
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <FooterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MobileTabs;