import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import FileItem from '../TeacherPanel/components/FileItem/FileItem';
import { db, storage } from '../../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import styles from './FileManagement.module.css';

const FileManagement = () => {
  const [files, setFiles] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch files and students from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch files
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const filesData = filesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setFiles(filesData);

        // Fetch students
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please check permissions.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Add to Firestore
      const fileDoc = {
        name: file.name,
        url,
        sharedWith: [],
        createdAt: new Date().toISOString(),
        size: file.size,
        type: file.type
      };
      
      const docRef = await addDoc(collection(db, 'files'), fileDoc);
      setFiles(prev => [...prev, { id: docRef.id, ...fileDoc }]);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file");
    }
  };

  const handleShareFile = async () => {
    if (!currentFile) return;
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'files', currentFile.id), { 
        sharedWith: selectedStudents 
      });
      
      // Update local state
      setFiles(files.map(file => 
        file.id === currentFile.id 
          ? { ...file, sharedWith: selectedStudents } 
          : file
      ));
      
      setShowShareModal(false);
      setCurrentFile(null);
      setSelectedStudents([]);
      
    } catch (err) {
      console.error("Share error:", err);
      setError("Failed to share file");
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const file = files.find(f => f.id === fileId);
      
      // Delete from Storage
      if (file && file.url) {
        const fileRef = ref(storage, file.url);
        await deleteObject(fileRef).catch(err => {
          console.warn("Storage delete error (might be already deleted):", err);
        });
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', fileId));
      setFiles(files.filter(file => file.id !== fileId));
      
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete file");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showBackButton backUrl="/teacher-landing" title="Manage Files" />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-white">Loading files...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/teacher-landing" title="Manage Files" />
      
      <main className="flex-grow pt-20 pb-4 px-4">
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 float-right"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center space-x-2">
          <label htmlFor="fileInput" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg flex items-center cursor-pointer">
            <i className="ri-upload-line mr-2"></i> Upload File
          </label>
          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </div>

        <div className={`${styles.panelSection} p-4`}>
          <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
            {files.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No files uploaded yet. Click "Upload File" to add materials.
              </div>
            ) : (
              <div className="space-y-2">
                {files.map(file => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onShare={() => {
                      setCurrentFile(file);
                      setSelectedStudents(file.sharedWith || []);
                      setShowShareModal(true);
                    }}
                    onDelete={() => handleDeleteFile(file.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && currentFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${styles.panelSection} p-6 max-w-md w-full`}>
              <h3 className="text-white text-xl mb-4">Share "{currentFile.name}"</h3>
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto">
                  {students.map(student => (
                    <div 
                      key={student.id} 
                      className="flex items-center p-2 hover:bg-black hover:bg-opacity-20 rounded cursor-pointer"
                      onClick={() => {
                        if (selectedStudents.includes(student.id)) {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        } else {
                          setSelectedStudents([...selectedStudents, student.id]);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        readOnly
                        className="mr-3"
                      />
                      <span className="text-white">{student.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setShowShareModal(false);
                      setCurrentFile(null);
                      setSelectedStudents([]);
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded-lg flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleShareFile}
                    className="bg-amber-600 text-white py-2 px-4 rounded-lg flex-1"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FileManagement;