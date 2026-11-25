/**
 * Dedicated Supabase Auth Callback Handler (/auth/callback) for NurseGo
 *
 * Processes:
 * - Error query/hash parameters returned by Supabase Auth
 * - PKCE authorization code (`?code=...` via `exchangeCodeForSession`)
 * - Email OTP token hashes (`?token_hash=...&type=...` via `verifyOtp`)
 * - Implicit hash fragments (`#access_token=...` via `detectSessionInUrl` + `getSession`)
 */

import React, { useEffect, useRef, useState } from 'react';
import { EmailOtpType } from '@supabase/supabase-js';
import { isRecoverySession, useAuth } from '../../context/AuthContext';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { CheckCircle2, AlertCircle, HeartPulse, ArrowRight, Loader2 } from 'lucide-react';

interface AuthCallbackProps {
  onComplete: (target?: 'portal' | 'recovery' | 'welcome' | 'nurse_login' | 'patient_login') => void;
}

type CallbackStatus = 'processing' | 'success' | 'error';

const VALID_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function translateCallbackError(rawCode?: string | null, rawDesc?: string | null): string {
  const code = (rawCode || '').toLowerCase();
  const desc = (rawDesc || '').toLowerCase();

  if (code.includes('otp_expired') || desc.includes('expired')) {
    return 'Tautan ini sudah kedaluwarsa. Silakan minta tautan baru dari halaman masuk.';
  }
  if (code.includes('access_denied') || desc.includes('invalid') || desc.includes('already')) {
    return 'Tautan ini tidak valid atau sudah pernah digunakan. Silakan minta tautan baru.';
  }
  if (rawDesc) {
    return rawDesc;
  }
  return 'Tautan email belum bisa diproses. Silakan coba minta tautan baru.';
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onComplete }) => {
  const { user, role, isPasswordRecovery, refreshProfile } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [flowKind, setFlowKind] = useState<'signup' | 'recovery' | 'other'>('signup');
  const [message, setMessage] = useState<string>('Sedang memeriksa tautan Anda...');
  const [resolvedRole, setResolvedRole] = useState<'nurse' | 'patient' | null>(null);
  const hasProcessedRef = useRef(false);
  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isPasswordRecovery) {
      setFlowKind('recovery');
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    let active = true;

    async function processAuthCallback() {
      if (typeof window === 'undefined') return;

      const searchParams = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);

      const urlError = searchParams.get('error') || hashParams.get('error');
      const urlErrorCode = searchParams.get('error_code') || hashParams.get('error_code');
      const urlErrorDesc =
        searchParams.get('error_description') || hashParams.get('error_description');

      if (urlError || urlErrorDesc) {
        if (!active) return;
        setStatus('error');
        setMessage(translateCallbackError(urlErrorCode || urlError, urlErrorDesc));
        return;
      }

      if (!isSupabaseConfigured()) {
        if (!active) return;
        setStatus('error');
        setMessage(
          'Maaf, tautan belum bisa diproses saat ini. Silakan coba lagi beberapa saat lagi.'
        );
        return;
      }

      const typeParam = (searchParams.get('type') || hashParams.get('type') || '').toLowerCase();
      const codeParam = searchParams.get('code');
      const tokenHashParam = searchParams.get('token_hash');
      const hasHashAccessToken = Boolean(hashParams.get('access_token'));

      if (typeParam === 'recovery') {
        setFlowKind('recovery');
      } else if (typeParam === 'signup' || typeParam === 'email') {
        setFlowKind('signup');
      } else {
        setFlowKind('other');
      }

      const supabase = getSupabase();

      try {
        // 1. Check whether detectSessionInUrl already resolved the session
        let {
          data: { session },
          error: sessErr,
        } = await supabase.auth.getSession();

        if (sessErr) {
          throw sessErr;
        }

        // 2. Handle PKCE authorization code if session not yet active
        if (!session && codeParam) {
          const { data: exchangeData, error: exchangeErr } =
            await supabase.auth.exchangeCodeForSession(codeParam);
          if (exchangeErr) {
            // Re-check session once in case client initialization already consumed the single-use code
            const retry = await supabase.auth.getSession();
            if (!retry.data.session) {
              throw exchangeErr;
            }
            session = retry.data.session;
          } else {
            session = exchangeData.session;
          }
        }
        // 3. Handle token_hash verification (e.g. OTP / email link with token_hash)
        else if (!session && tokenHashParam && VALID_OTP_TYPES.has(typeParam as EmailOtpType)) {
          const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHashParam,
            type: typeParam as EmailOtpType,
          });
          if (otpErr) {
            throw otpErr;
          }
          session = otpData.session;
        }
        // 4. Wait briefly if hash access_token was present and auth listener is finalizing
        else if (!session && hasHashAccessToken) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
        }

        if (!active) return;

        if (session?.user) {
          const metaRole = session.user.user_metadata?.role;
          if (metaRole === 'nurse' || metaRole === 'patient') {
            setResolvedRole(metaRole);
          }

          const isRecoveryFlow =
            typeParam === 'recovery' ||
            searchParams.get('flow') === 'recovery' ||
            isRecoverySession(session);

          await refreshProfileRef.current();
          if (!active) return;

          if (isRecoveryFlow) {
            setFlowKind('recovery');
            setStatus('success');
            setMessage(
              'Tautan berhasil diperiksa. Sebentar, Anda akan diarahkan untuk membuat kata sandi baru...'
            );
            onCompleteRef.current('recovery');
            return;
          }

          setStatus('success');
          if (metaRole === 'nurse') {
            setMessage(
              'Email Anda berhasil diverifikasi. Silakan lanjutkan ke Portal Perawat.'
            );
          } else if (metaRole === 'patient') {
            setMessage(
              'Email Anda berhasil diverifikasi. Silakan lanjutkan ke Portal Pasien.'
            );
          } else {
            setMessage('Email berhasil diverifikasi. Anda bisa melanjutkan ke halaman masuk.');
          }
          return;
        }

        // Valid token_hash verification without active session (e.g. opened in a separate device/browser)
        if (tokenHashParam) {
          setStatus('success');
          setMessage(
            'Email Anda sudah terverifikasi. Silakan masuk menggunakan email dan kata sandi yang telah dibuat.'
          );
          return;
        }

        setStatus('error');
        setMessage(
          'Tautan tidak dapat dikenali. Silakan buka tautan terbaru yang kami kirim ke email Anda.'
        );
      } catch (err: any) {
        if (!active) return;
        setStatus('error');
        setMessage(translateCallbackError(err?.code, err?.message));
      }
    }

    processAuthCallback();

    return () => {
      active = false;
    };
  }, []);

  const effectiveRole = role || resolvedRole;

  return (
    <div className="min-h-screen relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#d9f3ef_0%,_#f4f8fa_42%,_#eef4f8_100%)] flex items-center justify-center p-3 sm:p-6">
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-[28px] border border-white/80 ring-1 ring-slate-200/70 p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-[0_24px_70px_-28px_rgba(15,76,80,0.28)]">
        <div className="flex items-center justify-center gap-2 text-teal-700 font-bold text-sm">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <span>NurseGo</span>
        </div>

        {status === 'processing' && (
          <>
            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Memproses Verifikasi Akun</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {flowKind === 'recovery'
                  ? 'Tautan Pemulihan Terverifikasi'
                  : effectiveRole === 'nurse'
                  ? 'Email Perawat Terverifikasi'
                  : effectiveRole === 'patient'
                  ? 'Akun Pasien Terverifikasi'
                  : 'Verifikasi Berhasil'}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => onComplete(flowKind === 'recovery' ? 'recovery' : 'portal')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-700/15 inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>
                  {flowKind === 'recovery'
                    ? 'Buat Kata Sandi Baru'
                    : effectiveRole === 'nurse'
                    ? 'Masuk ke Portal Perawat'
                    : effectiveRole === 'patient'
                    ? 'Masuk ke Portal Pasien'
                    : 'Lanjutkan ke NurseGo'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onComplete('nurse_login')}
                  className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Masuk Portal Perawat
                </button>
                <button
                  type="button"
                  onClick={() => onComplete('patient_login')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
                >
                  Masuk Portal Pasien
                </button>
              </div>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verifikasi Tidak Dapat Diproses</h1>
              <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onComplete('nurse_login')}
                  className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Masuk Portal Perawat
                </button>
                <button
                  type="button"
                  onClick={() => onComplete('patient_login')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
                >
                  Masuk Portal Pasien
                </button>
              </div>
              <button
                type="button"
                onClick={() => onComplete('welcome')}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Kembali ke Pilihan Portal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
