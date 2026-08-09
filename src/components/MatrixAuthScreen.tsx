import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Terminal, Shield, Zap } from 'lucide-react-native';
import { registerOperator, loginOperator } from '../services/matrixService';

export const MatrixAuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('ACCESS DENIED', 'Credentials required.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!alias.trim()) {
          Alert.alert('ACCESS DENIED', 'Operator designation/alias required.');
          setLoading(false);
          return;
        }
        await registerOperator(email.trim(), password, alias.trim());
      } else {
        await loginOperator(email.trim(), password);
      }
    } catch (err: any) {
      Alert.alert('AUTHENTICATION FAILED', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.terminalBox}>
        <View style={styles.header}>
          <Terminal size={24} color="#22c55e" />
          <Text style={styles.title}>INTERLINK // AUTH_GATEWAY</Text>
        </View>

        <Text style={styles.subtitle}>
          {isRegister ? 'INITIALIZE NEW OPERATOR IDENTITY' : 'INPUT CLEARANCE CREDENTIALS'}
        </Text>

        {isRegister && (
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>OPERATOR ALIAS:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ASTER_FOX"
              placeholderTextColor="#15803d"
              value={alias}
              onChangeText={setAlias}
              autoCapitalize="characters"
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>NET ID / EMAIL:</Text>
          <TextInput
            style={styles.input}
            placeholder="operator@interlink.net"
            placeholderTextColor="#15803d"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>PASSCODE:</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#15803d"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#020804" />
          ) : (
            <View style={styles.btnContent}>
              <Zap size={16} color="#020804" />
              <Text style={styles.submitText}>
                {isRegister ? 'REGISTER OPERATOR' : 'AUTHENTICATE'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isRegister ? 'Return to Credential Login' : 'Need new operator designation? Register'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020804',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  terminalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#051409',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#15803d',
    fontSize: 10,
    marginBottom: 20,
    letterSpacing: 1,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  label: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#020804',
    borderWidth: 1,
    borderColor: '#15803d',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#22c55e',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#020804',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#15803d',
    fontSize: 11,
  },
});
