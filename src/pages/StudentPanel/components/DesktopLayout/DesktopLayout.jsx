import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import PanelSection from '../PanelSection/PanelSection';
import MessageInput from '../MessageInput/MessageInput';
import StudentFileItem from '../StudentFileItem/StudentFileItem'; // Student version
import MessageHistory from '../MessageHistory/MessageHistory';
import styles from './DesktopLayout.module.css';

const DesktopLayout = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));
    if (!currentStudent) {
      navigate('/student-login');
      return;
    }
    setStudent(currentStudent);

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
    };
  }, [navigate]);

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

  const downloadAndOpenFile = async (file) => {
    try {
      if (file.url) {
        window.open(file.url, '_blank');
      } else {
        alert(`Unable to open file "${file.name}". No valid download link.`);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.desktopLayout}>
      {/* Conference Section */}
      <PanelSection title="Live Session" className={styles.conferencePanel}>
        <div className={styles.conferenceContent}>
          <p className="text-white text-subheading">Jitsi Meet Conference will load here</p>
        </div>
      </PanelSection>
      
      {/* Messages Section */}
      <PanelSection title="Messages" className={styles.messagesPanel}>
        <div className={styles.messagesContent}>
          <div className={styles.messageHistory}>
            <MessageHistory messages={messages} students={[student]} />
          </div>
          <MessageInput onSend={handleSendMessage} />
        </div>
      </PanelSection>
      
      {/* Files Section */}
      <PanelSection title="Learning Materials" className={styles.filesPanel}>
        <div className={styles.filesGrid}>
          {files.map(file => (
            <StudentFileItem
              key={file.id}
              file={file}
              onClick={downloadAndOpenFile}
            />
          ))}
          {files.length === 0 && (
            <p className="text-gray-400 text-center py-8 col-span-5">No files shared with you yet.</p>
          )}
        </div>
      </PanelSection>
    </div>
  );
};

export default DesktopLayout;