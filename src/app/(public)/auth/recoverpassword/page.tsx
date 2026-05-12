import { useState } from 'react';
import { Step } from '@/types/steps';
import { Layout } from '@/components/layout';
import { StepIndicator } from '@/components/stepsIndicator';
import { StepEmail } from '@/components/stepsEmail';
import { StepCode } from '@/components/stepsCode';
import { StepPassword } from '@/components/stepsPassword';
import { StepSuccess } from '@/components/stepsSucess';
import { useNavigate } from 'react-router-dom';

export function AdminForgotPassword({ onLogin }: { onLogin?: () => void }) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const navigate = useNavigate();
  const handleLogin = onLogin ?? (() => navigate('/'));

  return (
    <Layout>
      <StepIndicator current={step} />
      {step === 'email' && (
        <StepEmail
          onNext={(e) => {
            setEmail(e);
            setStep('code');
          }}
        />
      )}
      {step === 'code' && (
        <StepCode
          email={email}
          onNext={(c) => {
            setCode(c);
            setStep('password');
          }}
          onBack={() => setStep('email')}
        />
      )}
      {step === 'password' && (
        <StepPassword
          email={email}
          code={code}
          onNext={() => setStep('success')}
          onBack={() => setStep('code')}
        />
      )}
      {step === 'success' && <StepSuccess onLogin={handleLogin} />}
    </Layout>
  );
}
