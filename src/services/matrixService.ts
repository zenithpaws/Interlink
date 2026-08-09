import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';

export interface MatrixLog {
  id: string;
  type: 'system' | 'broadcast' | 'command' | 'enc_data';
  sender: string;
  senderUid?: string;
  body: string;
  mediaUrl?: string;
  timestamp: string;
  frequency: string;
}

export interface OperatorProfile {
  uid: string;
  alias: string;
  email: string;
  clearance: string;
}

// --- AUTHENTICATION ---

export const registerOperator = async (email: string, pass: string, alias: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  const profile: OperatorProfile = {
    uid: user.uid,
    alias: alias.toUpperCase(),
    email,
    clearance: 'LEVEL-1',
  };

  await setDoc(doc(db, 'operators', user.uid), profile);
  return profile;
};

export const loginOperator = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logoutOperator = async () => {
  return await signOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getOperatorProfile = async (uid: string): Promise<OperatorProfile | null> => {
  const userDoc = await getDoc(doc(db, 'operators', uid));
  if (userDoc.exists()) {
    return userDoc.data() as OperatorProfile;
  }
  return null;
};

// --- MEDIA STORAGE UPLOAD ---

export const uploadMatrixMedia = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `transmissions/${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const storageRef = ref(storage, filename);
  
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// --- FIRESTORE TRANSMISSIONS ---

export const transmitPulse = async (
  frequencyId: string, 
  body: string, 
  sender: string,
  senderUid: string,
  type: MatrixLog['type'] = 'broadcast',
  mediaUrl?: string
) => {
  await addDoc(collection(db, 'frequencies', frequencyId, 'pulses'), {
    body,
    sender,
    senderUid,
    type,
    mediaUrl: mediaUrl || null,
    createdAt: serverTimestamp()
  });
};

export const subscribeToFrequency = (
  frequencyId: string, 
  callback: (logs: MatrixLog[]) => void
) => {
  const q = query(
    collection(db, 'frequencies', frequencyId, 'pulses'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs: MatrixLog[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate?.();
      
      return {
        id: docSnap.id,
        type: data.type || 'broadcast',
        sender: data.sender || 'UNKNOWN_NODE',
        senderUid: data.senderUid,
        body: data.body || '',
        mediaUrl: data.mediaUrl || undefined,
        timestamp: date ? date.toLocaleTimeString('en-US', { hour12: false }) : 'SYNCING...',
        frequency: frequencyId,
      };
    });
    callback(logs);
  });
};
