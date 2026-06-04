import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Settings, Bell, CreditCard, Shield, HelpCircle,
  LogOut, ChevronRight, Crown,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  icon: any;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', paddingVertical: 15,
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: item.danger ? 'rgba(239,68,68,0.12)' : colors.secondary, marginRight: 14,
      }}>
        <Icon size={18} color={item.danger ? colors.destructive : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: item.danger ? colors.destructive : colors.foreground, fontSize: 15, fontWeight: '600' }}>
          {item.label}
        </Text>
        {item.sublabel && (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 1 }}>{item.sublabel}</Text>
        )}
      </View>
      {!item.danger && <ChevronRight size={18} color={colors.border} />}
    </TouchableOpacity>
  );
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [planLabel, setPlanLabel] = useState('Free Plan');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/subscription/my-subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const name = d.subscription?.plan_details?.name ?? d.subscription?.plan_type;
        if (name) setPlanLabel(name.charAt(0).toUpperCase() + name.slice(1));
      })
      .catch(() => {});
  }, [token]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { setSigningOut(true); await signOut(); },
      },
    ]);
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: CreditCard, label: 'Subscription', sublabel: 'Manage your plan', onPress: () => {} },
        { icon: Bell,        label: 'Notifications',  sublabel: 'Push & email preferences', onPress: () => {} },
        { icon: Shield,      label: 'Privacy & Security', onPress: () => {} },
        { icon: Settings,    label: 'Settings',       onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
      ],
    },
    {
      title: '',
      items: [
        { icon: LogOut, label: 'Sign Out', onPress: handleSignOut, danger: true },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 28, alignItems: 'center' }}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 16 }}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={{ width: 90, height: 90, borderRadius: 45 }} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{initials}</Text>
              </LinearGradient>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
              {user?.name || 'FlixVideo User'}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 4 }}>
              {user?.email}
            </Text>

            {/* Plan badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10,
              backgroundColor: 'rgba(147,51,234,0.15)', borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
            }}>
              <Crown size={13} color={colors.primary} fill={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                {user?.role === 'admin' ? 'Admin' : planLabel}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <Animated.View
            key={si}
            entering={FadeInDown.duration(400).delay(si * 60)}
            style={{ marginBottom: 16 }}
          >
            {section.title ? (
              <Text style={{
                color: colors.mutedForeground, fontSize: 12, fontWeight: '700',
                letterSpacing: 0.8, textTransform: 'uppercase',
                marginLeft: 16, marginBottom: 4,
              }}>
                {section.title}
              </Text>
            ) : null}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <MenuRow key={i} item={item} />
              ))}
            </View>
          </Animated.View>
        ))}

        <Text style={{ color: colors.border, textAlign: 'center', fontSize: 12, marginBottom: insets.bottom + 24 }}>
          FlixVideo v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
