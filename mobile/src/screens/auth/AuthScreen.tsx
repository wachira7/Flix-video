import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
  FadeIn,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye, EyeOff, Mail, Lock, User, Zap,
  Check, X, ArrowLeft, CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

const { width: W } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const TMDB_BASE = 'https://image.tmdb.org/t/p/w342';
const CARD_W = (W / 2) - 8;
const CARD_H = 180;
const GAP = 6;

// ─── Password validation (matches frontend exactly) ─────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const passwordRules = [
  { label: 'At least 8 characters',       test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number (0–9)',             test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

function getPasswordStrength(password: string): { label: string; color: string; score: number } {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password))   score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak',   color: colors.destructive, score };
  if (score <= 3) return { label: 'Fair',   color: '#FFA00A', score };
  if (score <= 4) return { label: 'Good',   color: '#F59E0B', score };
  return           { label: 'Strong', color: colors.success,  score };
}

// ─── Poster column ──────────────────────────────────────────────────────────
interface Movie { id: number; poster_path: string | null; title: string }

const FALLBACK_GRADIENTS: [string, string][] = [
  ['#9333EA', '#DB2777'], ['#16191F', '#282E38'], ['#DB2777', '#6B21A8'],
  ['#1E2229', '#111318'], ['#7C3AED', '#EC4899'], ['#4C1D95', '#831843'],
  ['#1E1B4B', '#312E81'], ['#282E38', '#16191F'],
];

function PosterCard({ movie, idx }: { movie: Movie; idx: number }) {
  const [errored, setErrored] = useState(false);
  const grad = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];

  if (!movie.poster_path || errored) {
    return (
      <LinearGradient
        colors={grad}
        style={{ width: CARD_W, height: CARD_H, borderRadius: 10, marginBottom: GAP }}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
    );
  }
  return (
    <Image
      source={{ uri: `${TMDB_BASE}${movie.poster_path}` }}
      style={{ width: CARD_W, height: CARD_H, borderRadius: 10, marginBottom: GAP }}
      onError={() => setErrored(true)}
    />
  );
}

function PosterColumn({ movies, direction }: { movies: Movie[]; direction: 'up' | 'down' }) {
  const doubled = [...movies, ...movies];
  const colHeight = (CARD_H + GAP) * movies.length;
  const translateY = useSharedValue(direction === 'up' ? 0 : -colHeight);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(direction === 'up' ? -colHeight : 0, {
        duration: 28000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [colHeight]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <View style={{ width: CARD_W, overflow: 'hidden', flex: 1 }}>
      <Animated.View style={style}>
        {doubled.map((m, i) => <PosterCard key={`${m.id}-${i}`} movie={m} idx={i} />)}
      </Animated.View>
    </View>
  );
}

// ─── Field ──────────────────────────────────────────────────────────────────
function Field({
  icon, placeholder, value, onChangeText, secureTextEntry, onToggleSecure,
  showToggle, keyboardType, returnKeyType, onSubmitEditing, autoCapitalize, autoCorrect,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  showToggle?: boolean;
  keyboardType?: 'email-address' | 'default';
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  autoCapitalize?: 'none' | 'words';
  autoCorrect?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(30,34,41,0.9)', borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 16, paddingVertical: 2, gap: 10,
    }}>
      {icon}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={autoCorrect ?? false}
        style={{ flex: 1, color: colors.foreground, fontSize: 15, paddingVertical: 14 }}
      />
      {showToggle && onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {secureTextEntry
            ? <Eye size={18} color={colors.mutedForeground} />
            : <EyeOff size={18} color={colors.mutedForeground} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Google button ───────────────────────────────────────────────────────────
function GoogleButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 14, paddingVertical: 14, gap: 10,
      }}
    >
      {loading
        ? <ActivityIndicator size="small" color={colors.foreground} />
        : (
          <>
            {/* Google G logo colours */}
            <View style={{ width: 20, height: 20, borderRadius: 10, overflow: 'hidden' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#4285F4', lineHeight: 20, textAlign: 'center' }}>
                G
              </Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
              Continue with Google
            </Text>
          </>
        )}
    </TouchableOpacity>
  );
}

// ─── Forgot Password view ────────────────────────────────────────────────────
function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!EMAIL_REGEX.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email.');
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(300).springify()}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 }}>
        <ArrowLeft size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Back to Sign In</Text>
      </TouchableOpacity>

      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
        Reset Password
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
        Enter your email and we'll send you a link to reset your password.
      </Text>

      {sent ? (
        <Animated.View entering={ZoomIn.duration(400)} style={{ alignItems: 'center', paddingVertical: 20 }}>
          <CheckCircle2 size={56} color={colors.success} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
            Check your inbox!
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            We sent a reset link to{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{email}</Text>
          </Text>
        </Animated.View>
      ) : (
        <>
          <Field
            icon={<Mail size={18} color={colors.mutedForeground} />}
            placeholder="Your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />
          {!!error && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 10 }}>{error}</Text>
          )}
          <TouchableOpacity onPress={handleSend} disabled={loading} activeOpacity={0.85} style={{ marginTop: 20 }}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Reset Link</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
type Tab = 'login' | 'register';
type View = 'auth' | 'forgot';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [movies, setMovies]               = useState<Movie[]>([]);
  const [tab, setTab]                     = useState<Tab>('login');
  const [view, setView]                   = useState<View>('auth');
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/movies/popular`)
      .then(r => r.json())
      .then(d => {
        if (d.results?.length) setMovies(d.results.slice(0, 16));
      })
      .catch(() => {
        setMovies(Array.from({ length: 16 }, (_, i) => ({ id: i, poster_path: null, title: '' })));
      });
  }, []);

  const col1 = movies.slice(0, 8);
  const col2 = movies.slice(8, 16);

  const strength = password ? getPasswordStrength(password) : null;

  const validate = useCallback((): string | null => {
    if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (tab === 'register') {
      if (!name.trim() || name.trim().length < 2) return 'Name must be at least 2 characters.';
      if (!PASSWORD_REGEX.test(password)) return 'Password must meet all requirements below.';
      if (password !== confirmPassword) return "Passwords don't match.";
    }
    return null;
  }, [email, password, name, confirmPassword, tab]);

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = ExpoLinking.createURL('callback');
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/google`,
        redirectUrl,
      );
      if (result.type === 'success' && result.url) {
        const parsed = ExpoLinking.parse(result.url);
        const token = parsed.queryParams?.token as string | undefined;
        if (token) {
          await signInWithGoogle(token);
        } else {
          setError('Google sign-in failed. Please try again.');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t); setError('');
    setName(''); setPassword(''); setConfirmPassword('');
    setShowPass(false); setShowConfirm(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated poster background */}
      {movies.length > 0 && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          flexDirection: 'row', gap: GAP, paddingHorizontal: 4, overflow: 'hidden',
        }}>
          {col1.length > 0 && <PosterColumn movies={col1} direction="up" />}
          {col2.length > 0 && <PosterColumn movies={col2} direction="down" />}
        </View>
      )}

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['rgba(17,19,24,0.5)', 'rgba(17,19,24,0.72)', 'rgba(17,19,24,0.92)', colors.background]}
        locations={[0, 0.3, 0.6, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View
            entering={ZoomIn.duration(600).springify()}
            style={{ alignItems: 'center', paddingTop: insets.top + 40, paddingBottom: 28 }}
          >
            <View style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 24, elevation: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 10, padding: 8 }}
                >
                  <Zap size={24} color="#fff" fill="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 36, fontWeight: '800', color: colors.foreground, letterSpacing: -1 }}>
                  Flix<Text style={{ color: colors.primary }}>Video</Text>
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8, letterSpacing: 0.5 }}>
              Stream. Discover. Enjoy.
            </Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            entering={FadeInDown.duration(500).springify().damping(18)}
            style={{
              marginHorizontal: 16, marginBottom: insets.bottom + 16,
              borderRadius: 24, overflow: 'hidden',
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <BlurView intensity={70} tint="dark" style={{ padding: 24 }}>

              {/* ── Forgot password view ── */}
              {view === 'forgot' ? (
                <ForgotPasswordView onBack={() => setView('auth')} />
              ) : (
                <>
                  {/* Tab switcher */}
                  <View style={{
                    flexDirection: 'row', backgroundColor: colors.secondary,
                    borderRadius: 14, padding: 4, marginBottom: 24,
                  }}>
                    {(['login', 'register'] as Tab[]).map(t => (
                      <TouchableOpacity key={t} onPress={() => switchTab(t)} activeOpacity={0.8} style={{ flex: 1 }}>
                        {tab === t ? (
                          <LinearGradient
                            colors={[colors.primary, colors.accent]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                              {t === 'login' ? 'Sign In' : 'Create Account'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                            <Text style={{ color: colors.mutedForeground, fontWeight: '600', fontSize: 14 }}>
                              {t === 'login' ? 'Sign In' : 'Create Account'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Name (register only) */}
                  {tab === 'register' && (
                    <Animated.View entering={FadeInDown.duration(250)} style={{ marginBottom: 12 }}>
                      <Field
                        icon={<User size={18} color={colors.mutedForeground} />}
                        placeholder="Full name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </Animated.View>
                  )}

                  {/* Email */}
                  <View style={{ marginBottom: 12 }}>
                    <Field
                      icon={<Mail size={18} color={colors.mutedForeground} />}
                      placeholder="Email address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Password */}
                  <View style={{ marginBottom: 6 }}>
                    <Field
                      icon={<Lock size={18} color={colors.mutedForeground} />}
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPass}
                      showToggle
                      onToggleSecure={() => setShowPass(v => !v)}
                      returnKeyType={tab === 'register' ? 'next' : 'done'}
                      onSubmitEditing={tab === 'login' ? handleSubmit : undefined}
                    />
                  </View>

                  {/* Password strength bar + label */}
                  {tab === 'register' && password.length > 0 && strength && (
                    <Animated.View entering={FadeIn.duration(200)} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <View
                            key={i}
                            style={{
                              flex: 1, height: 3, borderRadius: 2,
                              backgroundColor: i <= Math.ceil((strength.score / 6) * 4)
                                ? strength.color
                                : colors.border,
                            }}
                          />
                        ))}
                      </View>
                      <Text style={{ color: strength.color, fontSize: 12, fontWeight: '600' }}>
                        {strength.label}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Password requirements (register only) */}
                  {tab === 'register' && (
                    <Animated.View entering={FadeInDown.duration(250)} style={{ marginBottom: 12 }}>
                      {passwordRules.map(rule => {
                        const met = rule.test(password);
                        return (
                          <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {met
                              ? <Check size={13} color={colors.success} />
                              : <X size={13} color={colors.mutedForeground} />}
                            <Text style={{ color: met ? colors.success : colors.mutedForeground, fontSize: 12 }}>
                              {rule.label}
                            </Text>
                          </View>
                        );
                      })}
                    </Animated.View>
                  )}

                  {/* Confirm password (register only) */}
                  {tab === 'register' && (
                    <Animated.View entering={FadeInDown.duration(250)} style={{ marginBottom: 16 }}>
                      <Field
                        icon={<Lock size={18} color={colors.mutedForeground} />}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        showToggle
                        onToggleSecure={() => setShowConfirm(v => !v)}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                      {confirmPassword.length > 0 && (
                        <Text style={{
                          fontSize: 12, marginTop: 4, marginLeft: 4,
                          color: confirmPassword === password ? colors.success : colors.destructive,
                        }}>
                          {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </Text>
                      )}
                    </Animated.View>
                  )}

                  {/* Error */}
                  {!!error && (
                    <Animated.View entering={FadeIn.duration(200)} style={{
                      backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10,
                      padding: 12, marginBottom: 14,
                    }}>
                      <Text style={{ color: colors.destructive, fontSize: 13, textAlign: 'center' }}>
                        {error}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Submit */}
                  <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={submitting} style={{ marginBottom: 14 }}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                        shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
                      }}
                    >
                      {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                            {tab === 'login' ? 'Sign In' : 'Create Account'}
                          </Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                    <Text style={{ color: colors.mutedForeground, paddingHorizontal: 12, fontSize: 12 }}>or</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  </View>

                  {/* Google */}
                  <View style={{ marginBottom: 16 }}>
                    <GoogleButton onPress={handleGoogle} loading={googleLoading} />
                  </View>

                  {/* Forgot password (login only) */}
                  {tab === 'login' && (
                    <TouchableOpacity onPress={() => setView('forgot')} style={{ alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                        Forgot password?{' '}
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Reset it</Text>
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Switch tab */}
                  <Text style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 13 }}>
                    {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <Text
                      onPress={() => switchTab(tab === 'login' ? 'register' : 'login')}
                      style={{ color: colors.primary, fontWeight: '700' }}
                    >
                      {tab === 'login' ? 'Create one' : 'Sign in'}
                    </Text>
                  </Text>
                </>
              )}

            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
