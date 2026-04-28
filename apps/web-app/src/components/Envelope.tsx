'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type EnvelopeProps = {
  guestName: string;
};

type ApprovedPhoto = {
  id: string | number;
  foto_url: string;
};

export default function Envelope({ guestName }: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [approvedPhotos, setApprovedPhotos] = useState<ApprovedPhoto[]>([]);

  const displayName = guestName?.trim() || 'Değerli Misafirimiz';

  const floatingLeaves = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 18 + Math.random() * 34,
      delay: Math.random() * 6,
      duration: 9 + Math.random() * 10,
      rotate: Math.random() * 360,
      opacity: 0.18 + Math.random() * 0.24,
    }));
  }, [mounted]);

  const sparkles = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      size: 3 + Math.random() * 5,
    }));
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    fetchApprovedPhotos();

    const channel = supabase
      .channel('public:etkilesimler')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'etkilesimler' },
        () => fetchApprovedPhotos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovedPhotos = async () => {
    const { data, error } = await supabase
      .from('etkilesimler')
      .select('*')
      .eq('is_approved', true)
      .order('olusturulma_tarihi', { ascending: false });

    if (error) console.error('Veri çekme hatası:', error.message);
    if (data) setApprovedPhotos(data);
  };

  const handleRSVP = async (status: string) => {
    setRsvpStatus(status);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);

      const files = event.target.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `wedding-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('photos').getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('etkilesimler')
          .insert([
            {
              foto_url: publicUrl,
              guest_name: displayName,
              is_approved: false,
            },
          ]);

        if (insertError) throw insertError;
      }

      alert('Fotoğraflarınız yüklendi. Onaylandıktan sonra görünecektir.');
    } catch (error: any) {
      alert('Hata: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f7f8f1] px-4 py-10 text-[#334033]">
      {/* Arka plan */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(154,172,143,0.22),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(212,201,174,0.28),transparent_38%),linear-gradient(135deg,#fffefa_0%,#eef2e8_50%,#fbfaf4_100%)]" />

      <div className="pointer-events-none fixed inset-0 opacity-[0.16] bg-[linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:46px_46px]" />

      {/* Hareketli yapraklar */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {floatingLeaves.map((leaf) => (
          <span
            key={leaf.id}
            className="leaf-float absolute block"
            style={
              {
                left: `${leaf.left}%`,
                top: `${leaf.top}%`,
                width: `${leaf.size}px`,
                height: `${leaf.size * 1.85}px`,
                opacity: leaf.opacity,
                animationDelay: `${leaf.delay}s`,
                animationDuration: `${leaf.duration}s`,
                '--rotate': `${leaf.rotate}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Işık noktaları */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="sparkle absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Kenar botanik süsler */}
      <div className="pointer-events-none fixed left-0 top-0 z-10 h-[340px] w-[220px] opacity-80">
        <BotanicalCorner position="left-top" />
      </div>

      <div className="pointer-events-none fixed right-0 top-0 z-10 h-[320px] w-[210px] opacity-70">
        <BotanicalCorner position="right-top" />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 z-10 h-[340px] w-[240px] opacity-70">
        <BotanicalCorner position="left-bottom" />
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 z-10 h-[360px] w-[250px] opacity-80">
        <BotanicalCorner position="right-bottom" />
      </div>

      <section className="relative z-20 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[560px] flex-col items-center justify-center gap-8">
        {/* ZARF */}
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              type="button"
              onClick={() => setIsOpen(true)}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.9 }}
              transition={{ duration: 0.75, ease: [0.19, 1, 0.22, 1] }}
              className="group relative w-full max-w-[520px] outline-none"
              aria-label="Davetiye zarfını aç"
            >
              <div className="absolute -inset-8 rounded-full bg-[#93a586]/20 blur-3xl" />

              <div className="relative h-[300px] overflow-hidden rounded-[18px] border border-white/80 bg-[#fffefa] shadow-[0_34px_100px_rgba(75,89,68,0.24)]">
                <div className="absolute inset-0 paper-grain opacity-35" />

                <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[#f7f5ed] [clip-path:polygon(0_0,50%_70%,100%_0,100%_100%,0_100%)]" />

                <div className="absolute inset-y-0 left-0 w-1/2 bg-[#faf8f0] [clip-path:polygon(0_0,100%_50%,0_100%)]" />

                <div className="absolute inset-y-0 right-0 w-1/2 bg-[#f0f2e8] [clip-path:polygon(100%_0,0_50%,100%_100%)]" />

                <motion.div
                  className="absolute inset-x-0 top-0 h-[68%] origin-top rounded-t-[18px] bg-[#fffefa] shadow-[0_16px_40px_rgba(75,89,68,0.12)] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  whileHover={{ rotateX: 8 }}
                  transition={{ duration: 0.4 }}
                />

                <div className="absolute left-1/2 top-[57%] z-20 flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#91a184] shadow-[0_16px_36px_rgba(79,97,70,0.32)] ring-4 ring-white/70">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#d7c79d]/70 text-white">
                    <span className="font-serif text-[27px] italic">B</span>
                    <span className="mx-1 font-serif text-[17px] text-[#f4e8bd]">
                      &
                    </span>
                    <span className="font-serif text-[27px] italic">S</span>
                  </div>
                </div>

                <div className="absolute left-0 right-0 top-[42px] sm:top-[55px] z-20 text-center">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-[#8c9884]">
                    Sayın
                  </p>
                  <p className="mt-3 font-serif text-[25px] italic text-[#334033]">
                    {displayName}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center text-[#71806b]">
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="text-2xl leading-none"
                >
                  ︿
                </motion.span>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em]">
                  Davetiyeyi açmak için zarfa dokunun
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* DAVETİYE KARTI */}
        <motion.article
          initial={{ opacity: 0, y: 120, scale: 0.92 }}
          animate={
            isOpen
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 120, scale: 0.92 }
          }
          transition={{ duration: 0.9, delay: isOpen ? 0.15 : 0 }}
          className={`w-full max-w-[520px] ${
            isOpen ? 'pointer-events-auto' : 'pointer-events-none absolute'
          }`}
        >
          <div className="relative rounded-[22px] border border-white/80 bg-[#fffefa]/95 p-5 shadow-[0_36px_110px_rgba(70,83,62,0.22)] backdrop-blur-md">
            <div className="absolute inset-0 rounded-[22px] paper-grain opacity-30" />

            <div className="relative overflow-hidden rounded-[17px] border border-[#d7c79d]/35 px-6 py-8 text-center sm:px-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(145,161,132,0.16),transparent_34%)]" />

              <div className="relative">
                <div className="mx-auto mb-4 flex items-center justify-center gap-4">
                  <SmallLeaf />
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#d7c79d]/70 bg-white/70 shadow-sm">
                    <span className="font-serif text-[27px] italic text-[#334033]">
                      B
                    </span>
                    <span className="mx-1 font-serif text-[16px] text-[#b7a26d]">
                      &
                    </span>
                    <span className="font-serif text-[27px] italic text-[#334033]">
                      S
                    </span>
                  </div>
                  <SmallLeaf flip />
                </div>

                <h1 className="font-serif text-[44px] italic leading-none text-[#334033] sm:text-[54px]">
                  Berna & Suat
                </h1>

                <div className="mx-auto my-5 flex items-center justify-center gap-3 text-[#d0bf8f]">
                  <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#d0bf8f]" />
                  <span className="text-sm">♡</span>
                  <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#d0bf8f]" />
                </div>

                <p className="mx-auto max-w-[330px] font-serif text-[17px] italic leading-8 text-[#586052]">
                  Hayatımızın en anlamlı gününde sizleri aramızda görmekten
                  mutluluk duyarız.
                </p>

                <div className="my-7 flex items-center justify-center gap-5">
                  <SideBranch />
                  <div>
                    <p className="font-serif text-[54px] leading-none text-[#6f8068]">
                      16
                    </p>
                    <p className="mt-2 text-[13px] uppercase tracking-[0.35em] text-[#334033]">
                      Mayıs 2026
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[#7c8575]">
                      Cumartesi • Saat 14:00
                    </p>
                  </div>
                  <SideBranch flip />
                </div>

                <p className="font-serif text-[16px] font-medium text-[#334033]">
                  Botanik Park Düğün Salonu
                </p>
                <p className="mt-1 text-[13px] text-[#7c8575]">Eskişehir</p>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      'https://maps.app.goo.gl/nJaAETa7i7Za8ySj9',
                      '_blank'
                    )
                  }
                  className="mt-7 w-full rounded-[7px] border border-[#b9bfae] bg-white/70 px-4 py-4 text-[13px] tracking-[0.14em] text-[#5d6b58] shadow-sm transition hover:bg-[#f0f2e8] active:scale-[0.98]"
                >
                  📍 Konumu Haritada Gör
                </button>

                <div className="mx-auto my-7 flex items-center justify-center gap-3 text-[#d0bf8f]">
                  <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#d0bf8f]" />
                  <span className="text-xs">♥</span>
                  <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#d0bf8f]" />
                </div>

                <div>
                  {rsvpStatus === null ? (
                    <div>
                      <div className="mb-5 flex items-center justify-center gap-3">
                        <SmallLeaf />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#334033]">
                          Lütfen Yanıtlayınız
                        </p>
                        <SmallLeaf flip />
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => handleRSVP('EVET')}
                          className="rounded-[7px] bg-[#8d9e82] px-4 py-4 text-[14px] font-medium tracking-[0.08em] text-white shadow-[0_14px_28px_rgba(91,108,79,0.22)] transition hover:bg-[#74866b] active:scale-[0.98]"
                        >
                          ♥ Katılıyorum
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRSVP('HAYIR')}
                          className="rounded-[7px] border border-[#b9bfae] bg-white/70 px-4 py-4 text-[14px] tracking-[0.08em] text-[#5d6b58] transition hover:bg-[#f0f2e8] active:scale-[0.98]"
                        >
                          ♡ Katılamıyorum
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {rsvpStatus === 'EVET' ? (
                        <div className="space-y-4">
                          <p className="font-serif text-[18px] italic leading-7 text-[#334033]">
                            Harika! Sizi aramızda görmek için sabırsızlanıyoruz.
                          </p>

                          <div className="rounded-[10px] border border-dashed border-[#aab79c] bg-[#f3f5ee] p-5">
                            <p className="mb-4 text-[11px] uppercase leading-5 tracking-[0.18em] text-[#697564]">
                              Bu mutlu günü ölümsüzleştirdiğiniz fotoğrafları
                              bizlerle paylaşın.
                            </p>

                            <label className="inline-block cursor-pointer rounded-[7px] border border-[#aab79c] bg-white px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-[#334033] transition hover:bg-[#8d9e82] hover:text-white">
                              {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={handleFileUpload}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <p className="font-serif text-[18px] italic leading-7 text-[#334033]">
                          Gelemediğiniz için üzgünüz, kalbimizdesiniz.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setRsvpStatus(null)}
                        className="text-[10px] uppercase tracking-[0.22em] text-[#7c8575] underline underline-offset-4"
                      >
                        Yanıtı Değiştir
                      </button>

                      {approvedPhotos.length > 0 && (
                        <div className="border-t border-[#d7c79d]/35 pt-6">
                          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#7c8575]">
                            Anı Kumbarası
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {approvedPhotos.map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.foto_url}
                                alt="Düğün anısı"
                                className="aspect-square w-full rounded-[7px] object-cover shadow-sm"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      </section>

      <style jsx>{`
        .paper-grain {
          background-image: radial-gradient(
              circle at 20% 20%,
              rgba(255, 255, 255, 0.7),
              transparent 18%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(145, 161, 132, 0.1),
              transparent 22%
            ),
            linear-gradient(
              120deg,
              rgba(255, 255, 255, 0.55),
              rgba(232, 235, 224, 0.22)
            );
        }

        .leaf-float {
          background: linear-gradient(145deg, #b8c7ac 0%, #6f8068 100%);
          border-radius: 100% 0 100% 0;
          filter: blur(0.15px);
          transform: rotate(var(--rotate));
          animation: leafFloat linear infinite;
          box-shadow: inset 8px 8px 14px rgba(255, 255, 255, 0.28);
        }

        .leaf-float::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 10%;
          height: 80%;
          width: 1px;
          background: rgba(255, 255, 255, 0.45);
          transform: translateX(-50%) rotate(14deg);
        }

        .sparkle {
          animation: sparkle 3.2s ease-in-out infinite;
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.9);
        }

        @keyframes leafFloat {
          0% {
            transform: translate3d(0, -20px, 0) rotate(var(--rotate));
          }
          50% {
            transform: translate3d(28px, 35px, 0)
              rotate(calc(var(--rotate) + 22deg));
          }
          100% {
            transform: translate3d(-14px, 80px, 0)
              rotate(calc(var(--rotate) + 45deg));
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.3);
          }
        }
      `}</style>
    </main>
  );
}

function SmallLeaf({ flip = false }: { flip?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-5 w-10 items-center justify-center ${
        flip ? 'scale-x-[-1]' : ''
      }`}
    >
      <span className="absolute left-0 h-3 w-6 rotate-[-20deg] rounded-[100%_0_100%_0] bg-[#91a184]" />
      <span className="absolute right-1 h-3 w-6 rotate-[25deg] rounded-[100%_0_100%_0] bg-[#b7c3ad]" />
    </span>
  );
}

function SideBranch({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`relative h-24 w-12 ${flip ? 'scale-x-[-1]' : ''}`}
      aria-hidden="true"
    >
      <span className="absolute left-6 top-0 h-24 w-px rotate-[12deg] bg-[#aab79c]" />
      {[8, 24, 40, 56, 72].map((top, index) => (
        <span
          key={top}
          className="absolute h-4 w-8 rounded-[100%_0_100%_0] bg-[#9aaa8f]"
          style={{
            top,
            left: index % 2 === 0 ? 2 : 15,
            transform: `rotate(${index % 2 === 0 ? '-25deg' : '35deg'})`,
            opacity: 0.75,
          }}
        />
      ))}
    </div>
  );
}

function BotanicalCorner({
  position,
}: {
  position: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';
}) {
  const flipX = position.includes('right');
  const flipY = position.includes('bottom');

  return (
    <div
      className={`relative h-full w-full ${flipX ? 'scale-x-[-1]' : ''} ${
        flipY ? 'scale-y-[-1]' : ''
      }`}
    >
      <span className="absolute left-10 top-0 h-[280px] w-[2px] origin-top rotate-[34deg] bg-[#90a184]/40" />

      {Array.from({ length: 11 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-[100%_0_100%_0] bg-gradient-to-br from-[#b9c7ae] to-[#667a60] shadow-sm"
          style={{
            width: 34 + (i % 3) * 9,
            height: 18 + (i % 3) * 5,
            left: 38 + i * 8,
            top: 22 + i * 22,
            transform: `rotate(${i % 2 === 0 ? -38 : 28}deg)`,
            opacity: 0.58,
          }}
        />
      ))}
    </div>
  );
}