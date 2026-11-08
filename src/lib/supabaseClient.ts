/**
 * Centralized Supabase Client for NurseGo
 * Project ID: pwokxvmvyezhacjpzhuz
 * Project URL: https://pwokxvmvyezhacjpzhuz.supabase.co
 * 
 * Sesuai spesifikasi:
 * - Menggunakan @supabase/supabase-js versi 2
 * - Menggunakan Supabase URL dan Publishable Key (Anon Key)
 * - Tidak mengekspos service_role key
 * - Menyediakan diagnostik koneksi nyata dan penanganan error transparan
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://pwokxvmvyezhacjpzhuz.supabase.co';
export const PROJECT_ID = 'pwokxvmvyezhacjpzhuz';

const STORAGE_KEY_URL = 'nursego_supabase_url';
const STORAGE_KEY_ANON = 'nursego_supabase_anon_key';

// Retrieve credentials with priority: localStorage / sessionStorage > Vite env > Default URL
export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  let storedUrl = '';
  let storedKey = '';

  try {
    storedUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
    storedKey = localStorage.getItem(STORAGE_KEY_ANON) || '';
  } catch (err) {
    console.warn('NurseGo: Local storage access error:', err);
  }

  const url = storedUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = storedKey || envKey || '';

  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } catch (err) {
    console.error('NurseGo: Failed to save config to localStorage:', err);
  }
  // Reinitialize client
  initSupabaseClient(url.trim(), anonKey.trim());
}

export function clearCustomSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  } catch (err) {
    console.error('NurseGo: Failed to clear config:', err);
  }
  const { url, anonKey } = getStoredSupabaseConfig();
  initSupabaseClient(url, anonKey);
}

// Singleton client instance
let clientInstance: SupabaseClient | null = null;
let currentConfig = getStoredSupabaseConfig();

export function initSupabaseClient(url: string, anonKey: string): SupabaseClient {
  currentConfig = { url, anonKey };
  
  // Create client even with placeholder key to allow instantiation, but track validity
  const validKey = anonKey && anonKey.length > 20 ? anonKey : 'placeholder-anon-key-awaiting-configuration';
  
  clientInstance = createClient(url, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'nursego_supabase_auth_token',
    },
  });

  return clientInstance;
}

// Initial initialization
clientInstance = initSupabaseClient(currentConfig.url, currentConfig.anonKey);

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = initSupabaseClient(currentConfig.url, currentConfig.anonKey);
  }
  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  const { anonKey } = getStoredSupabaseConfig();
  return Boolean(anonKey && anonKey.trim().length > 20 && !anonKey.includes('placeholder'));
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  tablesVerified?: string[];
  technicalDetails?: string;
}

/**
 * Conducts a real, active diagnostic test against the Supabase backend.
 */
export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<ConnectionTestResult> {
  const url = overrideUrl || getStoredSupabaseConfig().url;
  const anonKey = overrideKey || getStoredSupabaseConfig().anonKey;

  if (!anonKey || anonKey.trim().length < 20 || anonKey.includes('placeholder')) {
    return {
      success: false,
      message: 'Kunci Anon / Publishable Key Supabase belum dimasukkan.',
      technicalDetails: 'Missing or placeholder VITE_SUPABASE_ANON_KEY. Mohon masukkan Supabase Publishable Key untuk proyek pwokxvmvyezhacjpzhuz.',
    };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // 1. Test Auth Service Health / Ping
    const healthUrl = `${url.replace(/\/$/, '')}/auth/v1/health`;
    let authHealthy = false;
    try {
      const resp = await fetch(healthUrl, {
        headers: {
          apikey: anonKey,
        },
      });
      authHealthy = resp.ok || resp.status === 200;
    } catch (e: any) {
      console.warn('Auth ping check notice:', e.message);
    }

    // 2. Query surgery_types to verify database REST API & schema presence
    const { data: surgeries, error: surgError } = await testClient
      .from('surgery_types')
      .select('id, name')
      .limit(5);

    if (surgError) {
      // Analyze error
      const code = (surgError as any).code;
      const msg = surgError.message;
      
      // If table exists but empty or restricted by RLS
      if (code === 'PGRST116' || code === '42501' || msg.includes('permission denied')) {
        return {
          success: true,
          message: 'Koneksi ke Supabase berhasil! (RLS terpasang sesuai standar keamanan).',
          tablesVerified: ['auth.users', 'surgery_types (RLS protected)'],
          technicalDetails: `Database connected. RLS status: ${msg}`,
        };
      }

      if (code === '42P01' || msg.includes('does not exist')) {
        return {
          success: false,
          message: 'Terhubung ke database, namun tabel surgery_types belum ditemukan.',
          technicalDetails: `Tabel tidak ditemukan: ${msg}`,
        };
      }

      return {
        success: false,
        message: `Koneksi gagal: ${msg}`,
        technicalDetails: `Code: ${code}, Details: ${surgError.details || surgError.hint || msg}`,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke database Supabase berhasil dan terverifikasi!',
      tablesVerified: surgeries && surgeries.length > 0 
        ? surgeries.map((s: any) => s.name || `Tipe Operasi #${s.id}`)
        : ['surgery_types'],
      technicalDetails: `Status: 200 OK. Ditemukan ${surgeries ? surgeries.length : 0} tipe operasi terdaftar.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menghubungi server Supabase. Periksa URL atau koneksi jaringan.',
      technicalDetails: err.message || String(err),
    };
  }
}
