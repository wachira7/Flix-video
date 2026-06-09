import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Save } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

function InputField({
  label, value, onChangeText, placeholder, autoCapitalize = 'sentences', multiline = false,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; autoCapitalize?: any; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.border}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={{
          backgroundColor: colors.secondary, borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 13,
          color: colors.foreground, fontSize: 15,
          borderWidth: 1, borderColor: colors.border,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, token } = useAuth();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), username: username.trim() || undefined, bio: bio.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update profile');
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to change password');
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setChangingPassword(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 10, paddingBottom: 14,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.secondary, borderRadius: 20, padding: 8 }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, flex: 1 }}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Save size={14} color="#fff" />
            }
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Avatar */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginBottom: 32, marginTop: 8 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{initials}</Text>
          </LinearGradient>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 10 }}>
            {user?.email}
          </Text>
        </Animated.View>

        {/* Profile fields */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
            Profile Info
          </Text>
          <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
          <InputField label="Username" value={username} onChangeText={setUsername} placeholder="@username" autoCapitalize="none" />
          <InputField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about yourself..." multiline />
        </Animated.View>

        {/* Change password */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
            Change Password
          </Text>
          <InputField label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" autoCapitalize="none" />
          <InputField label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="Min 8 characters" autoCapitalize="none" />

          <TouchableOpacity
            onPress={changePassword}
            disabled={changingPassword}
            activeOpacity={0.85}
            style={{
              borderWidth: 1.5, borderColor: colors.primary,
              borderRadius: 12, paddingVertical: 13,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(147,51,234,0.08)',
            }}
          >
            {changingPassword
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Update Password</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
