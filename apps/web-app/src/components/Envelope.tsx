'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Envelope({ guestName }: { guestName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [approvedPhotos, setApprovedPhotos] = useState<any[]>([]);

  const heartColors = ['#5e0b15', '#900c3f', '#c70039', '#ff573388', '#5e0b15cc'];

  useEffect(() => {
    setMounted(true);
    fetchApprovedPhotos();

    const channel = supabase
      .channel('public:etkilesimler')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'etkilesimler' }, () => {
        fetchApprovedPhotos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 1. ONAYLI FOTOĞRAFLARI ÇEKME FONKSİYONU
  const fetchApprovedPhotos = async () => {
    const { data, error } = await supabase
      .from('etkilesimler')
      .select('*')
      .eq('is_approved', true)
      .order('olusturulma_tarihi', { ascending: false }); // created_at yerine olusturulma_tarihi
    
    if (error) console.error("Veri çekme hatası:", error.message);
    if (data) setApprovedPhotos(data);
  };
  
  const handleRSVP = async (status: string) => {
    setRsvpStatus(status);
    // İstersen burada Supabase'e davetli durumunu da kaydedebilirsin
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `wedding-photos/${fileName}`;

        // 1. Storage'a yükle (Bucket adın 'photos')
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Public URL'i al
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        // 3. Veritabanına kaydet (Sütun isimleri DB ile eşitlendi)
        const { error: insertError } = await supabase.from('etkilesimler').insert([
          { 
            foto_url: publicUrl,    // photo_url -> foto_url yapıldı
            guest_name: guestName,  // DB'de guest_name sütunu açtığını varsayıyoruz
            is_approved: false 
          }
        ]);

        if (insertError) throw insertError;
      }
      alert("Fotoğraflarınız yüklendi! Onaydan sonra görünecektir.");
    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#fdfaf5] p-4 select-none">
      {/* ARKA PLAN GRADYANLAR VE KALPLER */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(144,12,63,0.2)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(94,11,21,0.15)_0%,_transparent_60%)]"></div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && [...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute select-none animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * (130 - 15) + 15}px`,
              color: heartColors[Math.floor(Math.random() * heartColors.length)],
              opacity: 0.15,
              transform: `rotate(${Math.random() * 360}deg)`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${7 + Math.random() * 5}s`,
            }}
          >❤</div>
        ))}
      </div>

      <style jsx>{`
        @keyframes subtleShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(0.6deg) translateY(1.5px); } 75% { transform: rotate(-0.6deg) translateY(-1.5px); } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
        .animate-subtle-shake { animation: subtleShake 5s ease-in-out infinite; }
        .animate-float { animation: float 10s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-[420px] flex items-center justify-center min-h-[650px]">
        {/* ZARF GRUBU */}
        <div className={`relative w-full h-[260px] transition-all duration-1000 ease-in-out ${isOpen ? "translate-y-80 opacity-0 pointer-events-none" : "z-40 animate-subtle-shake"}`}>
          <div className="relative w-full h-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-50 rounded-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[#fcfcfc] shadow-sm z-40 origin-top transition-transform duration-700"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 60%)", transform: isOpen ? "rotateX(160deg)" : "rotateX(0deg)" }}>
            </div>
            <button onClick={() => setIsOpen(true)} className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all hover:scale-110">
              <span className="text-6xl drop-shadow-2xl">❤️</span>
              <div className="absolute inset-0 animate-ping bg-red-600 rounded-full opacity-25"></div>
            </button>
            <div className="absolute bottom-8 w-full text-center px-4 z-30 pointer-events-none">
                <div className="w-12 h-[0.5px] bg-gray-200 mx-auto mb-3"></div>
                <p className="text-[#5e0b15] font-serif italic text-[11px] uppercase tracking-[0.4em] font-medium opacity-90">Sayın {guestName}</p>
            </div>
          </div>
        </div>

        {/* DAVETİYE KARTI */}
        <div className={`absolute left-[2%] w-[96%] bg-white p-8 shadow-[0_30px_70px_rgba(94,11,21,0.2)] border border-[#d4af37]/15 transition-all duration-1000 delay-200 ease-out ${isOpen ? "top-2 opacity-100 scale-100 z-30" : "top-40 opacity-0 scale-95 z-10 pointer-events-none"}`}>
          <div className="border border-[#d4af37]/20 p-6 text-center space-y-6 bg-[#fffdfa]">
            <div className="space-y-3">
              <h1 className="text-3xl font-serif italic text-[#5e0b15] tracking-tight">Berna & Suat</h1>
              <p className="text-[10px] text-[#900c3f] uppercase tracking-[0.6em] font-bold italic">S O N S U Z L U Ğ A</p>
            </div>

            <p className="text-sm italic text-gray-600 leading-relaxed font-light px-4">
              "Hayatımızın en anlamlı gününde, sevgimizi siz dostlarımızla paylaşmaktan mutluluk duyarız."
            </p>

            <div className="py-4 border-y border-gray-100 space-y-2">
              <p className="text-2xl font-serif text-[#5e0b15] tracking-widest uppercase">16 Mayıs 2026</p>
              <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">Cumartesi • Saat 14:00</p>
              <p className="text-[10px] text-gray-500 italic">Botanik Park Düğün Salonu • Eskişehir</p>
            </div>

            <div className="mt-1 px-2">
              <button onClick={() => window.open('https://maps.google.com', '_blank')} className="w-full py-3 border border-[#5e0b15]/20 text-[#5e0b15] text-[10px] tracking-[0.3em] hover:bg-[#5e0b15]/5 transition-all rounded-sm uppercase flex items-center justify-center gap-2 shadow-sm">
                <span>📍</span> Konumu Haritada Gör
              </button>
            </div>

            {/* RSVP VE FOTOĞRAF ALANI */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {rsvpStatus === null ? (
                <div className="space-y-4">
                  <p className="text-[9px] uppercase tracking-[4px] text-gray-300 font-semibold uppercase">Lütfen Yanıtlayınız</p>
                  <div className="flex flex-col gap-2.5">
                    <button 
                      onClick={(e) => { e.preventDefault(); handleRSVP("EVET"); }} 
                      className="w-full py-4 bg-[#5e0b15] text-white text-[11px] tracking-[0.2em] rounded-sm uppercase shadow-lg active:scale-[0.97] font-medium"
                    >
                      Katılıyorum
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); handleRSVP("HAYIR"); }} 
                      className="w-full py-4 border border-gray-100 text-gray-400 text-[11px] tracking-[0.2em] rounded-sm uppercase font-medium active:scale-[0.97]"
                    >
                      Katılamıyorum
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2 animate-in fade-in zoom-in duration-500 space-y-6">
                  {rsvpStatus === "EVET" ? (
                    <div className="space-y-4">
                      <p className="text-[#5e0b15] font-serif italic text-sm">Harika! Sizi aramızda görmek için sabırsızlanıyoruz. ❤️</p>
                      <div className="bg-[#5e0b15]/5 p-4 rounded-sm border border-dashed border-[#5e0b15]/20">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 leading-relaxed">Bu mutlu günü ölümsüzleştirdiğiniz fotoğrafları bizlerle paylaşın:</p>
                        <label className="cursor-pointer block">
                          <span className="bg-white border border-[#5e0b15]/20 text-[#5e0b15] text-[9px] py-2 px-4 rounded-sm uppercase tracking-widest hover:bg-[#5e0b15] hover:text-white transition-all inline-block">
                            {uploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
                          </span>
                          <input type="file" multiple accept="image/*" className="hidden" disabled={uploading} onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#5e0b15] font-serif italic text-sm">Gelemediğiniz için üzgünüz, kalbimizdesiniz. ✨</p>
                  )}
                  <button onClick={() => setRsvpStatus(null)} className="mt-2 text-[9px] text-gray-400 underline tracking-widest uppercase">Yanıtı Değiştir</button>

                  {/* ONAYLI GALERİ */}
                  {approvedPhotos.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[10px] text-gray-300 uppercase tracking-[4px] mb-4">Anı Kumbarası</p>
                        <div className="grid grid-cols-3 gap-2 px-1">
                            {approvedPhotos.map((photo) => (
                            <img 
                                key={photo.id} 
                                src={photo.foto_url} // photo_url -> foto_url yapıldı
                                className="w-full h-20 object-cover rounded-sm shadow-sm"
                                alt="Anı"
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
    </div>
  );
}