import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const notificationService = {
  // Add call notification to messages
  async addCallNotification(studentId, callType, callId, roomName) {
    const message = callType === 'initiated' 
      ? `📞 Incoming call from teacher` 
      : `📞 Missed call from teacher`;
    
    const notificationData = {
      studentId,
      type: 'call',
      message,
      callId,
      roomName,
      timestamp: new Date(),
      read: false,
      metadata: {
        callType,
        timestamp: new Date()
      }
    };
    
    await addDoc(collection(db, 'messages'), notificationData);
  }
};