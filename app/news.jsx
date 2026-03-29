import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from './context/ThemeContext';
import { getNews } from '../services/augmontApi';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

const { width } = Dimensions.get('window');

export default function NewsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [newsList, setNewsList] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getNews(true);
        // Sort by Latest Published Date
        const sorted = data.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setNewsList(sorted);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const openNewsDetail = (news) => {
    setSelectedNews(news);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Animated.View entering={FadeIn.duration(400)} style={{ padding: 20, gap: 20, marginTop: Platform.OS === 'android' ? 40 : 20 }}>
          <ShimmerPlaceholder width={'60%'} height={28} borderRadius={8} isDarkMode={isDarkMode} />
          <ShimmerPlaceholder width={'100%'} height={280} borderRadius={24} isDarkMode={isDarkMode} />
          <ShimmerPlaceholder width={'100%'} height={280} borderRadius={24} isDarkMode={isDarkMode} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.card }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Market Insights</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Stay ahead with live trading news</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {newsList.map((item, index) => (
          <Animated.View key={item._id} entering={FadeInDown.duration(500).delay(index * 100)}>
            <TouchableOpacity 
              style={[styles.newsCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F1F5F9' }]}
              onPress={() => openNewsDetail(item)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400' }} style={styles.newsImg} />
              <View style={styles.newsCardBody}>
                <View style={styles.metaRow}>
                  <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.tagText, { color: theme.primary }]}>Market News</Text>
                  </View>
                  <Text style={[styles.dateText, { color: theme.textSecondary }]}>{formatDate(item.publishedAt)}</Text>
                </View>
                <Text style={[styles.newsTitle, { color: theme.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.newsSnippet, { color: theme.textSecondary }]} numberOfLines={3}>{item.content}</Text>
                
                <View style={styles.readMoreContainer}>
                  <Text style={[styles.readMoreText, { color: theme.primary }]}>Full Story</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {newsList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No news at the moment</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Check back later for the latest market insights.</Text>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full News Reader Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: selectedNews?.imageUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800' }} 
                style={styles.modalImg} 
              />
              
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.modalBody}>
                <View style={[styles.modalTag, { backgroundColor: theme.primary }]}>
                  <Text style={styles.modalTagText}>MARKET INSIGHT</Text>
                </View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selectedNews?.title}</Text>
                <Text style={[styles.modalDate, { color: theme.textSecondary }]}>{formatDate(selectedNews?.publishedAt)} • Trading Desk</Text>
                
                <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />
                
                <Text style={[styles.modalContentText, { color: theme.textPrimary }]}>
                  {selectedNews?.content}
                </Text>
              </View>
              
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTextContainer: { marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, fontWeight: '600', opacity: 0.7 },
  scrollContent: { padding: 20 },
  newsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
  },
  newsImg: { width: '100%', height: 200 },
  newsCardBody: { padding: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontSize: 11, fontWeight: '700' },
  newsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, lineHeight: 24 },
  newsSnippet: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  readMoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  readMoreText: { fontSize: 13, fontWeight: '800', marginRight: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { height: '90%', borderTopLeftRadius: 35, borderTopRightRadius: 35, overflow: 'hidden' },
  modalImg: { width: '100%', height: 300 },
  modalCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { padding: 25 },
  modalTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 16 },
  modalTagText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { fontSize: 26, fontWeight: '900', lineHeight: 34, marginBottom: 10 },
  modalDate: { fontSize: 14, fontWeight: '700', marginBottom: 20 },
  modalDivider: { height: 1.5, marginBottom: 25 },
  modalContentText: { fontSize: 16, lineHeight: 26, fontWeight: '500', opacity: 0.9 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptySubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, opacity: 0.6 },
});
