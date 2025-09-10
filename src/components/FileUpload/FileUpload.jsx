import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import styles from './FileUpload.module.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    
    const storageRef = ref(storage, `teacher-files/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        setError(error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await setDoc(doc(db, 'file-metadata', file.name), {
            name: file.name,
            type: file.type,
            size: (file.size / (1024 * 1024)).toFixed(2), // MB
            downloadURL,
            sharedWith: [],
            uploadedAt: new Date().toISOString()
          });
          
          setProgress(0);
          setFile(null);
        } catch (err) {
          setError(err.message);
        }
      }
    );
  };

  return (
    <div className={styles.uploadContainer}>
      <label className={styles.uploadButton}>
        Choose File
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          className="hidden"
        />
      </label>
      {file && <span className={styles.fileName}>{file.name}</span>}
      <button 
        onClick={handleUpload} 
        disabled={!file}
        className={styles.uploadButton}
      >
        Upload
      </button>
      {progress > 0 && (
        <div className={styles.progressBar}>
          <div style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default FileUpload;