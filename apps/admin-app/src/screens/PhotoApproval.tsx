import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../api/supabase";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = width / 2 - 20;

type PhotoItem = {
  id: string;
  foto_url: string;
  mesaj?: string | null;
  guest_name?: string | null;
  is_approved?: boolean | null;
  olusturulma_tarihi?: string;
};

export default function PhotoApproval() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideApproved, setHideApproved] = useState(false);

  const fetchPhotos = useCallback(async () => {
    let query = supabase
      .from("etkilesimler")
      .select("*")
      .not("foto_url", "is", null)
      .order("olusturulma_tarihi", { ascending: false });

    if (hideApproved) {
      query = query.eq("is_approved", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fotoğraflar çekilemedi:", error.message);
      Alert.alert("Hata", "Fotoğraflar çekilemedi.");
    } else {
      setPhotos(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }, [hideApproved]);

  useEffect(() => {
    fetchPhotos();

    const channel = supabase
      .channel("photo-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "etkilesimler" },
        fetchPhotos,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
  };

  const approvePhoto = async (id: string) => {
    const { error } = await supabase
      .from("etkilesimler")
      .update({ is_approved: true })
      .eq("id", id);

    if (error) {
      console.error("Onay hatası:", error.message);
      Alert.alert("Onay hatası", error.message);
      return;
    }

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === id ? { ...photo, is_approved: true } : photo,
      ),
    );
  };

  const deletePhoto = (id: string) => {
    Alert.alert(
      "Fotoğraf silinsin mi?",
      "Bu işlem fotoğraf kaydını kalıcı olarak silecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => confirmDeletePhoto(id),
        },
      ],
    );
  };

  const confirmDeletePhoto = async (id: string) => {
    const { data, error } = await supabase
      .from("etkilesimler")
      .delete()
      .eq("id", id)
      .select();

    console.log("DELETE ID:", id);
    console.log("DELETE DATA:", data);
    console.log("DELETE ERROR:", error);

    if (error) {
      Alert.alert("Silme hatası", error.message);
      return;
    }

    if (!data || data.length === 0) {
      Alert.alert("Silinemedi", "Kayıt bulunamadı veya silme yetkisi yok.");
      return;
    }

    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    Alert.alert("Başarılı", "Fotoğraf silindi.");
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#FADADD" />
      <Text style={styles.emptyText}>Henüz fotoğraf yüklenmemiş.</Text>
    </View>
  );

  const renderPhoto = ({ item }: { item: PhotoItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.foto_url }} style={styles.image} />

      <View style={styles.overlay}>
        {item.is_approved ? (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.approvedText}>Yayında</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.approvedText}>Onay Bekliyor</Text>
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.guestName}>
          {item.guest_name || "İsimsiz Misafir"}
        </Text>

        {!!item.mesaj && <Text style={styles.message}>{item.mesaj}</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => confirmDeletePhoto(item.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={22} color="#7B1113" />
        </TouchableOpacity>

        {!item.is_approved && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => approvePhoto(item.id)}
            style={styles.approveBtn}
          >
            <Ionicons
              name="checkmark-circle-outline"
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
            activeOpacity={0.7}
            onPress={() => setHideApproved((prev) => !prev)}
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

  headerTitle: {
    fontSize: 24,
    color: "#7B1113",
    fontWeight: "bold",
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#7B1113",
    opacity: 0.5,
    marginTop: 4,
    letterSpacing: 2,
  },

  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7B1113",
    alignItems: "center",
    justifyContent: "center",
  },

  filterBtnActive: {
    backgroundColor: "#7B1113",
  },

  listContainer: {
    padding: 10,
    paddingBottom: 100,
  },

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

  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },

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

  pendingBadge: {
    backgroundColor: "#7B1113",
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

  infoBox: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  guestName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
  },

  message: {
    fontSize: 11,
    color: "#777",
    marginTop: 3,
  },

  actions: {
    flexDirection: "row",
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  deleteBtn: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },

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

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyText: {
    color: "#7B1113",
    marginTop: 10,
    opacity: 0.5,
  },
});
