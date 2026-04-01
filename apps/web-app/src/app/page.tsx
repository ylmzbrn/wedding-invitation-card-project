import { redirect } from 'next/navigation';

export default function Home() {
  // Ana sayfaya giren birini test davetiyesine yönlendirelim ki tasarımını hemen görebil
  redirect('/card-content/test-davetli');
}