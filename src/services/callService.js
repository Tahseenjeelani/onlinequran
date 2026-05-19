import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export const callService = {
  // Teacher initiates call
  async initiateCall(studentId, teacherId = 'teacher') {
    if (teacherId !== 'teacher') {
      throw new Error('Unauthorized: Only teachers can initiate calls');
    }
    // Create a simpler, more reliable room name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const roomName = `quran-${timestamp}-${randomId}`;

    const callData = {
      teacherId,
      studentId,
      roomName,
      status: 'initiated',
      initiatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'calls'), callData);
    return { ...callData, callId: docRef.id };
  },

  // Student answers call
  async answerCall(callId) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'answered',
      answeredAt: new Date()
    });
  },

  // End call
  async endCall(callId, duration) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'completed',
      endedAt: new Date(),
      duration
    });
  },

  // Mark as missed
  async markMissedCall(callId) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'missed',
      endedAt: new Date()
    });
  },

  // Listen for incoming calls (student side)
  listenForCalls(studentId, callback) {
    console.log('Listening for calls for student:', studentId);
    // Removed orderBy to avoid index issues for now
    const q = query(
      collection(db, 'calls'),
      where('studentId', '==', studentId),
      where('status', 'in', ['initiated', 'ringing'])
    );

    return onSnapshot(q, (snapshot) => {
      console.log('Call snapshot received:', snapshot.size);
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Ensure callId is included from the document ID
          callback({ ...data, callId: change.doc.id, id: change.doc.id });
        }
      });
    }, (error) => {
      console.error("Error listening for calls:", error);
    });
  },

  // Listen for active calls (teacher side)
  listenForActiveCalls(teacherId, callback) {
    const q = query(
      collection(db, 'calls'),
      where('teacherId', '==', teacherId),
      where('status', 'in', ['initiated', 'answered']),
      orderBy('initiatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(calls);
    });
  }
};