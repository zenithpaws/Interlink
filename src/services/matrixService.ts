import { 
  collection, 
  addDoc, 
  query, 
  where,
  getDocs,
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
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

export type OperatorStatus = 'ONLINE' | 'IN_FIELD' | 'BUSY' | 'STEALTH';

export interface MatrixLog {
  id: string;
  type: 'system' | 'broadcast' | 'command' | 'enc_data' | 'dm';
  sender: string;
  senderUid: string;
  body: string;
  mediaUrl?: string;
  timestamp: string;
  isEdited?: boolean;
}

export interface OperatorPreferences {
  theme: 'matrix_green' | 'cyber_light' | 'amber_crt';
  dataSaver: boolean;
  soundEffects: boolean;
}

export interface OperatorProfile {
  uid: string;
  alias: string;
  email: string;
  clearance: string;
  status: OperatorStatus;
  photoURL?: string;
  preferences: OperatorPreferences;
}

export const DEFAULT_PREFERENCES: OperatorPreferences = {
  theme: 'matrix_green',
  dataSaver: false,
  soundEffects: true,
};

// Helper to generate a deterministic DM channel ID between two usernames/aliases (alphabetic sort)
export const getDmChannelIdByAlias = (alias1: string, alias2: string): string => {
  const clean1 = alias1.trim().toUpperCase();
  const clean2 = alias2.trim().toUpperCase();
  return [clean1, clean2].sort().join('_DM_');
};

// Find an operator profile by their unique Alias/Username
export const getOperatorByAlias = async (alias: string): Promise<OperatorProfile | null> => {
  const cleanAlias = alias.trim().toUpperCase();
  const q = query(
    collection(db, 'operators'), 
    where('alias', '==', cleanAlias)
  );
  
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const docData = querySnap.docs[0].data();
    return {
      ...docData,
      status: docData.status || 'ONLINE',
      preferences: docData.preferences || DEFAULT_PREFERENCES,
    } as OperatorProfile;
  }
  return null;
};

// --- AUTHENTICATION & PROFILE ---

export const registerOperator = async (email: string, pass: string, alias: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  const profile: OperatorProfile = {
    uid: user.uid,
    alias: alias.toUpperCase(),
    email,
    clearance: 'LEVEL-1',
    status: 'ONLINE',
    photoURL: '',
    preferences: DEFAULT_PREFERENCES,
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
    const data = userDoc.data();
    return {
      ...data,
      status: data.status || 'ONLINE',
      preferences: data.preferences || DEFAULT_PREFERENCES,
    } as OperatorProfile;
  }
  return null;
};

export const updateOperatorStatus = async (uid: string, status: OperatorStatus) => {
  await updateDoc(doc(db, 'operators', uid), { status });
};

export const updateOperatorPreferences = async (uid: string, preferences: Partial<OperatorPreferences>) => {
  await updateDoc(doc(db, 'operators', uid), { preferences });
};

export const uploadOperatorAvatar = async (uid: string, uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `avatars/${uid}_${Date.now()}`;
  const storageRef = ref(storage, filename);
  
  await uploadBytes(storageRef, blob);
  const photoURL = await getDownloadURL(storageRef);

  await updateDoc(doc(db, 'operators', uid), { photoURL });
  return photoURL;
};

// --- TRANSMISSIONS (EDIT / DELETE / DM) ---

export const transmitPulse = async (
  channelId: string, 
  body: string, 
  sender: string,
  senderUid: string,
  type: MatrixLog['type'] = 'broadcast',
  mediaUrl?: string
) => {
  await addDoc(collection(db, 'channels', channelId, 'pulses'), {
    body,
    sender,
    senderUid,
    type,
    mediaUrl: mediaUrl || null,
    isEdited: false,
    createdAt: serverTimestamp()
  });
};

export const editPulse = async (channelId: string, pulseId: string, newBody: string) => {
  const pulseRef = doc(db, 'channels', channelId, 'pulses', pulseId);
  await updateDoc(pulseRef, {
    body: newBody,
    isEdited: true
  });
};

export const deletePulse = async (channelId: string, pulseId: string) => {
  const pulseRef = doc(db, 'channels', channelId, 'pulses', pulseId);
  await deleteDoc(pulseRef);
};

export const subscribeToChannel = (
  channelId: string, 
  callback: (logs: MatrixLog[]) => void
) => {
  const q = query(
    collection(db, 'channels', channelId, 'pulses'),
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
        isEdited: data.isEdited || false,
        timestamp: date ? date.toLocaleTimeString('en-US', { hour12: false }) : 'SYNCING...',
      };
    });
    callback(logs);
  });
};