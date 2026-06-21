import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Link } from '@wow-two-beta/ui/actions';
import { Card, Confetti, Separator } from '@wow-two-beta/ui/display';
import { Alert, Callout, InlineSpinner, ProgressSteps } from '@wow-two-beta/ui/feedback';
import {
  Checkbox,
  EmailInput,
  Label,
  PasswordInput,
  PasswordStrength,
  PinInput,
} from '@wow-two-beta/ui/forms';
import { users } from '../../fixtures';

type Stage = 'signin' | 'signup' | 'twofa' | 'success';

const STEPS = ['Account', 'Verify', 'Done'];
const STEP_FOR_STAGE: Record<Stage, number> = {
  signin: 0,
  signup: 0,
  twofa: 1,
  success: 2,
};

const DEMO_EMAIL = users[0]?.email ?? 'ana.kovac@acme.dev';
const WRONG_CODE = '000000';

/** Decorative OAuth-look buttons + "or" separator. No real providers wired. */
function OauthBlock() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" tone="neutral" size="sm">
          Continue with GitHub
        </Button>
        <Button variant="outline" tone="neutral" size="sm">
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

function FieldRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} size="sm">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function AuthScreen() {
  const [stage, setStage] = useState<Stage>('signin');

  // Sign-in state
  const [signinEmail, setSigninEmail] = useState(DEMO_EMAIL);
  const [signinPassword, setSigninPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [signinError, setSigninError] = useState<string | null>(null);

  // Sign-up state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // 2FA state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(DEMO_EMAIL);

  // Fake verification latency — resolves to the success stage.
  useEffect(() => {
    if (!verifying) return;
    const timer = setTimeout(() => {
      setVerifying(false);
      setStage('success');
    }, 1200);
    return () => clearTimeout(timer);
  }, [verifying]);

  const goToTwofa = (email: string) => {
    setVerifiedEmail(email);
    setPin('');
    setPinError(null);
    setVerifying(false);
    setStage('twofa');
  };

  const handleSignin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signinEmail.includes('@')) {
      setSigninError('Enter a valid email address.');
      return;
    }
    if (signinPassword.length < 8) {
      setSigninError('Password must be at least 8 characters.');
      return;
    }
    setSigninError(null);
    goToTwofa(signinEmail);
  };

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signupEmail.includes('@')) {
      setSignupError('Enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters.');
      return;
    }
    if (!acceptTerms) {
      setSignupError('You must accept the terms to create an account.');
      return;
    }
    setSignupError(null);
    goToTwofa(signupEmail);
  };

  const handlePinComplete = (code: string) => {
    if (verifying) return;
    if (code === WRONG_CODE) {
      setPinError('That code is not valid. Try any other 6-digit code.');
      setPin('');
      return;
    }
    setPinError(null);
    setVerifying(true);
  };

  const resetAll = () => {
    setStage('signin');
    setSigninEmail(DEMO_EMAIL);
    setSigninPassword('');
    setRememberMe(true);
    setSigninError(null);
    setSignupEmail('');
    setSignupPassword('');
    setAcceptTerms(false);
    setSignupError(null);
    setPin('');
    setPinError(null);
    setVerifying(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <div className="flex flex-col items-center gap-1">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          W
        </div>
        <h1 className="text-xl font-semibold tracking-tight">WoW Two Console</h1>
        <p className="text-sm text-muted-foreground">Showcase auth flow — nothing is persisted</p>
      </div>

      <ProgressSteps steps={STEPS} current={STEP_FOR_STAGE[stage]} className="w-full max-w-md" />

      {stage === 'signin' && (
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title>Sign in</Card.Title>
            <Card.Description>Welcome back. Use any demo credentials below.</Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            {signinError && (
              <Alert
                severity="danger"
                title="Sign-in failed"
                description={signinError}
                onClose={() => setSigninError(null)}
              />
            )}
            <form onSubmit={handleSignin} className="flex flex-col gap-4">
              <FieldRow label="Email" htmlFor="signin-email">
                <EmailInput
                  id="signin-email"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  placeholder="you@company.dev"
                />
              </FieldRow>
              <FieldRow label="Password" htmlFor="signin-password">
                <PasswordInput
                  id="signin-password"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </FieldRow>
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    size="sm"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" isFullWidth>
                Sign in
              </Button>
            </form>
            <OauthBlock />
            <Callout severity="info" title="Demo hints">
              Any email + 8-character password works. At the verify step, every code passes except{' '}
              <code className="font-mono">{WRONG_CODE}</code>.
            </Callout>
          </Card.Body>
          <Card.Footer className="justify-center text-sm text-muted-foreground">
            New here?
            <Link
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                setSigninError(null);
                setStage('signup');
              }}
            >
              Create an account
            </Link>
          </Card.Footer>
        </Card>
      )}

      {stage === 'signup' && (
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title>Create your account</Card.Title>
            <Card.Description>Strength meter updates as you type.</Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            {signupError && (
              <Alert
                severity="danger"
                title="Could not create account"
                description={signupError}
                onClose={() => setSignupError(null)}
              />
            )}
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <FieldRow label="Email" htmlFor="signup-email">
                <EmailInput
                  id="signup-email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@company.dev"
                />
              </FieldRow>
              <FieldRow label="Password" htmlFor="signup-password">
                <div className="flex flex-col gap-2">
                  <PasswordInput
                    id="signup-password"
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Mix cases, digits, symbols"
                  />
                  <PasswordStrength value={signupPassword} />
                </div>
              </FieldRow>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                <Checkbox
                  size="sm"
                  className="mt-0.5"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  I agree to the{' '}
                  <Link href="#terms" onClick={(e) => e.preventDefault()}>
                    terms of service
                  </Link>{' '}
                  and privacy policy.
                </span>
              </label>
              <Button type="submit" isFullWidth>
                Create account
              </Button>
            </form>
            <OauthBlock />
          </Card.Body>
          <Card.Footer className="justify-center text-sm text-muted-foreground">
            Already have an account?
            <Link
              href="#signin"
              onClick={(e) => {
                e.preventDefault();
                setSignupError(null);
                setStage('signin');
              }}
            >
              Sign in
            </Link>
          </Card.Footer>
        </Card>
      )}

      {stage === 'twofa' && (
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title>Two-factor verification</Card.Title>
            <Card.Description>
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{verifiedEmail}</span>.
            </Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col items-center gap-4">
            {pinError && (
              <Alert
                severity="danger"
                title="Verification failed"
                description={pinError}
                onClose={() => setPinError(null)}
                className="w-full"
              />
            )}
            <PinInput
              length={6}
              value={pin}
              onValueChange={setPin}
              onComplete={handlePinComplete}
              isDisabled={verifying}
            />
            <div className="h-5">
              {verifying && <InlineSpinner>Verifying code…</InlineSpinner>}
            </div>
            <Callout severity="warning" title="Fake gate" className="w-full">
              The code <code className="font-mono">{WRONG_CODE}</code> always fails — anything else verifies.
            </Callout>
          </Card.Body>
          <Card.Footer className="justify-between text-sm">
            <Link
              href="#back"
              onClick={(e) => {
                e.preventDefault();
                if (!verifying) setStage('signin');
              }}
              className="text-muted-foreground"
            >
              Back to sign in
            </Link>
            <Button
              variant="ghost"
              size="sm"
              isDisabled={verifying}
              onClick={() => {
                setPin('');
                setPinError(null);
              }}
            >
              Resend code
            </Button>
          </Card.Footer>
        </Card>
      )}

      {stage === 'success' && (
        <Card className="w-full max-w-md">
          {/* One-shot burst on entering the success stage — mounts only here. */}
          <Confetti canAutoFire particleCount={90} />
          <Card.Body className="flex flex-col items-center gap-3 pt-8 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-success text-2xl text-success-foreground">
              ✓
            </div>
            <h2 className="text-lg font-semibold">You're in</h2>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{verifiedEmail}</span>
              {rememberMe ? ' — this device would be remembered.' : '.'}
            </p>
            <Alert
              severity="success"
              title="Session started"
              description="This is a showcase flow — refresh resets everything."
              className="w-full text-left"
            />
          </Card.Body>
          <Card.Footer className="justify-center gap-3">
            <Button variant="outline" tone="neutral" onClick={resetAll}>
              Start over
            </Button>
            <Button asChild>
              <a href="/">Go to showcase</a>
            </Button>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
}
