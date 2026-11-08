/**
 * Authentication & Role Authorization Context for NurseGo
 * 
 * Sesuai spesifikasi:
 * - Menggunakan Supabase Auth sebagai pengendali akses sebenarnya
 * - Pengambilan profil berdasarkan auth.uid()
 * - Pemisahan ketat role perawat ('nurse') dan pasien ('patient')
 * - Registrasi perawat dengan nomor STR (status awal 'pending')
 * - Akun pasien melalui alur aktivasi undangan
 * - Penanganan loading, error, empty state, dan session expiry
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile, NurseProfile, PatientProfile, PatientSurgery, UserRole } from '../types/database';
import { DEMO_NURSE, DEMO_PATIENTS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  nurseProfile: NurseProfile | null;
  patientProfile: PatientProfile | null;
  patientSurgery: PatientSurgery | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpNurse: (data: {
    email: string;
    password: string;
    fullName: string;
    strNumber: string;
    department?: string;
    hospitalName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  activatePatient: (data: {
    email: string;
    password: string;
    fullName: string;
    token?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (demoRole: 'nurse' | 'patient') => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  recheckConfiguration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [patientSurgery, setPatientSurgery] = useState<PatientSurgery | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConfiguredState, setIsConfiguredState] = useState<boolean>(isSupabaseConfigured());

  const recheckConfiguration = useCallback(() => {
    const configured = isSupabaseConfigured();
    setIsConfiguredState(configured);
  }, []);

  // Fetch full user profile & role-specific profile based on auth.uid()
  const fetchUserProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    try {
      // 1. Fetch main profile
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profError) {
        console.error('Error fetching profile:', profError.message);
      }

      if (profData) {
        setProfile(profData);
        setRole(profData.role as UserRole);

        // 2. Fetch role-specific details
        if (profData.role === 'nurse') {
          const { data: nData, error: nError } = await supabase
            .from('nurse_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!nError && nData) {
            setNurseProfile(nData);
          } else {
            // Check if foreign key uses nurse_id
            const { data: nDataAlt } = await supabase
              .from('nurse_profiles')
              .select('*')
              .eq('nurse_id', userId)
              .maybeSingle();
            if (nDataAlt) setNurseProfile(nDataAlt);
          }
        } else if (profData.role === 'patient') {
          // Fetch patient profile
          const { data: pData } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (pData) setPatientProfile(pData);

          // Fetch patient surgery info
          const { data: surgData } = await supabase
            .from('patient_surgeries')
            .select('*, surgery_type:surgery_types(*)')
            .eq('patient_id', userId)
            .order('surgery_date', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (surgData) setPatientSurgery(surgData);
        }
      } else {
        // Fallback: check user metadata if profile table hasn't triggered yet
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.user_metadata?.role) {
          const fallbackRole = userData.user.user_metadata.role as UserRole;
          setRole(fallbackRole);
          setProfile({
            id: userId,
            email: userData.user.email || '',
            full_name: userData.user.user_metadata.full_name || 'Pengguna',
            role: fallbackRole,
          });
        }
      }
    } catch (err: any) {
      console.error('Error during profile loading:', err);
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    async function initAuth() {
      setIsLoading(true);
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Initial session error:', error.message);
        }
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        await fetchUserProfile(newSession.user.id);
      } else {
        setProfile(null);
        setNurseProfile(null);
        setPatientProfile(null);
        setPatientSurgery(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign In with email & password
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email atau kata sandi tidak valid. Silakan periksa kembali.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Alamat email belum dikonfirmasi. Silakan periksa kotak masuk email Anda.';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      if (data?.user) {
        await fetchUserProfile(data.user.id);
      }
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan saat masuk ke sistem.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Sign Up for Nurses with mandatory STR & verification status = 'pending'
  const signUpNurse = async (data: {
    email: string;
    password: string;
    fullName: string;
    strNumber: string;
    department?: string;
    hospitalName?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const supabase = getSupabase();

    try {
      // 1. Supabase Auth registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            role: 'nurse',
            str_number: data.strNumber.trim(),
          },
        },
      });

      if (authError) {
        let msg = authError.message;
        if (msg.includes('already registered')) {
          msg = 'Email perawat ini sudah terdaftar dalam sistem.';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const newUserId = authData?.user?.id;
      if (!newUserId) {
        return { success: false, error: 'Gagal membuat identitas pengguna perawat.' };
      }

      // 2. Insert into profiles table
      const { error: profError } = await supabase
        .from('profiles')
        .upsert({
          id: newUserId,
          email: data.email.trim(),
          full_name: data.fullName.trim(),
          role: 'nurse',
          phone: data.phone || null,
        });

      if (profError) {
        console.warn('Profile creation notice:', profError.message);
      }

      // 3. Insert into nurse_profiles with verification_status = 'pending'
      const { error: nurseProfError } = await supabase
        .from('nurse_profiles')
        .upsert({
          id: newUserId,
          str_number: data.strNumber.trim(),
          verification_status: 'pending',
          department: data.department || 'Rawat Bedah Postoperatif',
          hospital_name: data.hospitalName || 'RS / Klinik Mitra',
        });

      if (nurseProfError) {
        console.warn('Nurse profile creation notice:', nurseProfError.message);
      }

      // Refresh current user
      await fetchUserProfile(newUserId);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Gagal mendaftarkan akun perawat.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Patient account activation
  const activatePatient = async (data: {
    email: string;
    password: string;
    fullName: string;
    token?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const supabase = getSupabase();

    try {
      // Check invitation if token provided
      let inviteData = null;
      if (data.token) {
        const { data: inv, error: invErr } = await supabase
          .from('patient_invitations')
          .select('*')
          .eq('token', data.token.trim())
          .maybeSingle();

        if (invErr || !inv) {
          return { success: false, error: 'Token undangan tidak valid atau tidak ditemukan.' };
        }
        if (inv.status === 'accepted') {
          return { success: false, error: 'Undangan ini sudah pernah diaktifkan sebelumnya.' };
        }
        inviteData = inv;
      }

      // Register auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            role: 'patient',
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const patientUserId = authData?.user?.id;
      if (!patientUserId) {
        return { success: false, error: 'Gagal membuat identitas pasien.' };
      }

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: patientUserId,
        email: data.email.trim(),
        full_name: data.fullName.trim(),
        role: 'patient',
      });

      // Upsert patient_profiles
      await supabase.from('patient_profiles').upsert({
        id: patientUserId,
      });

      // Update invitation status & assign nurse
      if (inviteData) {
        await supabase
          .from('patient_invitations')
          .update({ status: 'accepted' })
          .eq('id', inviteData.id);

        if (inviteData.nurse_id) {
          await supabase.from('patient_nurse_assignments').upsert({
            patient_id: patientUserId,
            nurse_id: inviteData.nurse_id,
            is_active: true,
          });
        }
      }

      await fetchUserProfile(patientUserId);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Gagal mengaktifkan akun pasien.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setNurseProfile(null);
      setPatientProfile(null);
      setPatientSurgery(null);
      setRole(null);
    }
  };

  const loginAsDemo = (demoRole: 'nurse' | 'patient') => {
    if (demoRole === 'nurse') {
      const demoUser = {
        id: DEMO_NURSE.id,
        email: DEMO_NURSE.email,
        app_metadata: {},
        user_metadata: { role: 'nurse', full_name: DEMO_NURSE.full_name },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      setProfile(DEMO_NURSE);
      setNurseProfile(DEMO_NURSE.nurse_profile);
      setRole('nurse');
      setPatientProfile(null);
      setPatientSurgery(null);
    } else {
      const demoPat = DEMO_PATIENTS[0];
      const demoUser = {
        id: demoPat.profile.id,
        email: demoPat.profile.email,
        app_metadata: {},
        user_metadata: { role: 'patient', full_name: demoPat.profile.full_name },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      setProfile(demoPat.profile);
      setPatientProfile(demoPat.patient_profile);
      setPatientSurgery(demoPat.surgery);
      setRole('patient');
      setNurseProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        nurseProfile,
        patientProfile,
        patientSurgery,
        role,
        isLoading,
        isConfigured: isConfiguredState,
        authError,
        setAuthError,
        signIn,
        signUpNurse,
        activatePatient,
        loginAsDemo,
        signOut,
        refreshProfile,
        recheckConfiguration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
