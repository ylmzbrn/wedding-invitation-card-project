import { supabase } from '@/lib/supabase';
import Envelope from '@/components/Envelope';
import { notFound } from 'next/navigation';

export default async function DavetiyePage({ params }: { params: { slug: string } }) {
  // Next.js 15 kurallarına göre params'ı bekliyoruz
  const { slug } = await (params as any); 

  const { data: davetli, error } = await supabase
    .from('davetliler')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !davetli) {
    return notFound();
  }

  return <Envelope guestName={davetli.ad_soyad} />;
}