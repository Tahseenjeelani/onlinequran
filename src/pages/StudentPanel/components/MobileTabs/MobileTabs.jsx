import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import StudentFileItem from '../StudentFileItem/StudentFileItem';
import MessageHistory from '../MessageHistory/MessageHistory';
import MessageInput from '../MessageInput/MessageInput';
import FileViewer from '../FileViewer/FileViewer';
import FooterTabs from './FooterTabs';
import styles from './MobileTabs.module.css';

const MobileTabs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('conference');
  const [student, setStudent] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

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

  const handleFileClick = async (file) => {
    setCurrentFile(file);
    setActiveTab('fileViewer');
    
    // Check if file exists locally first
    const isAvailableLocally = await checkLocalFile(file);
    if (!isAvailableLocally) {
      // Download file in background
      downloadFileToLocal(file);
    }
  };

  const checkLocalFile = async (file) => {
    try {
      const localFileKey = `local_file_${file.id}`;
      const localFileData = localStorage.getItem(localFileKey);
      
      if (localFileData) {
        const fileInfo = JSON.parse(localFileData);
        const fileAge = Date.now() - fileInfo.downloadedAt;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        return fileAge < maxAge;
      }
      return false;
    } catch (error) {
      console.error('Error checking local file:', error);
      return false;
    }
  };

  const downloadFileToLocal = async (file) => {
    try {
      const localFileKey = `local_file_${file.id}`;
      const fileInfo = {
        id: file.id,
        name: file.name,
        url: file.url,
        downloadedAt: Date.now(),
        localPath: `/local-files/${file.id}_${file.name}`
      };
      
      localStorage.setItem(localFileKey, JSON.stringify(fileInfo));
      console.log(`File ${file.name} cached locally`);
    } catch (error) {
      console.error('Error downloading file locally:', error);
    }
  };

  const getFileUrl = (file) => {
    const localFileKey = `local_file_${file.id}`;
    const localFileData = localStorage.getItem(localFileKey);
    
    if (localFileData) {
      const fileInfo = JSON.parse(localFileData);
      return fileInfo.url;
    }
    
    return file.url;
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

  if (!student) {
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
  }

  return (
    <div className={styles.mobileTabs}>
      {/* Conference Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'conference' ? styles.active : ''}`}>
        <div className={styles.panelSection}>
          <h2 className={styles.sectionTitle}>Live Session</h2>
          <div className={styles.mobileContent}>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-white text-center mb-4">Jitsi Meet Conference will load here</p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg">
                Join Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}>
        <div className={styles.panelSection}>
          <h2 className={styles.sectionTitle}>Learning Materials</h2>
          <div className={styles.mobileContent}>
            <div className="space-y-2">
              {files.map(file => (
                <StudentFileItem
                  key={file.id}
                  file={file}
                  onClick={handleFileClick}
                />
              ))}
              {files.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-400 text-center">No files shared with you yet.</p>
                </div>
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
              <div className="mt-auto pt-2">
                <MessageInput onSend={handleSendMessage} isMobile={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Viewer Tab - 4th Tab */}
      <div className={`${styles.mobileTab} ${activeTab === 'fileViewer' ? styles.active : ''}`}>
        <div className={styles.panelSection}>
          <h2 className={styles.sectionTitle}>
            {currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : 'File Viewer'}
          </h2>
          <div className={styles.mobileContent}>
            {currentFile ? (
              <FileViewer 
                file={{...currentFile, url: getFileUrl(currentFile)}} 
                isMobile={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <i className="ri-file-line text-4xl mb-2 text-gray-400"></i>
                <p className="text-gray-400 text-center">Select a file to view it here</p>
              </div>
            )}
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