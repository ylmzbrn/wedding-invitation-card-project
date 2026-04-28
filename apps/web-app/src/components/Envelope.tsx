"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type EnvelopeProps = {
  guestName: string;
  guestSlug: string;
  guestId: string | number;
};

type ApprovedPhoto = {
  id: string | number;
  foto_url: string;
};

export default function Envelope({
  guestName,
  guestSlug,
  guestId,
}: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [approvedPhotos, setApprovedPhotos] = useState<ApprovedPhoto[]>([]);
  const [showRsvpBurst, setShowRsvpBurst] = useState(false);

  const displayName = guestName?.trim() || "Değerli Misafirimiz";

  const floatingLeaves = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 14 + Math.random() * 24,
      delay: Math.random() * 6,
      duration: 9 + Math.random() * 10,
      rotate: Math.random() * 360,
      opacity: 0.12 + Math.random() * 0.2,
    }));
  }, [mounted]);

  const sparkles = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      size: 3 + Math.random() * 4,
    }));
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    fetchApprovedPhotos();

    const channel = supabase
      .channel("public:etkilesimler")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "etkilesimler" },
        () => fetchApprovedPhotos(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovedPhotos = async () => {
    const { data, error } = await supabase
      .from("etkilesimler")
      .select("*")
      .eq("is_approved", true)
      .order("olusturulma_tarihi", { ascending: false });

    if (error) console.error("Veri çekme hatası:", error.message);
    if (data) setApprovedPhotos(data);
  };

  const handleRSVP = async (status: string) => {
    const previousStatus = rsvpStatus;
    setRsvpStatus(status);

    const { error } = await supabase
      .from("davetliler")
      .update({
        durum: status,
      })
      .eq("slug", guestSlug);

    if (error) {
      console.error("RSVP güncelleme hatası:", error.message);
      setRsvpStatus(previousStatus);
      alert("Yanıtınız kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setUploading(true);

      const files = event.target.files;
      if (!files || files.length === 0) return;

      const MAX_FILE_SIZE = 5 * 1024 * 1024;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          alert("Fotoğraf boyutu en fazla 5 MB olabilir.");
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `wedding-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from("etkilesimler")
          .insert([
            {
              foto_url: publicUrl,
              guest_name: displayName,
              is_approved: false,
            },
          ]);

        if (insertError) throw insertError;
      }

      alert("Fotoğraflarınız yüklendi. Onaylandıktan sonra görünecektir.");
    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#f7f8f1] px-3 py-3 text-[#334033] sm:px-4 sm:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(154,172,143,0.22),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(212,201,174,0.28),transparent_38%),linear-gradient(135deg,#fffefa_0%,#eef2e8_50%,#fbfaf4_100%)]" />

      <div className="pointer-events-none fixed inset-0 opacity-[0.14] bg-[linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:46px_46px]" />

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
                "--rotate": `${leaf.rotate}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

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

      <div className="pointer-events-none fixed left-0 top-0 z-10 h-[230px] w-[150px] opacity-60">
        <BotanicalCorner position="left-top" />
      </div>

      <div className="pointer-events-none fixed right-0 top-0 z-10 h-[230px] w-[150px] opacity-55">
        <BotanicalCorner position="right-top" />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 z-10 h-[230px] w-[160px] opacity-55">
        <BotanicalCorner position="left-bottom" />
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 z-10 h-[230px] w-[160px] opacity-60">
        <BotanicalCorner position="right-bottom" />
      </div>

      <section className="relative z-20 mx-auto flex min-h-[calc(100dvh-24px)] w-full max-w-[440px] flex-col items-center justify-center gap-4">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              type="button"
              onClick={() => setIsOpen(true)}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.9 }}
              transition={{ duration: 0.75, ease: [0.19, 1, 0.22, 1] }}
              className="group relative w-full max-w-[420px] outline-none"
              aria-label="Davetiye zarfını aç"
            >
              <div className="absolute -inset-8 rounded-full bg-[#93a586]/20 blur-3xl" />

              <div className="relative h-[230px] overflow-hidden rounded-[18px] border border-white/80 bg-[#fffefa] shadow-[0_34px_100px_rgba(75,89,68,0.24)]">
                <div className="absolute inset-0 paper-grain opacity-35" />
                <div className="absolute inset-0 rounded-[18px] border border-[#cdbb83]/40" />
                <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[#f7f5ed] [clip-path:polygon(0_0,50%_70%,100%_0,100%_100%,0_100%)]" />
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[#faf8f0] [clip-path:polygon(0_0,100%_50%,0_100%)]" />
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[#f0f2e8] [clip-path:polygon(100%_0,0_50%,100%_100%)]" />

                <motion.div
                  className="absolute inset-x-0 top-0 h-[68%] origin-top rounded-t-[18px] bg-[#fffefa] shadow-[0_16px_40px_rgba(75,89,68,0.12)] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  whileHover={{ rotateX: 8 }}
                  transition={{ duration: 0.4 }}
                />

                <div className="absolute left-1/2 top-[57%] z-20 flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 shadow-[0_16px_36px_rgba(144,118,61,0.22)] ring-4 ring-white/70">
                  <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border border-[#c8ad62]/80 bg-white/45">
                    <GoldHeart />
                  </div>
                </div>

                <div className="absolute left-0 right-0 top-[40px] z-20 text-center">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-[#8c9884]">
                    Sayın
                  </p>
                  <p className="mt-3 font-serif text-[24px] italic text-[#334033]">
                    {displayName}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center text-[#71806b]">
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="text-2xl leading-none text-[#b99d56]"
                >
                  ♥
                </motion.span>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em]">
                  Davetiyeyi açmak için zarfa dokunun
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <motion.article
          initial={{ opacity: 0, y: 80, scale: 0.94 }}
          animate={
            isOpen
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 80, scale: 0.94 }
          }
          transition={{ duration: 0.75, delay: isOpen ? 0.1 : 0 }}
          className={`w-full max-w-[410px] ${
            isOpen ? "pointer-events-auto" : "pointer-events-none absolute"
          }`}
        >
          <div className="relative rounded-[22px] border-[2px] border-[#d0b86f]/55 bg-[#fffefa]/95 p-2 shadow-[0_24px_70px_rgba(70,83,62,0.18)] backdrop-blur-md">
            <div className="absolute inset-0 rounded-[22px] paper-grain opacity-25" />

            <div className="relative overflow-hidden rounded-[18px] border-[2px] border-[#d7c79d]/70 px-4 py-5 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(205,187,131,0.2),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(145,161,132,0.1),transparent_35%)]" />

              <span className="absolute left-4 top-4 text-[14px] text-[#c8ad62]/65">
                ♡
              </span>
              <span className="absolute right-4 top-4 text-[14px] text-[#c8ad62]/65">
                ♡
              </span>
              <span className="absolute bottom-4 left-4 text-[12px] text-[#c8ad62]/55">
                ♥
              </span>
              <span className="absolute bottom-4 right-4 text-[12px] text-[#c8ad62]/55">
                ♥
              </span>

              <div className="relative">
                <div className="mx-auto mb-3 flex items-center justify-center gap-3">
                  <SmallLeaf />
                  <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#c8ad62]/80 bg-white/55 shadow-[0_8px_18px_rgba(144,118,61,0.1)]">
                    <GoldHeart small />
                  </div>
                  <SmallLeaf flip />
                </div>

                <h1 className="font-serif text-[34px] italic leading-none text-[#334033]">
                  Berna & Suat
                </h1>

                <div className="mx-auto my-3 flex items-center justify-center gap-3 text-[#d0bf8f]">
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#c8ad62]" />
                  <span className="text-xs text-[#b99d56]">♡</span>
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#c8ad62]" />
                </div>

                <p className="mx-auto max-w-[300px] font-serif text-[15px] italic leading-6 text-[#586052]">
                  Hayatımızın en anlamlı gününde sizleri aramızda görmekten
                  mutluluk duyarız.
                </p>

                <div className="my-4 flex items-center justify-center gap-3">
                  <SideBranch />
                  <div>
                    <p className="font-serif text-[44px] leading-none text-[#6f8068]">
                      16
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-[#334033]">
                      Mayıs 2026
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#7c8575]">
                      Cumartesi • Saat 14:00
                    </p>
                  </div>
                  <SideBranch flip />
                </div>

                <p className="font-serif text-[15px] font-medium text-[#334033]">
                  Botanik Park Düğün Salonu
                </p>
                <p className="mt-0.5 text-[12px] text-[#7c8575]">Eskişehir</p>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      "https://maps.app.goo.gl/nJaAETa7i7Za8ySj9",
                      "_blank",
                    )
                  }
                  className="mt-4 w-full rounded-[9px] border border-[#c8ad62]/70 bg-white/70 px-4 py-3 text-[12px] tracking-[0.13em] text-[#5d6b58] shadow-sm transition hover:bg-[#f7f0dd] active:scale-[0.98]"
                >
                  📍 Konumu Haritada Gör
                </button>

                <div className="mx-auto my-4 flex items-center justify-center gap-3 text-[#d0bf8f]">
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#c8ad62]" />
                  <span className="text-xs text-[#b99d56]">♥</span>
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#c8ad62]" />
                </div>

                <div>
                  {rsvpStatus === null ? (
                    <div>
                      <div className="mb-3 flex items-center justify-center gap-2">
                        <SmallLeaf />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#334033]">
                          Lütfen Yanıtlayınız
                        </p>
                        <SmallLeaf flip />
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRsvpBurst(true);

                            setTimeout(() => {
                              handleRSVP("EVET");
                              setShowRsvpBurst(false);
                            }, 850);
                          }}
                          className="relative overflow-visible rounded-[9px] bg-[#8d9e82] px-4 py-3 text-[13px] font-medium tracking-[0.08em] text-white shadow-[0_10px_20px_rgba(91,108,79,0.18)] transition hover:bg-[#74866b] active:scale-[0.98]"
                        >
                          {showRsvpBurst && (
                            <span className="pointer-events-none absolute inset-0 z-20">
                              {Array.from({ length: 18 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="rsvp-star absolute left-1/2 top-1/2 text-[#d4af37]"
                                  style={
                                    {
                                      "--x": `${Math.cos((i / 18) * Math.PI * 2) * 72}px`,
                                      "--y": `${Math.sin((i / 18) * Math.PI * 2) * 46}px`,
                                      animationDelay: `${i * 0.018}s`,
                                    } as React.CSSProperties
                                  }
                                >
                                  ✦
                                </span>
                              ))}
                            </span>
                          )}
                          ♥ Katılıyorum
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRSVP("HAYIR")}
                          className="rounded-[9px] border border-[#c8ad62]/70 bg-white/70 px-4 py-3 text-[13px] tracking-[0.08em] text-[#5d6b58] transition hover:bg-[#f7f0dd] active:scale-[0.98]"
                        >
                          ♡ Katılamıyorum
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rsvpStatus === "EVET" ? (
                        <div className="space-y-3">
                          <p className="font-serif text-[16px] italic leading-6 text-[#334033]">
                            Harika! Sizi aramızda görmek için sabırsızlanıyoruz.
                          </p>

                          <div className="rounded-[12px] border border-dashed border-[#c8ad62]/75 bg-[#f7f3e7]/80 p-4">
                            <p className="mb-3 text-[10px] uppercase leading-5 tracking-[0.16em] text-[#697564]">
                              Bu mutlu günü ölümsüzleştirdiğiniz fotoğrafları
                              bizlerle paylaşın.
                            </p>

                            <label className="inline-block cursor-pointer rounded-[9px] border border-[#c8ad62]/70 bg-white px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-[#334033] transition hover:bg-[#8d9e82] hover:text-white">
                              {uploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
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
                        <p className="font-serif text-[16px] italic leading-6 text-[#334033]">
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
                        <div className="border-t border-[#d7c79d]/55 pt-4">
                          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#7c8575]">
                            Anı Kumbarası
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {approvedPhotos.slice(0, 6).map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.foto_url}
                                alt="Düğün anısı"
                                className="aspect-square w-full rounded-[8px] border border-[#d7c79d]/30 object-cover shadow-sm"
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
          background-image:
            radial-gradient(
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
          content: "";
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

        .rsvp-star {
          font-size: 12px;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.2);
          animation: rsvpStarBurst 0.9s ease-out forwards;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.6);
        }

        @keyframes rsvpStarBurst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
          }

          20% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y)))
              scale(1.2) rotate(180deg);
          }
        }
      `}</style>
    </main>
  );
}

function GoldHeart({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`font-serif leading-none text-[#c8ad62] ${
        small ? "text-[28px]" : "text-[38px]"
      }`}
      aria-hidden="true"
    >
      ♡
    </span>
  );
}

function SmallLeaf({ flip = false }: { flip?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-4 w-8 items-center justify-center ${
        flip ? "scale-x-[-1]" : ""
      }`}
    >
      <span className="absolute left-0 h-2.5 w-5 rotate-[-20deg] rounded-[100%_0_100%_0] bg-[#91a184]" />
      <span className="absolute right-1 h-2.5 w-5 rotate-[25deg] rounded-[100%_0_100%_0] bg-[#b7c3ad]" />
    </span>
  );
}

function SideBranch({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`relative h-20 w-10 ${flip ? "scale-x-[-1]" : ""}`}
      aria-hidden="true"
    >
      <span className="absolute left-5 top-0 h-20 w-px rotate-[12deg] bg-[#aab79c]" />
      {[7, 21, 35, 49, 63].map((top, index) => (
        <span
          key={top}
          className="absolute h-3.5 w-7 rounded-[100%_0_100%_0] bg-[#9aaa8f]"
          style={{
            top,
            left: index % 2 === 0 ? 1 : 12,
            transform: `rotate(${index % 2 === 0 ? "-25deg" : "35deg"})`,
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
  position: "left-top" | "right-top" | "left-bottom" | "right-bottom";
}) {
  const flipX = position.includes("right");
  const flipY = position.includes("bottom");

  return (
    <div
      className={`relative h-full w-full ${flipX ? "scale-x-[-1]" : ""} ${
        flipY ? "scale-y-[-1]" : ""
      }`}
    >
      <span className="absolute left-10 top-0 h-[220px] w-[2px] origin-top rotate-[34deg] bg-[#90a184]/40" />

      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-[100%_0_100%_0] bg-gradient-to-br from-[#b9c7ae] to-[#667a60] shadow-sm"
          style={{
            width: 28 + (i % 3) * 7,
            height: 15 + (i % 3) * 4,
            left: 34 + i * 7,
            top: 18 + i * 20,
            transform: `rotate(${i % 2 === 0 ? -38 : 28}deg)`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
