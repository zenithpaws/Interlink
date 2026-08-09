import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { User, Camera, Palette, HardDrive, X, Radio } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  OperatorProfile, 
  OperatorStatus,
  uploadOperatorAvatar, 
  updateOperatorPreferences,
  updateOperatorStatus,
  OperatorPreferences
} from '../services/matrixService';

const STATUS_OPTIONS: { label: OperatorStatus; color: string }[] = [
  { label: 'ONLINE', color: '#22c55e' },
  { label: 'IN_FIELD', color: '#38bdf8' },
  { label: 'BUSY', color: '#f59e0b' },
  { label: 'STEALTH', color: '#ef4444' },
];

const DEFAULT_PREFS: OperatorPreferences = {
  theme: 'matrix_green',
  dataSaver: false,
  soundEffects: true,
};

interface Props {
  visible: boolean;
  operator: OperatorProfile;
  onClose: () => void;
  onProfileUpdated: (updated: OperatorProfile) => void;
}

export const MatrixSettingsModal: React.FC<Props> = ({
  visible,
  operator,
  onClose,
  onProfileUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [prefs, setPrefs] = useState<OperatorPreferences>(
    operator?.preferences || DEFAULT_PREFS
  );
  const [currentStatus, setCurrentStatus] = useState<OperatorStatus>(operator?.status || 'ONLINE');

  // Keep internal state safely in sync when operator profile updates
  useEffect(() => {
    if (operator) {
      setPrefs(operator.preferences || DEFAULT_PREFS);
      setCurrentStatus(operator.status || 'ONLINE');
    }
  }, [operator]);

  const handleStatusChange = async (status: OperatorStatus) => {
    setCurrentStatus(status);
    await updateOperatorStatus(operator.uid, status);
    onProfileUpdated({ ...operator, status });
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      try {
        const photoURL = await uploadOperatorAvatar(operator.uid, result.assets[0].uri);
        onProfileUpdated({ ...operator, photoURL });
      } catch (err) {
        console.error('Failed avatar upload:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleToggleDataSaver = async (value: boolean) => {
    const newPrefs: OperatorPreferences = { ...(prefs || DEFAULT_PREFS), dataSaver: value };
    setPrefs(newPrefs);
    await updateOperatorPreferences(operator.uid, newPrefs);
    onProfileUpdated({ ...operator, preferences: newPrefs });
  };

  const handleSelectTheme = async (theme: OperatorPreferences['theme']) => {
    const newPrefs: OperatorPreferences = { ...(prefs || DEFAULT_PREFS), theme };
    setPrefs(newPrefs);
    await updateOperatorPreferences(operator.uid, newPrefs);
    onProfileUpdated({ ...operator, preferences: newPrefs });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>// OPERATOR_SETTINGS</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#22c55e" />
            </TouchableOpacity>
          </View>

          {/* AVATAR & ALIAS SECTION */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
              {operator?.photoURL ? (
                <Image source={{ uri: operator.photoURL }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={32} color="#15803d" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                {uploading ? <ActivityIndicator size="small" color="#020804" /> : <Camera size={12} color="#020804" />}
              </View>
            </TouchableOpacity>
            <Text style={styles.aliasText}>{operator?.alias || 'OPERATOR'}</Text>
            <Text style={styles.clearanceText}>{operator?.clearance || 'LEVEL-1'}</Text>
          </View>

          {/* OPERATOR STATUS SELECTOR */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Radio size={16} color="#22c55e" />
              <Text style={styles.sectionTitle}>OPERATOR STATUS</Text>
            </View>

            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((item) => {
                const isActive = currentStatus === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.statusChip, isActive && { borderColor: item.color, backgroundColor: '#020804' }]}
                    onPress={() => handleStatusChange(item.label)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.statusText, isActive && { color: item.color, fontWeight: 'bold' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* VISUAL THEME SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={16} color="#22c55e" />
              <Text style={styles.sectionTitle}>VISUAL THEME</Text>
            </View>

            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[styles.themeBtn, prefs?.theme === 'matrix_green' && styles.activeThemeBtn]}
                onPress={() => handleSelectTheme('matrix_green')}
              >
                <Text style={styles.themeText}>MATRIX GREEN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeBtn, prefs?.theme === 'cyber_light' && styles.activeThemeBtn]}
                onPress={() => handleSelectTheme('cyber_light')}
              >
                <Text style={styles.themeText}>LIGHT MODE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DATA SAVER */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <HardDrive size={16} color="#22c55e" />
              <Text style={styles.sectionTitle}>PREFERENCES</Text>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>DATA SAVER MODE</Text>
                <Text style={styles.settingSub}>Hide image previews automatically</Text>
              </View>
              <Switch
                value={prefs?.dataSaver ?? false}
                onValueChange={handleToggleDataSaver}
                trackColor={{ false: '#0e3a1a', true: '#22c55e' }}
                thumbColor="#020804"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2, 8, 4, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 400, backgroundColor: '#051409', borderRadius: 8, borderWidth: 1, borderColor: '#22c55e', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#22c55e', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', backgroundColor: '#020804' },
  avatarImage: { width: 66, height: 66, borderRadius: 33 },
  avatarPlaceholder: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#020804', justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#22c55e', padding: 5, borderRadius: 10 },
  aliasText: { color: '#22c55e', fontWeight: '900', fontSize: 15, marginTop: 6, letterSpacing: 1 },
  clearanceText: { color: '#15803d', fontSize: 10, marginTop: 2 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { color: '#22c55e', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#0e3a1a', backgroundColor: '#051409' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: '#15803d', fontSize: 11 },
  themeOptions: { flexDirection: 'row', gap: 10 },
  themeBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#15803d', borderRadius: 4, alignItems: 'center', backgroundColor: '#020804' },
  activeThemeBtn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  themeText: { color: '#22c55e', fontSize: 10, fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020804', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#0e3a1a' },
  settingLabel: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  settingSub: { color: '#15803d', fontSize: 9, marginTop: 2 },
});