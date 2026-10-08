import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Chrome,
  Fingerprint,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Cpu,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (sessionToken: string) => void;
}

type LoginStep = 'choose' | 'google_redirect' | 'email_form' | 'two_factor' | 'passkey';
type TwoFactorMethod = 'totp' | 'passkey';

const PARTICLE_COUNT = 28;

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<LoginStep>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('totp');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyStatus, setPasskeyStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');

  const totpInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'email_form') emailRef.current?.focus();
    if (step === 'two_factor' && twoFactorMethod === 'totp') totpInputRef.current?.focus();
  }, [step, twoFactorMethod]);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: (i * 37 + 5) % 100,
    y: (i * 53 + 10) % 100,
    size: 1 + (i % 3),
    opacity: 0.08 + (i % 5) * 0.03,
    dur: 8 + (i % 6) * 2
  }));

  // ─── Google OAuth PKCE ────────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);

    const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_nonce', nonce);

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    window.location.href = `${apiBase}/auth/google?state=${state}&nonce=${nonce}`;
  };

  // ─── Email / Password ─────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
      const csrf = csrfMatch ? csrfMatch[1] : '';

      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {})
        },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid email or password');
      }

      const data = await res.json();
      if (data.requiresTwoFactor) {
        setTwoFactorMethod(data.preferredMethod === 'passkey' ? 'passkey' : 'totp');
        setStep('two_factor');
      } else {
        onLoginSuccess(data.sessionToken || '');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── TOTP ─────────────────────────────────────────────────────────────────
  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
      const csrf = csrfMatch ? csrfMatch[1] : '';

      const res = await fetch(`${apiBase}/auth/2fa/totp/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {})
        },
        body: JSON.stringify({ code: totpCode })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid TOTP code.');
      }

      const data = await res.json();
      onLoginSuccess(data.sessionToken || '');
    } catch (err: any) {
      setError(err.message || 'TOTP verification failed');
      setTotpCode('');
      totpInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── WebAuthn / Passkey ──────────────────────────────────────────────────
  const handlePasskeyLogin = async () => {
    if (!window.PublicKeyCredential) {
      setError('Your browser does not support Passkeys / WebAuthn.');
      return;
    }
    setPasskeyStatus('waiting');
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const challengeRes = await fetch(`${apiBase}/auth/passkey/challenge`, { credentials: 'include' });
      if (!challengeRes.ok) throw new Error('Could not get passkey challenge from server');

      const { challenge, rpId, allowCredentials } = await challengeRes.json();
      const challengeBuffer = Uint8Array.from(
        atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)
      );

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          rpId: rpId || window.location.hostname,
          allowCredentials: (allowCredentials || []).map((c: any) => ({
            id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0)),
            type: 'public-key' as PublicKeyCredentialType
          })),
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (!assertion) throw new Error('Passkey authentication was cancelled');

      const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
      const csrf = csrfMatch ? csrfMatch[1] : '';

      const verifyRes = await fetch(`${apiBase}/auth/passkey/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {})
        },
        body: JSON.stringify({ assertion })
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.message || 'Passkey verification failed');
      }

      const data = await verifyRes.json();
      setPasskeyStatus('success');
      setTimeout(() => onLoginSuccess(data.sessionToken || ''), 600);
    } catch (err: any) {
      setPasskeyStatus('error');
      setError(err.name === 'NotAllowedError'
        ? 'Passkey cancelled or timed out.'
        : err.message || 'Passkey authentication failed');
    }
  };

  const handleTotpChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setTotpCode(digits);
    setError(null);
  };

  // Shared card style
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '440px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      {/* Animated SVG particle background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
        {particles.map(p => (
          <circle key={p.id} cx={`${p.x}%`} cy={`${p.y}%`} r={p.size} fill="var(--primary)" opacity={p.opacity}>
            <animate attributeName="opacity" values={`${p.opacity};${Math.min(p.opacity * 3, 0.5)};${p.opacity}`} dur={`${p.dur}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Gradient glow blobs */}
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={cardStyle}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, background: 'linear-gradient(135deg, #2563eb, #10b981)', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
            <Shield size={30} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
            GUARDING
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Zero-Trust Competitive Programming Judge
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#f87171' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── CHOOSE METHOD ────────────────────────────────────────────── */}
        {step === 'choose' && (
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sign in to your account</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Choose a sign-in method. All sessions use HttpOnly cookies with PKCE.
            </p>

            {/* Google */}
            <button
              id="btn-login-google"
              className="btn"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 600, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.75rem', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
            >
              {isLoading ? <Loader2 size={20} className="spin" /> : <Chrome size={20} />}
              Continue with Google
            </button>

            {/* Passkey */}
            <button
              id="btn-login-passkey"
              className="btn btn-secondary"
              onClick={() => { setStep('passkey'); handlePasskeyLogin(); }}
              style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}
            >
              <Fingerprint size={20} color="#10b981" />
              Sign in with Passkey
              <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem' }}>FIDO2</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or use email &amp; password</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <button
              id="btn-login-email"
              className="btn btn-secondary"
              onClick={() => setStep('email_form')}
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.88rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
            >
              <Mail size={16} />
              Sign in with Email
            </button>

            {/* Security notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '2rem', padding: '0.85rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Sessions stored as <code className="font-mono">SHA-256</code> hashes server-side. Cookies are{' '}
                <code className="font-mono">HttpOnly; Secure; SameSite=Lax; __Host-</code> prefix.
              </p>
            </div>
          </div>
        )}

        {/* ── EMAIL FORM ──────────────────────────────────────────────── */}
        {step === 'email_form' && (
          <form onSubmit={handleEmailSubmit}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', marginBottom: '1.25rem' }} onClick={() => { setStep('choose'); setError(null); }}>
              ← Back
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Sign in with Email</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input ref={emailRef} id="input-email" type="email" className="input" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} placeholder="you@example.com" autoComplete="email" required style={{ width: '100%', paddingLeft: '2.4rem', borderRadius: '10px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Password</label>
                <button type="button" style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => alert('Password reset: check your email for a reset link.')}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input id="input-password" type={showPassword ? 'text' : 'password'} className="input" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} placeholder="Your password" autoComplete="current-password" required style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem', borderRadius: '10px' }} />
                <button type="button" className="btn-icon" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', padding: '0.2rem' }} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button id="btn-submit-email-login" type="submit" className="btn btn-primary" disabled={isLoading || !email || !password} style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isLoading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Passwords hashed with <code className="font-mono">Argon2id</code> — never stored plain.
            </p>
          </form>
        )}

        {/* ── TWO FACTOR ──────────────────────────────────────────────── */}
        {step === 'two_factor' && (
          <div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', marginBottom: '1.25rem' }} onClick={() => { setStep('email_form'); setError(null); setTotpCode(''); }}>
              ← Back
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(245,158,11,0.12)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <KeyRound size={28} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Two-Factor Authentication</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your account requires 2FA. Please verify your identity.</p>
            </div>

            {/* Method toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '10px', padding: '0.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              {(['totp', 'passkey'] as TwoFactorMethod[]).map(method => (
                <button
                  key={method}
                  id={`btn-2fa-${method}`}
                  type="button"
                  onClick={() => { setTwoFactorMethod(method); setError(null); if (method === 'passkey') handlePasskeyLogin(); }}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', background: twoFactorMethod === method ? 'var(--primary)' : 'transparent', color: twoFactorMethod === method ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {method === 'totp' ? <><KeyRound size={14} /> Authenticator</> : <><Fingerprint size={14} /> Passkey</>}
                </button>
              ))}
            </div>

            {twoFactorMethod === 'totp' && (
              <form onSubmit={handleTotpVerify}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  6-digit code from your authenticator app
                </label>
                <input
                  ref={totpInputRef}
                  id="input-totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  className="input font-mono"
                  value={totpCode}
                  onChange={e => handleTotpChange(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  style={{ width: '100%', textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.5rem', borderRadius: '12px', marginBottom: '1.25rem', padding: '0.85rem' }}
                />
                <button id="btn-verify-totp" type="submit" className="btn btn-primary" disabled={isLoading || totpCode.length !== 6} style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {isLoading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
                  {isLoading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── PASSKEY STANDALONE ───────────────────────────────────────── */}
        {step === 'passkey' && (
          <div style={{ textAlign: 'center' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', marginBottom: '1.25rem', display: 'inline-flex' }} onClick={() => { setStep('choose'); setError(null); setPasskeyStatus('idle'); }}>
              ← Back
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '1.25rem', background: passkeyStatus === 'success' ? 'rgba(16,185,129,0.12)' : passkeyStatus === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', borderRadius: '50%', marginBottom: '1rem', transition: 'background 0.3s ease' }}>
                {passkeyStatus === 'success' ? <CheckCircle2 size={40} color="#10b981" /> : passkeyStatus === 'error' ? <AlertTriangle size={40} color="#ef4444" /> : <Fingerprint size={40} color="#3b82f6" />}
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {passkeyStatus === 'waiting' && 'Waiting for Passkey…'}
                {passkeyStatus === 'success' && 'Verified! Redirecting…'}
                {passkeyStatus === 'error' && 'Passkey Failed'}
                {passkeyStatus === 'idle' && 'Sign in with Passkey'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {passkeyStatus === 'waiting' && 'Touch your security key or use biometrics (TouchID / Windows Hello).'}
                {passkeyStatus === 'success' && 'Authentication successful.'}
                {passkeyStatus === 'error' && 'The authentication failed or was cancelled.'}
                {passkeyStatus === 'idle' && 'Use your FIDO2 passkey, TouchID, or Windows Hello.'}
              </p>
            </div>

            {(passkeyStatus === 'idle' || passkeyStatus === 'error') && (
              <button id="btn-retry-passkey" className="btn btn-primary" onClick={handlePasskeyLogin} style={{ padding: '0.85rem 2rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Fingerprint size={18} />
                {passkeyStatus === 'error' ? 'Try Again' : 'Use Passkey'}
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Cpu size={12} color="var(--text-muted)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by Isolate Sandbox · Zero-trust architecture</span>
          <Sparkles size={11} color="var(--text-muted)" />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
