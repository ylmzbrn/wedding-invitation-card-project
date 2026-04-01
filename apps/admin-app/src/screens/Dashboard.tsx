import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, SafeAreaView, StatusBar, Image, Alert 
} from 'react-native';
import { supabase } from '../api/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'guests' | 'photos'>('guests');
  const [guests, setGuests] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGuests(), fetchPhotos()]);
    setLoading(false);
  };

  const fetchGuests = async () => {
    const { data } = await supabase.from('davetliler').select('*').order('ad_soyad');
    if (data) setGuests(data);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('etkilesimler')
      .select('*')
      .order('olusturulma_tarihi', { ascending: false });
    if (data) setPhotos(data);
  };

  const approvePhoto = async (id: string) => {
    const { error } = await supabase
      .from('etkilesimler')
      .update({ is_approved: true })
      .eq('id', id);
    
    if (error) {
      Alert.alert("Hata", "Onaylanırken bir sorun oluştu.");
    } else {
      setPhotos(photos.map(p => p.id === id ? { ...p, is_approved: true } : p));
    }
  };

  const deletePhoto = async (id: string) => {
    Alert.alert("Emin misiniz?", "Bu fotoğraf kalıcı olarak silinecektir.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
        const { error } = await supabase.from('etkilesimler').delete().eq('id', id);
        if (!error) setPhotos(photos.filter(p => p.id !== id));
      }}
    ]);
  };

  const stats = {
    total: guests.length,
    coming: guests.filter(g => g.durum === 'Geliyorum').length,
    photoCount: photos.length,
    pendingPhotos: photos.filter(p => !p.is_approved).length
  };

  const renderGuestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{item.ad_soyad}</Text>
        <Text style={styles.cardSubtitle}>@{item.slug}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: item.durum === 'Geliyorum' ? '#E8F5E9' : '#FFF5F5' }]}>
        <Text style={[styles.badgeText, { color: item.durum === 'Geliyorum' ? '#2E7D32' : '#7B1113' }]}>
          {item.durum || 'Belirsiz'}
        </Text>
      </View>
    </View>
  );

  const renderPhotoItem = ({ item }: { item: any }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.foto_url }} style={styles.photoImage} resizeMode="cover" />
      <View style={styles.photoInfo}>
        <Text style={styles.photoAuthor}>{item.mesaj || "İsimsiz Misafir"}</Text>
        <View style={styles.photoActions}>
          {!item.is_approved ? (
            <TouchableOpacity style={styles.approveBtn} onPress={() => approvePhoto(item.id)}>
              <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
              <Text style={styles.approveBtnText}>Onayla</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.approvedBadge}>
              <Ionicons name="eye" size={16} color="#999" />
              <Text style={styles.approvedText}>Yayında</Text>
            </View>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePhoto(item.id)}>
            <Ionicons name="trash" size={20} color="#7B1113" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Berna & Suat</Text>
        <Text style={styles.headerSubtitle}>ADMIN DASHBOARD</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={[styles.statCard, activeTab === 'guests' && styles.activeStat]} 
          onPress={() => setActiveTab('guests')}
        >
          <Text style={[styles.statNumber, activeTab === 'guests' && {color: '#fff'}]}>{stats.total}</Text>
          <Text style={[styles.statLabel, activeTab === 'guests' && {color: '#fff'}]}>Davetli</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statCard, activeTab === 'photos' && styles.activeStat]} 
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.statNumber, activeTab === 'photos' && {color: '#fff'}]}>{stats.pendingPhotos}</Text>
          <Text style={[styles.statLabel, activeTab === 'photos' && {color: '#fff'}]}>Onay Bekleyen</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'guests' ? (
        <>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Davetli ara..." 
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
          </View>
          <FlatList
            data={guests.filter(g => g.ad_soyad?.toLowerCase().includes(search.toLowerCase()))}
            renderItem={renderGuestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchPhotos}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F9' },
  header: { padding: 25, alignItems: 'center', backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, color: '#7B1113', fontWeight: '300', letterSpacing: 2 },
  headerSubtitle: { fontSize: 10, color: '#7B1113', letterSpacing: 4, marginTop: 5, fontWeight: 'bold' },
  divider: { width: 30, height: 1.5, backgroundColor: '#7B1113', marginTop: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  statCard: { 
    width: '45%', backgroundColor: '#fff', padding: 15, borderRadius: 18, alignItems: 'center',
    shadowColor: '#7B1113', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  activeStat: { backgroundColor: '#7B1113' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#7B1113' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '600' },

  searchContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FADADD' },

  listContent: { padding: 20 },
  card: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 10, elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#444' },
  cardSubtitle: { fontSize: 11, color: '#7B1113', opacity: 0.5 },

  photoCard: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 3 },
  photoImage: { width: '100%', height: 200 },
  photoInfo: { padding: 15 },
  photoAuthor: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 10 },
  photoActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 8, borderRadius: 10 },
  approveBtnText: { color: '#2E7D32', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  deleteBtn: { padding: 8 },
  approvedBadge: { flexDirection: 'row', alignItems: 'center' },
  approvedText: { color: '#999', fontSize: 12, marginLeft: 5 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' }
});