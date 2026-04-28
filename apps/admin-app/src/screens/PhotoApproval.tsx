import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { supabase } from "../api/supabase";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = width / 2 - 20;

export default function PhotoApproval() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideApproved, setHideApproved] = useState(false);

  const fetchPhotos = async () => {
    // Veritabanındaki 'etkilesimler' tablosundan çekiyoruz
    let query = supabase
      .from("etkilesimler")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false }); // DB sütun ismine göre sıralama

    if (hideApproved) {
      query = query.eq("is_approved", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fotoğraflar çekilemedi:", error.message);
    }

    if (data) setPhotos(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPhotos();

    // Realtime: Birisi yeni foto yüklediğinde listeyi otomatik yenile
    const channel = supabase
      .channel("photo-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "etkilesimler" },
        () => {
          fetchPhotos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hideApproved]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, [hideApproved]);

  const handleAction = async (id: string, approved: boolean) => {
    if (!approved) {
      // SİLME İŞLEMİ ÖNCESİ GÜVENLİK SORUSU
      Alert.alert(
        "Admin Onayı",
        "Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Evet, Sil",
            style: "destructive",
            onPress: () => processUpdate(id, false, true),
          },
        ],
      );
    } else {
      processUpdate(id, true, false);
    }
  };

  const processUpdate = async (
    id: string,
    approved: boolean,
    isDelete: boolean,
  ) => {
    try {
      if (isDelete) {
        // SİLME İŞLEMİ
        const { error } = await supabase
          .from("etkilesimler")
          .delete()
          .eq("id", id); // Burada 'id' sütunuyla gelen id'yi eşleştiriyoruz

        if (error) throw error;
        console.log("Başarıyla silindi:", id);
      } else {
        // ONAYLAMA İŞLEMİ
        const { error } = await supabase
          .from("etkilesimler")
          .update({ is_approved: approved })
          .eq("id", id);

        if (error) throw error;
      }

      // İşlem bitince listeyi tazelemek için fetchPhotos'u çağırıyoruz
      fetchPhotos();
    } catch (error) {
      console.error("İşlem hatası:", error.message);
      Alert.alert("Hata", "İşlem gerçekleştirilemedi: " + error.message);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#FADADD" />
      <Text style={styles.emptyText}>Henüz fotoğraf yüklenmemiş.</Text>
    </View>
  );

  const renderPhoto = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {/* foto_url sütunu DB ile eşleşti */}
      <Image source={{ uri: item.foto_url }} style={styles.image} />

      <View style={styles.overlay}>
        {item.is_approved ? (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.approvedText}>Yayında</Text>
          </View>
        ) : (
          <View style={[styles.approvedBadge, { backgroundColor: "#7B1113" }]}>
            <Text style={styles.approvedText}>Onay Bekliyor</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleAction(item.id, false)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#7B1113" />
        </TouchableOpacity>

        {!item.is_approved && (
          <TouchableOpacity
            onPress={() => handleAction(item.id, true)}
            style={styles.approveBtn}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.btnText}>Onayla</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Anı Kumbarası</Text>
          <TouchableOpacity
            onPress={() => setHideApproved(!hideApproved)}
            style={[styles.filterBtn, hideApproved && styles.filterBtnActive]}
          >
            <Ionicons
              name={hideApproved ? "eye-off" : "eye"}
              size={20}
              color={hideApproved ? "#fff" : "#7B1113"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {hideApproved ? "SADECE ONAY BEKLEYENLER" : "TÜM FOTOĞRAFLAR"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7B1113"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7B1113"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F9" },
  header: {
    padding: 25,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#FADADD",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, color: "#7B1113", fontWeight: "bold" },
  headerSubtitle: {
    fontSize: 10,
    color: "#7B1113",
    opacity: 0.5,
    marginTop: 4,
    letterSpacing: 2,
  },
  filterBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7B1113",
  },
  filterBtnActive: { backgroundColor: "#7B1113" },
  listContainer: { padding: 10, paddingBottom: 100 },
  card: {
    width: COLUMN_WIDTH,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#7B1113",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: { width: "100%", height: 200, resizeMode: "cover" },
  overlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27ae60",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  approvedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: { padding: 10, borderRadius: 12, backgroundColor: "#FFF0F0" },
  approveBtn: {
    backgroundColor: "#7B1113",
    flexDirection: "row",
    flex: 1,
    marginLeft: 10,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#7B1113", marginTop: 10, opacity: 0.5 },
});
