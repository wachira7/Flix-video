import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Crown, Zap, Star } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string | null;
  features: Record<string, any>;
  popular?: boolean;
}

const PLAN_ICONS: Record<string, any> = {
  free: Star,
  basic: Zap,
  premium: Crown,
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free:    ['Watch content', 'Create reviews', 'Up to 3 watchlists', '1 AI recommendation/day', 'Ads included'],
  basic:   ['HD quality', 'No ads', 'Up to 10 watchlists', '5 AI recommendations/day', 'Download lists'],
  premium: ['HD quality', 'No ads', 'Unlimited watchlists', 'Unlimited AI recommendations', 'AI Chat (50 conversations/mo)', 'Priority support', 'Early access'],
};

export default function SubscriptionPlansScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch(`${API_URL}/api/subscriptions/plans`),
          token ? fetch(`${API_URL}/api/subscriptions/my-subscription`, {
            headers: { Authorization: `Bearer ${token}` },
          }) : Promise.resolve(null),
        ]);
        const plansData = await plansRes.json();
        setPlans(plansData.plans ?? []);

        if (subRes) {
          const subData = await subRes.json();
          setCurrentPlanId(subData.subscription?.plan_type ?? 'free');
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [token]);

  const handleUpgrade = useCallback(async (planId: string) => {
    if (planId === currentPlanId) return;
    Alert.alert(
      'Upgrade Plan',
      `Switch to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpgrading(planId);
            try {
              if (planId === 'free') {
                const res = await fetch(`${API_URL}/api/subscriptions/cancel`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ reason: 'Downgraded to free plan' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Downgrade failed');
              } else {
                const res = await fetch(`${API_URL}/api/subscriptions/upgrade`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ plan_type: planId, payment_method: 'mpesa' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Upgrade failed');
              }
              setCurrentPlanId(planId);
              Alert.alert('Success', `You are now on the ${planId} plan!`);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
            setUpgrading(null);
          },
        },
      ]
    );
  }, [currentPlanId, token]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>
          Subscription
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginBottom: 28 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
          >
            <Crown size={32} color="#fff" />
          </LinearGradient>
          <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>
            Choose Your Plan
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 6, textAlign: 'center' }}>
            Unlock more content and features
          </Text>
        </Animated.View>

        {/* Plan cards */}
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          const isPremium = plan.id === 'premium';
          const Icon = PLAN_ICONS[plan.id] ?? Star;
          const highlights = PLAN_HIGHLIGHTS[plan.id] ?? [];
          const isUpgrading = upgrading === plan.id;

          return (
            <Animated.View key={plan.id} entering={FadeInDown.duration(400).delay(i * 80)}>
              {isPremium && (
                <View style={{ alignItems: 'center', marginBottom: -1, zIndex: 1 }}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>MOST POPULAR</Text>
                  </LinearGradient>
                </View>
              )}

              <View style={{
                backgroundColor: colors.card,
                borderRadius: 16, padding: 20, marginBottom: 14,
                borderWidth: isCurrent ? 2 : isPremium ? 1.5 : 1,
                borderColor: isCurrent ? colors.primary : isPremium ? 'rgba(147,51,234,0.4)' : colors.border,
              }}>
                {/* Plan header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, marginRight: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isPremium ? 'rgba(147,51,234,0.15)' : colors.secondary,
                  }}>
                    <Icon size={20} color={isPremium ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>{plan.name}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {plan.price === 0 ? 'Always free' : `KES ${plan.price} / month`}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={{
                      backgroundColor: 'rgba(147,51,234,0.15)', borderRadius: 20,
                      paddingHorizontal: 10, paddingVertical: 4,
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Current</Text>
                    </View>
                  )}
                </View>

                {/* Features */}
                <View style={{ marginBottom: 16, gap: 8 }}>
                  {highlights.map((f, fi) => (
                    <View key={fi} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: isPremium ? 'rgba(147,51,234,0.2)' : colors.secondary,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color={isPremium ? colors.primary : colors.mutedForeground} strokeWidth={3} />
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                {!isCurrent && (
                  <TouchableOpacity
                    onPress={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    activeOpacity={0.85}
                  >
                    {isPremium ? (
                      <LinearGradient
                        colors={[colors.primary, colors.accent]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
                      >
                        {isUpgrading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Upgrade to Premium</Text>
                        }
                      </LinearGradient>
                    ) : (
                      <View style={{
                        borderRadius: 12, paddingVertical: 13, alignItems: 'center',
                        borderWidth: 1.5, borderColor: colors.border,
                        backgroundColor: colors.secondary,
                      }}>
                        {isUpgrading
                          ? <ActivityIndicator size="small" color={colors.primary} />
                          : <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 15 }}>
                              {plan.id === 'free' ? 'Downgrade to Free' : `Switch to ${plan.name}`}
                            </Text>
                        }
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
