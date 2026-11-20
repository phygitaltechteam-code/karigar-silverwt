import React from 'react';
import Reg1 from '@/features/register/Reg1';
import Reg2 from '@/features/register/Reg2';
import Reg3 from '@/features/register/Reg3';
import Reg4 from '@/features/register/Reg4';
const Signup: React.FC = () => {
  const [step, setStep] = React.useState(1);
  if (step === 1) return <Reg1 setStep={setStep} />;
  if (step === 2) return <Reg2 setStep={setStep} />;
  if (step === 3) return <Reg3 setStep={setStep} />;
  if (step === 4) return <Reg4 setStep={setStep} />;
  return <></>;
};

export default Signup;
