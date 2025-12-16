import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

export const presenceService = {
  // Update student online status
  async updateStudentStatus(studentId, status) {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      onlineStatus: status,
      lastSeen: new Date()
    });
  },

  // Listen for student status changes
  listenToStudentStatus(studentId, callback) {
    const studentRef = doc(db, 'students', studentId);
    
    return onSnapshot(studentRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          onlineStatus: data.onlineStatus || 'offline',
          lastSeen: data.lastSeen?.toDate?.() || data.lastSeen
        });
      }
    });
  }
};