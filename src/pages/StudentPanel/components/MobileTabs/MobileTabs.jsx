import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import FileItem from '../../../TeacherPanel/components/FileItem/FileItem';
import MessageHistory from '../MessageHistory/MessageHistory'; // Student version
import MessageInput from '../MessageInput/MessageInput';
import FooterTabs from './FooterTabs';
import styles from './MobileTabs.module.css';

const MobileTabs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('files');
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
    <div className={styles.mobileTabs}>
      {/* Files Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}>
        <div className={styles.panelSection}>
          <h2 className={styles.sectionTitle}>Learning Materials</h2>
          <div className={styles.mobileContent}>
            <div className="space-y-2">
              {files.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  onClick={downloadAndOpenFile}
                  showShareButton={false}
                  showSize={false}
                  showExtension={false}
                />
              ))}
              {files.length === 0 && (
                <p className="text-gray-400 text-center py-8">No files shared with you yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'messages' ? styles.active : ''}`}>
        <div className={styles.panelSection}>
          <h2 className={styles.sectionTitle}>Messages</h2>
          <div className={styles.mobileContent}>
            <div className={styles.messagesContainer}>
              <MessageHistory messages={messages} students={[student]} />
              <MessageInput onSend={handleSendMessage} isMobile={true} />
            </div>
          </div>
        </div>
      </div>
      
      <FooterTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default MobileTabs;