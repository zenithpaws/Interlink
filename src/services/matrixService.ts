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
import { db, auth } from '../config/firebase';

export type OperatorStatus = 'ONLINE' | 'IN_FIELD' | 'BUSY' | 'STEALTH';

export interface MatrixLog {
  id: string;
  type: 'system' | 'broadcast' | 'command' | 'enc_data' | 'dm';
  sender: string;
  senderUid: string;
  senderPhotoURL?: string;
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

// Deterministic DM channel ID strictly using usernames (alphabetic sort)
export const getDmChannelIdByAlias = (alias1: string, alias2: string): string => {
  const clean1 = alias1.trim().toUpperCase();
  const clean2 = alias2.trim().toUpperCase();
  return [clean1, clean2].sort().join('_DM_');
};

// Search for an operator profile strictly by Username / Alias
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

// --- PRIVATE DM INDEXING ---

export const registerDmForUser = async (userUid: string, dmChannelId: string, targetAlias: string) => {
  const userDmRef = doc(db, 'operators', userUid, 'dm_channels', dmChannelId);
  await setDoc(userDmRef, {
    channelId: dmChannelId,
    targetAlias: targetAlias.toUpperCase(),
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const subscribeToUserDms = (
  userUid: string, 
  callback: (dms: { id: string; name: string; isDm: boolean }[]) => void
) => {
  const dmsRef = collection(db, 'operators', userUid, 'dm_channels');
  
  return onSnapshot(dmsRef, (snapshot) => {
    const dmChannels = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: data.channelId || docSnap.id,
        name: `@${data.targetAlias}`,
        isDm: true
      };
    });
    callback(dmChannels);
  });
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

// Upload Operator Avatar as Base64 (No Firebase Storage required)
export const uploadOperatorAvatar = async (uid: string, uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const photoURL: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert avatar to Base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  await updateDoc(doc(db, 'operators', uid), { photoURL });
  return photoURL;
};

// --- TRANSMISSIONS (SEND / EDIT / DELETE) ---

export const transmitPulse = async (
  channelId: string, 
  body: string, 
  sender: string,
  senderUid: string,
  senderPhotoURL?: string,
  type: MatrixLog['type'] = 'broadcast',
  mediaUrl?: string
) => {
  // Ensure parent channel doc exists in Firestore
  const channelRef = doc(db, 'channels', channelId);
  await setDoc(channelRef, { 
    lastUpdated: serverTimestamp(),
    isDm: channelId.includes('_DM_')
  }, { merge: true });

  // If it's a DM, register channel for the sender AND lookup recipient to register for them too
  if (channelId.includes('_DM_')) {
    const parts = channelId.split('_DM_');
    const targetAlias = parts[0] === sender.toUpperCase() ? parts[1] : parts[0];
    
    // Register DM for the current sender
    await registerDmForUser(senderUid, channelId, targetAlias);

    // Attempt to locate recipient profile to auto-populate DM in their sidebar
    try {
      const recipientProfile = await getOperatorByAlias(targetAlias);
      if (recipientProfile?.uid) {
        await registerDmForUser(recipientProfile.uid, channelId, sender.toUpperCase());
      }
    } catch (e) {
      console.warn('Recipient auto-indexing deferred:', e);
    }
  }

  // Save pulse with sender's photoURL
  await addDoc(collection(db, 'channels', channelId, 'pulses'), {
    body,
    sender,
    senderUid,
    senderPhotoURL: senderPhotoURL || null,
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
        senderPhotoURL: data.senderPhotoURL || undefined,
        body: data.body || '',
        mediaUrl: data.mediaUrl || undefined,
        isEdited: data.isEdited || false,
        timestamp: date ? date.toLocaleTimeString('en-US', { hour12: false }) : 'SYNCING...',
      };
    });
    callback(logs);
  });
};