'use client';

import React, { useState, useEffect } from 'react';

export default function Envelope({ guestName }: { guestName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRSVP = (status: string) => {
    setRsvpStatus(status);
  };

  const heartColors = [
    '#5e0b15',
    '#900c3f',
    '#c70039',
    '#ff573388',
    '#5e0b15cc',
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#fdfaf5] p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(144,12,63,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(94,11,21,0.25)_0%,_transparent_60%)]"></div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted &&
          [...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute select-none animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * (150 - 15) + 15}px`,
                color: heartColors[Math.floor(Math.random() * heartColors.length)],
                opacity: 0.15,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
              }}
            >
              ❤
            </div>
          ))}
      </div>

      <style jsx>{`
        @keyframes subtleShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(0.6deg) translateY(1.5px); }
          75% { transform: rotate(-0.6deg) translateY(-1.5px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-subtle-shake { animation: subtleShake 5s ease-in-out infinite; }
        .animate-float { animation: float 8s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-[420px] h-[650px] flex items-center justify-center">
        <div
          className={`relative w-full h-[260px] transition-all duration-1000 ease-in-out
          ${isOpen ? "translate-y-80 opacity-0 pointer-events-none" : "z-40 animate-subtle-shake"}`}
        >
          <div className="relative w-full h-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-50 rounded-sm">
            <div
              className="absolute top-0 left-0 w-full h-full bg-[#fcfcfc] shadow-sm z-40 origin-top transition-transform duration-700"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 60%)",
                borderBottom: "1px solid rgba(0,0,0,0.02)",
                transform: isOpen ? "rotateX(160deg)" : "rotateX(0deg)",
              }}
            ></div>

            <button
              onClick={() => setIsOpen(true)}
              className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all hover:scale-110 active:scale-95"
            >
              <span className="text-6xl drop-shadow-2xl filter saturate-150">❤️</span>
              <div className="absolute inset-0 animate-ping bg-red-600 rounded-full opacity-25"></div>
            </button>

            <div
              className="absolute inset-0 z-30 pointer-events-none"
              style={{ clipPath: "polygon(0 0, 0% 100%, 100% 100%, 100% 0, 50% 60%)", background: "#fff" }}
            >
              <div className="absolute bottom-8 w-full text-center px-4">
                <div className="w-12 h-[0.5px] bg-gray-200 mx-auto mb-3"></div>
                <p className="text-[#5e0b15] font-serif italic text-[11px] uppercase tracking-[0.4em] font-medium opacity-90">
                  Sayın {guestName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute left-[2%] w-[96%] min-h-[560px] bg-white p-8 shadow-[0_30px_70px_rgba(94,11,21,0.2)] border border-[#d4af37]/15 transition-all duration-1000 delay-200 ease-out
          ${isOpen ? "top-2 opacity-100 scale-100 z-30" : "top-40 opacity-0 scale-95 z-20"}`}
        >
          <div className="border border-[#d4af37]/20 p-6 text-center h-full flex flex-col justify-between space-y-4 bg-[#fffdfa]">
            <div className="space-y-3">
              <h1 className="text-3xl font-serif italic text-[#5e0b15] tracking-tight">Berna & Suat</h1>
              <p className="text-[10px] text-[#900c3f] uppercase tracking-[0.6em] font-bold italic">Sonsuzluğa</p>
            </div>

            <p className="text-sm italic text-gray-600 leading-relaxed font-light px-4">
              "Hayatımızın en anlamlı gününde, sevgimizi siz dostlarımızla paylaşmaktan mutluluk duyarız."
            </p>

            {/* TARİH BÖLÜMÜ - py-6'dan py-4'e çekildi */}
            <div className="py-4 border-y border-gray-100 space-y-2">
              <p className="text-2xl font-serif text-[#5e0b15] tracking-widest uppercase">16 Mayıs 2026</p>
              <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">Cumartesi • Saat 14:00</p>
              <p className="text-[10px] text-gray-500 italic">Botanik Park Düğün Salonu • Eskişehir</p>
            </div>

            {/* HARİTA BUTONU - mt-4'ten mt-1'e çekildi */}
            <div className="mt-1 px-2">
              <button 
                onClick={() => window.open('https://maps.app.goo.gl/F4DCxR1Pw5eBcjMk9', '_blank')}
                className="w-full py-3 border border-[#5e0b15]/20 text-[#5e0b15] text-[10px] tracking-[0.3em] hover:bg-[#5e0b15]/5 transition-all rounded-sm uppercase flex items-center justify-center gap-2 shadow-sm"
              >
                <span>📍</span> Konumu Haritada Gör
              </button>
            </div>

            {/* RSVP BÖLÜMÜ - pt-2'den pt-4'e ve border-t eklendi */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-[9px] uppercase tracking-[4px] text-gray-300 font-semibold uppercase">Lütfen Yanıtlayınız</p>

              <div className="flex flex-col gap-2.5">
                {rsvpStatus === null ? (
                  <>
                    <button
                      onClick={() => handleRSVP("EVET")}
                      className="w-full py-4 bg-[#5e0b15] text-white text-[11px] tracking-[0.2em] hover:bg-[#900c3f] transition-all rounded-sm uppercase shadow-lg active:scale-[0.97] font-medium"
                    >
                      Katılıyorum
                    </button>
                    <button
                      onClick={() => handleRSVP("HAYIR")}
                      className="w-full py-4 border border-gray-100 text-gray-400 text-[11px] tracking-[0.2em] hover:bg-gray-50 transition-all rounded-sm uppercase font-medium active:scale-[0.97]"
                    >
                      Katılamıyorum
                    </button>
                  </>
                ) : (
                  <div className="py-6 animate-in fade-in zoom-in duration-500">
                    <p className="text-[#5e0b15] font-serif italic text-sm">
                      {rsvpStatus === "EVET"
                        ? "Harika! Sizi aramızda görmek için sabırsızlanıyoruz. ❤️"
                        : "Gelemediğiniz için üzgünüz, kalbimizdesiniz. ✨"}
                    </p>
                    <button
                      onClick={() => setRsvpStatus(null)}
                      className="mt-4 text-[9px] text-gray-400 underline tracking-widest uppercase"
                    >
                      Yanıtı Değiştir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}