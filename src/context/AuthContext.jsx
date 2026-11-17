import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  authRedirectUrl,
  friendlyDataError,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

const AuthContext = createContext(null);

const fallbackProfile = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username:
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Слухач Music Player 1228',
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: user.created_at || new Date().toISOString(),
  };
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const user = session?.user || null;

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return undefined;
    }
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.warn('[Music Player 1228] Не вдалося відновити сесію', error);
        setSession(data?.session || null);
        setSessionLoading(false);
      })
      .catch((error) => {
        if (!alive) return;
        console.warn('[Music Player 1228] Помилка сесії', error);
        setSessionLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!alive) return;
      setSession(nextSession || null);
      setSessionLoading(false);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async (targetUser = user) => {
    if (!supabase || !targetUser) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
    setProfileLoading(true);
    setProfileError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at, updated_at')
      .eq('id', targetUser.id)
      .maybeSingle();

    if (error) {
      setProfileError(friendlyDataError(error, 'Не вдалося завантажити профіль.'));
      setProfile(fallbackProfile(targetUser));
      setProfileLoading(false);
      return null;
    }

    if (data) {
      setProfile(data);
      setProfileLoading(false);
      return data;
    }

    // Older accounts may predate the database trigger. Heal them once.
    const username =
      targetUser.user_metadata?.username ||
      targetUser.email?.split('@')[0] ||
      'Слухач Music Player 1228';
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: targetUser.id, username })
      .select('id, username, avatar_url, created_at, updated_at')
      .single();

    if (createError) {
      setProfileError(friendlyDataError(createError, 'Не вдалося створити профіль.'));
      setProfile(fallbackProfile(targetUser));
    } else {
      setProfile(created);
    }
    setProfileLoading(false);
    return created || null;
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    fetchProfile(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* Moderators can delete other people's tracks (see supabase/schema.sql). */
  useEffect(() => {
    if (!supabase || !user?.id) {
      setIsAdmin(false);
      return undefined;
    }
    let alive = true;
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (
          error &&
          error.code !== 'PGRST116' &&
          error.code !== 'PGRST205' &&
          !/Could not find the table|schema cache/i.test(error.message || '')
        ) {
          console.warn('[Music Player 1228] Не вдалося перевірити права модератора', error);
        }
        setIsAdmin(Boolean(data));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase не налаштовано.');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    setAuthOpen(false);
    return true;
  }, []);

  const signUp = useCallback(async ({ email, password, username }) => {
    if (!supabase) throw new Error('Supabase не налаштовано.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
        emailRedirectTo: authRedirectUrl(),
      },
    });
    if (error) throw error;
    if (data.session) {
      setAuthOpen(false);
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      if (!supabase || !user) throw new Error('Потрібно увійти в акаунт.');
      const username = (patch.username || '').trim();
      if (username.length < 2) throw new Error('Нікнейм має містити щонайменше 2 символи.');
      if (username.length > 30) throw new Error('Нікнейм має бути не довшим за 30 символів.');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username,
          ...(patch.avatar_url !== undefined ? { avatar_url: patch.avatar_url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id, username, avatar_url, created_at, updated_at')
        .single();

      if (error) throw error;
      setProfile(data);
      // Keep auth metadata in sync for future sessions (best effort).
      supabase.auth.updateUser({ data: { username } }).catch(() => {});
      return data;
    },
    [user],
  );

  const openAuth = useCallback((mode = 'signin') => {
    setAuthMode(mode === 'signup' ? 'signup' : 'signin');
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      session,
      user,
      profile,
      profileLoading,
      profileError,
      isAdmin,
      loading: sessionLoading,
      authOpen,
      authMode,
      setAuthMode,
      openAuth,
      closeAuth,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile: fetchProfile,
      isOwner: (id) => Boolean(user?.id && id && user.id === id),
    }),
    [
      session,
      user,
      profile,
      profileLoading,
      profileError,
      isAdmin,
      sessionLoading,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      signIn,
      signUp,
      signOut,
      updateProfile,
      fetchProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
