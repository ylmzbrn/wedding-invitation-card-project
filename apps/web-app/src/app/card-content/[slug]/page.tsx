import { supabase } from '@/lib/supabase';
import Envelope from '@/components/Envelope';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DavetiyePage({ params }: PageProps) {
  const { slug } = await params;

  const { data: davetli, error } = await supabase
    .from('davetliler')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !davetli) {
    notFound();
  }

  return <Envelope guestName={davetli.ad_soyad} />;
}