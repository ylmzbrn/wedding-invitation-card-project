import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../api/supabase";

type Guest = {
  id: string;
  ad_soyad: string;
  slug: string;
  durum?: string | null;
  kisi_sayisi?: number | null;
  olusturulma_tarihi?: string;
};

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuests = async () => {
    const { data, error } = await supabase
      .from("davetliler")
      .select("*")
      .order("ad_soyad", { ascending: true });

    if (error) {
      console.error("Davetliler çekilemedi:", error.message);
      Alert.alert("Hata", "Davetliler çekilirken bir sorun oluştu.");
      return;
    }

    setGuests(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    await fetchGuests();
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("guest-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "davetliler" },
        () => {
          fetchGuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGuests();
    setRefreshing(false);
  }, []);

  const normalizeStatus = (status?: string | null) =>
    status?.toLowerCase().trim();

  const stats = {
    total: guests.length,
    coming: guests.filter(
      (g) =>
        normalizeStatus(g.durum) === "geliyorum" ||
        normalizeStatus(g.durum) === "katılıyorum"
    ).length,
    notComing: guests.filter(
      (g) =>
        normalizeStatus(g.durum) === "gelmiyorum" ||
        normalizeStatus(g.durum) === "katılmıyorum"
    ).length,
    pending: guests.filter((g) => !g.durum).length,
    totalPeople: guests.reduce((sum, g) => sum + (g.kisi_sayisi || 0), 0),
  };

  const filteredGuests = guests.filter((guest) =>
    guest.ad_soyad?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status?: string | null) => {
    const normalized = normalizeStatus(status);

    if (normalized === "geliyorum" || normalized === "katılıyorum") {
      return {
        bg: "#E8F5E9",
        color: "#2E7D32",
        label: status || "Geliyor",
        icon: "checkmark-circle" as const,
      };
    }

    if (normalized === "gelmiyorum" || normalized === "katılmıyorum") {
      return {
        bg: "#FFF0F0",
        color: "#7B1113",
        label: status || "Gelmiyor",
        icon: "close-circle" as const,
      };
    }

    return {
      bg: "#FFF8E1",
      color: "#9A6B00",
      label: "Belirsiz",
      icon: "time" as const,
    };
  };

  const openGuestLink = async (slug: string) => {
    /**
     * Burayı gerçek web-app domaininle değiştireceğiz.
     * Şimdilik slug kontrolü için bırakıyoruz.
     */
    const url = `https://your-domain.com/card-content/${slug}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Link açılamadı", url);
    }
  };

  const renderGuestItem = ({ item }: { item: Guest }) => {
    const status = getStatusStyle(item.durum);

    return (
      <View style={styles.card}>
        <View style={styles.guestLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.ad_soyad?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>

          <View style={styles.guestInfo}>
            <Text style={styles.cardTitle}>{item.ad_soyad}</Text>

            <TouchableOpacity onPress={() => openGuestLink(item.slug)}>
              <Text style={styles.cardSubtitle}>/{item.slug}</Text>
            </TouchableOpacity>

            <Text style={styles.peopleText}>
              {item.kisi_sayisi || 0} kişi
            </Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={13} color={status.color} />
          <Text style={[styles.badgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Berna & Suat</Text>
        <Text style={styles.headerSubtitle}>YÖNETİM PANELİ</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Davetli</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPeople}</Text>
          <Text style={styles.statLabel}>Kişi</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.coming}</Text>
          <Text style={styles.statLabel}>Geliyor</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Belirsiz</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Davetli ara..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7B1113"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredGuests}
          renderItem={renderGuestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7B1113"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={54} color="#FADADD" />
              <Text style={styles.emptyText}>Davetli bulunamadı.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F9",
  },

  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#FADADD",
  },

  headerTitle: {
    fontSize: 28,
    color: "#7B1113",
    fontWeight: "300",
    letterSpacing: 2,
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#7B1113",
    letterSpacing: 4,
    marginTop: 5,
    fontWeight: "bold",
  },

  divider: {
    width: 34,
    height: 1.5,
    backgroundColor: "#7B1113",
    marginTop: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },

  statCard: {
    width: "47.8%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#7B1113",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7B1113",
  },

  statLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
    fontWeight: "600",
  },

  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FADADD",
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 14,
    color: "#333",
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#7B1113",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  guestLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#7B1113",
    fontWeight: "bold",
    fontSize: 16,
  },

  guestInfo: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#7B1113",
    opacity: 0.65,
    marginTop: 2,
  },

  peopleText: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 8,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyText: {
    color: "#7B1113",
    marginTop: 10,
    opacity: 0.5,
  },
});