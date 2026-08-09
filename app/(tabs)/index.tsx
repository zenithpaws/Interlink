import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { subscribeToAuth, getOperatorProfile, OperatorProfile } from '../../src/services/matrixService';
import { MatrixAuthScreen } from '../../src/components/MatrixAuthScreen';
import { InterlinkMatrixUI } from '../../src/components/InterlinkMatrixUI';

export default function App() {
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getOperatorProfile(firebaseUser.uid);
        if (profile) {
          setOperator(profile);
        } else {
          // Default fallback profile if document is initializing
          setOperator({
            uid: firebaseUser.uid,
            alias: firebaseUser.email ? firebaseUser.email.split('@')[0].toUpperCase() : 'OPERATOR',
            email: firebaseUser.email || '',
            clearance: 'LEVEL-1',
          });
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

  return operator ? <InterlinkMatrixUI operator={operator} /> : <MatrixAuthScreen />;
}
