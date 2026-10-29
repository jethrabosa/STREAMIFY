import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { ArrowUpRight, Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, Sparkles } from "lucide-react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

const darkThemes = new Set([
  "dark",
  "synthwave",
  "halloween",
  "forest",
  "black",
  "luxury",
  "dracula",
  "business",
  "night",
  "coffee",
  "dim",
]);

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, loginWithGoogle, isLoggingIn } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleButtonTheme = darkThemes.has(theme) ? "filled_black" : "outline";

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="login-page">
      <main className="login-layout">
        <aside className="login-story" aria-label="Chatty introduction">
          <div className="login-story-brand">
            <span className="login-story-mark"><MessageSquare className="size-5" /></span>
            <span>chat ta ano G</span>
          </div>

          <div className="login-story-copy">
            <span className="login-story-eyebrow"><Sparkles className="size-4" /> YOUR PEOPLE, IN ONE PLACE</span>
            <h2>Good conversations start <em>here.</em></h2>
            <p>A little hello can turn an ordinary day around. Pick up right where you left off.</p>
          </div>

          <div className="login-story-preview" aria-hidden="true">
            <div className="login-preview-topline">
              <span>YOUR CIRCLE</span>
              <span className="login-online-indicator">3 ONLINE</span>
            </div>
            <div className="login-preview-message">
              <span className="login-preview-avatar login-avatar-coral">J</span>
              <div><strong>Jamie</strong><span>Are we still on for tonight?</span></div>
              <span className="login-preview-time">now</span>
            </div>
            <div className="login-preview-message login-preview-reply">
              <span className="login-preview-avatar login-avatar-lime">Y</span>
              <div><strong>You</strong><span>Wouldn&apos;t miss it ✨</span></div>
              <span className="login-preview-check">✓✓</span>
            </div>
            <div className="login-preview-footer">
              <span className="login-preview-dots"><i /><i /><i /></span>
              <span>the good stuff keeps going</span>
            </div>
          </div>

          <div className="login-story-footer">
            <span className="login-footer-avatars"><i>J</i><i>M</i><i>A</i></span>
            <span>Closer, even when you&apos;re apart.</span>
          </div>
          <span className="login-story-orbit login-orbit-one" />
          <span className="login-story-orbit login-orbit-two" />
        </aside>

        <section className="login-form-panel">
          <div className="login-form-content">
            <div className="login-mobile-brand">
              <span className="login-story-mark"><MessageSquare className="size-5" /></span>
              <span>chat ta ano G</span>
            </div>

            <div className="login-form-heading">
              <span className="login-form-eyebrow">WELCOME BACK</span>
              <h1>It&apos;s good to see you.</h1>
              <p>Sign in and get back to your conversations.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="login-email">Email address</label>
                <div className="login-input">
                  <Mail className="size-5" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Password</label>
                <div className="login-input">
                  <Lock className="size-5" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>Sign in <ArrowUpRight className="size-5" /></>
                )}
              </button>
            </form>

            <div className="login-divider"><span>or continue with</span></div>

            <div className="login-google-area">
              <div className="google-signin-button flex justify-center">
                {googleClientId ? (
                  <GoogleOAuthProvider clientId={googleClientId}>
                    <GoogleLogin
                      onSuccess={({ credential }) => {
                        if (credential) {
                          loginWithGoogle(credential);
                        } else {
                          toast.error("Google did not return a sign-in credential. Please try again.");
                        }
                      }}
                      onError={() => toast.error("Google sign-in failed. Please try again.")}
                      text="continue_with"
                      theme={googleButtonTheme}
                      size="large"
                      shape="rectangular"
                      width={Math.min(400, window.innerWidth - 48)}
                    />
                  </GoogleOAuthProvider>
                ) : (
                  <button
                    type="button"
                    className="login-google-fallback"
                    onClick={() => toast.error("Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.")}
                  >
                    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.39 38.01 46.98 31.89 46.98 24.55Z" />
                      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>
              <p>Choose another Google account in the account picker. Your account is created automatically the first time you sign in.</p>
            </div>

            <p className="login-signup-link">
              New to Chatty?{" "}
              <Link to="/signup">Create an account <ArrowUpRight className="size-4" /></Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
export default LoginPage;
