import { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricPulse, setBiometricPulse] = useState(false);

  const CORRECT_PIN = '1234';

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) {
          onLogin();
        } else {
          setError(true);
          setPin('');
        }
      }, 300);
    }
  };

  const handleBiometric = () => {
    setBiometricPulse(true);
    setTimeout(() => {
      setBiometricPulse(false);
      onLogin();
    }, 1000);
  };

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-[#9C2553] via-[#7A1A40] to-[#4A0D26] px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
          <span className="text-4xl">💄</span>
        </div>
        <div className="text-center">
          <h1 className="text-white text-3xl font-900 tracking-tight">Beauty Gestão</h1>
          <p className="text-white/60 text-sm font-500 mt-1">Sua revendedora no controle</p>
        </div>
      </div>

      {/* PIN Section */}
      <div className="flex flex-col items-center gap-8 w-full">
        <div>
          <p className="text-white/80 text-sm font-600 text-center mb-5">Digite seu PIN</p>
          <div className="flex gap-4 justify-center">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? error ? 'bg-red-400 scale-110' : 'bg-white scale-110'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          {error && <p className="text-red-300 text-xs font-600 text-center mt-3 animate-bounce">PIN incorreto. Tente novamente.</p>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-64">
          {digits.map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '⌫') setPin(p => p.slice(0, -1));
                else if (d !== '') handleDigit(d);
              }}
              disabled={d === ''}
              className={`h-16 rounded-2xl text-white text-xl font-700 active:scale-95 transition-all ${
                d === '' ? 'opacity-0 pointer-events-none' :
                d === '⌫' ? 'bg-white/10 text-white/60' :
                'bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-sm border border-white/10'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Biometric */}
        <button
          onClick={handleBiometric}
          className={`flex flex-col items-center gap-2 group ${biometricPulse ? 'scale-110' : ''} transition-transform`}
        >
          <div className={`w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center ${biometricPulse ? 'border-white animate-pulse' : 'group-hover:border-white/60'} transition-all`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4"/>
              <path d="M8.5 16.5c1 1 2.1 1.5 3.5 1.5s2.5-.5 3.5-1.5"/>
              <circle cx="12" cy="12" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-white/60 text-xs font-600">Biometria</span>
        </button>
      </div>

      <div>
        <p className="text-white/30 text-xs text-center">
          Demo: PIN 1234 ou use a biometria
        </p>
      </div>
    </div>
  );
}
