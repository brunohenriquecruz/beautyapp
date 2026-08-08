import { Delete, Fingerprint, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [biometricPulse, setBiometricPulse] = useState(false);

  const CORRECT_PIN = "1234";

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
          setPin("");
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

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[radial-gradient(circle_at_20%_0%,rgba(31,205,226,0.25),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(113,238,158,0.28),transparent_30%),#F4FFFB] px-6 py-12 text-[#102326]">
      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="brand-mark w-20 h-20 rounded-3xl flex items-center justify-center border border-white/30">
          <Sparkles className="h-9 w-9 text-white" strokeWidth={2.3} />
        </div>
        <div className="text-center">
          <h1 className="brand-wordmark text-4xl font-900 tracking-tight">BellaFlow</h1>
          <p className="text-[#6D8185] text-sm font-700 mt-1">Sua revendedora no controle</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 w-full">
        <div className="bg-white/92 border border-[#D9EEF0] rounded-3xl px-6 py-6 w-full max-w-[320px] shadow-[0_18px_42px_rgba(8,175,200,0.14)]">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="h-9 w-9 rounded-2xl icon-gradient-list flex items-center justify-center">
              <LockKeyhole className="h-4.5 w-4.5" strokeWidth={2.3} />
            </span>
            <p className="text-[#102326] text-sm font-900">Digite seu PIN</p>
          </div>
          <div className="flex gap-4 justify-center">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? error ? "bg-red-400 scale-110" : "bg-[#16C8DD] scale-110"
                    : "bg-[#D9EEF0]"
                }`}
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-xs font-800 text-center mt-3 animate-bounce">PIN incorreto. Tente novamente.</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 w-64">
          {digits.map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === "backspace") setPin(p => p.slice(0, -1));
                else if (d !== "") handleDigit(d);
              }}
              disabled={d === ""}
              className={`h-16 rounded-2xl text-xl font-900 active:scale-95 transition-all shadow-[0_10px_22px_rgba(8,175,200,0.08)] ${
                d === "" ? "opacity-0 pointer-events-none" :
                d === "backspace" ? "bg-white text-[#6D8185] border border-[#D9EEF0]" :
                "bg-white text-[#102326] border border-[#D9EEF0] hover:border-[#16C8DD]"
              }`}
            >
              {d === "backspace" ? <Delete className="mx-auto h-5 w-5" strokeWidth={2.2} /> : d}
            </button>
          ))}
        </div>

        <button
          onClick={handleBiometric}
          className={`flex flex-col items-center gap-2 group ${biometricPulse ? "scale-110" : ""} transition-transform`}
        >
          <div className={`w-14 h-14 rounded-full bg-white border-2 border-[#D9EEF0] flex items-center justify-center shadow-[0_12px_28px_rgba(8,175,200,0.13)] ${biometricPulse ? "border-[#16C8DD] animate-pulse" : "group-hover:border-[#16C8DD]"} transition-all`}>
            <Fingerprint className="h-7 w-7 text-[#08AFC8]" strokeWidth={1.8} />
          </div>
          <span className="text-[#6D8185] text-xs font-800">Biometria</span>
        </button>
      </div>

      <div>
        <p className="text-[#6D8185] text-xs font-700 text-center">
          Demo: PIN 1234 ou use a biometria
        </p>
      </div>
    </div>
  );
}
