import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../theme/colors';

const PREFS_KEY = 'flixvideo_notif_prefs';

interface NotifRow {
  label: string;
  sublabel: string;
  key: string;
}

const SECTIONS: { title: string; rows: NotifRow[] }[] = [
  {
    title: 'Push Notifications',
    rows: [
      { key: 'new_releases',   label: 'New Releases',     sublabel: 'When new movies or shows are added' },
      { key: 'recommendations',label: 'Recommendations',  sublabel: 'Personalised picks for you' },
      { key: 'watchlist',      label: 'Watchlist Updates', sublabel: 'Changes to your saved titles' },
    ],
  },
  {
    title: 'Email Notifications',
    rows: [
      { key: 'email_newsletter', label: 'Newsletter',       sublabel: 'Weekly highlights and new content' },
      { key: 'email_account',    label: 'Account Activity', sublabel: 'Sign-ins, password changes' },
      { key: 'email_billing',    label: 'Billing',          sublabel: 'Invoices and subscription updates' },
    ],
  },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const DEFAULT_PREFS: Record<string, boolean> = {
    new_releases: true,
    recommendations: true,
    watchlist: false,
    email_newsletter: false,
    email_account: true,
    email_billing: true,
  };

  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then(val => {
      if (val) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(val) });
    });
  }, []);

  const toggle = useCallback((key: string) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
          Notifications
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section, si) => (
          <Animated.View key={si} entering={FadeInDown.duration(400).delay(si * 80)} style={{ marginBottom: 20 }}>
            <Text style={{
              color: colors.mutedForeground, fontSize: 12, fontWeight: '700',
              letterSpacing: 0.8, textTransform: 'uppercase',
              marginLeft: 16, marginBottom: 4,
            }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' }}>
              {section.rows.map((row, i) => (
                <View
                  key={row.key}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14, paddingHorizontal: 16,
                    borderBottomWidth: i < section.rows.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>{row.label}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{row.sublabel}</Text>
                  </View>
                  <Switch
                    value={prefs[row.key]}
                    onValueChange={() => toggle(row.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}
