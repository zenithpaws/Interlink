import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { subscribeToAuth, getOperatorProfile, OperatorProfile, DEFAULT_PREFERENCES } from '../../src/services/matrixService';
import { MatrixAuthScreen } from '../../src/components/MatrixAuthScreen';
import { InterlinkMatrixUI } from '../../src/components/InterlinkMatrixUI';

// Fallback profile builder for missing/uninitialized Firestore user docs
const sanitizeProfile = (rawProfile: any, uid: string, email: string): OperatorProfile => {
  return {
    uid: rawProfile?.uid || uid,
    alias: rawProfile?.alias || 'OPERATOR',
    email: rawProfile?.email || email,
    clearance: rawProfile?.clearance || 'LEVEL-1',
    status: rawProfile?.status || 'ONLINE',
    photoURL: rawProfile?.photoURL || '',
    preferences: {
      theme: rawProfile?.preferences?.theme || 'matrix_green',
      dataSaver: rawProfile?.preferences?.dataSaver ?? false,
      soundEffects: rawProfile?.preferences?.soundEffects ?? true,
    },
  };
};

export default function App() {
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getOperatorProfile(firebaseUser.uid);
          const safeProfile = sanitizeProfile(
            profile, 
            firebaseUser.uid, 
            firebaseUser.email || ''
          );
          setOperator(safeProfile);
        } catch (err) {
          console.error("Error fetching operator profile:", err);
          // Fallback if Firestore fails or document is missing
          setOperator(sanitizeProfile(null, firebaseUser.uid, firebaseUser.email || ''));
        }
      } else {
        setOperator(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020804', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return operator ? (
    <InterlinkMatrixUI 
      operator={operator} 
      onOperatorUpdated={(updated) => setOperator(updated)} 
    />
  ) : (
    <MatrixAuthScreen />
  );
}