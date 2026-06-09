import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft, User, Bell, Shield, HelpCircle,
  ChevronRight, Smartphone, Info, Clock, Sparkles,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingRow {
  icon: any;
  label: string;
  sublabel?: string;
  onPress: () => void;
}

function Row({ item }: { item: SettingRow }) {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 15, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.secondary, marginRight: 14,
      }}>
        <Icon size={18} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>{item.label}</Text>
        {item.sublabel && (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 1 }}>{item.sublabel}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: 'Account',
      rows: [
        {
          icon: User, label: 'Edit Profile',
          sublabel: 'Name, username, bio',
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: Bell, label: 'Notifications',
          sublabel: 'Push & email preferences',
          onPress: () => navigation.navigate('NotificationSettings'),
        },
        {
          icon: Clock, label: 'Watch History',
          sublabel: 'View and manage history',
          onPress: () => navigation.navigate('WatchHistory'),
        },
        {
          icon: Sparkles, label: 'AI Assistant',
          sublabel: 'Chat for recommendations',
          onPress: () => navigation.navigate('AIChat'),
        },
        {
          icon: Shield, label: 'Privacy & Security',
          sublabel: 'Password, data, visibility',
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon.'),
        },
        {
          icon: Smartphone, label: 'Devices',
          sublabel: 'Manage logged-in devices',
          onPress: () => Alert.alert('Coming Soon', 'Device management will be available soon.'),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          icon: HelpCircle, label: 'Help & Support',
          onPress: () => Alert.alert('Help & Support', 'Email us at support@flixvideo.com'),
        },
        {
          icon: Info, label: 'About',
          sublabel: 'FlixVideo v1.0.0',
          onPress: () => Alert.alert('FlixVideo', 'Version 1.0.0\nBuilt with ❤️ by WaruTech'),
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

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
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section, si) => (
          <Animated.View key={si} entering={FadeInDown.duration(400).delay(si * 80)} style={{ marginBottom: 20 }}>
            <Text style={{
              color: colors.mutedForeground, fontSize: 12, fontWeight: '700',
              letterSpacing: 0.8, textTransform: 'uppercase',
              marginLeft: 16, marginBottom: 4,
            }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' }}>
              {section.rows.map((row, i) => <Row key={i} item={row} />)}
            </View>
          </Animated.View>
        ))}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}
