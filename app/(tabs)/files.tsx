import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Star,
  StarOff,
  Trash2,
  FileCode,
  Plus,
  FolderOpen,
  Clock,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useEditor } from '@/lib/EditorContext';
import type { HtmlFile } from '@/types/database';
import { useRouter } from 'expo-router';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#263347',
  border: '#334155',
  active: '#38BDF8',
  activeAlpha: 'rgba(56,189,248,0.15)',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textFaint: '#475569',
  warning: '#FBBF24',
  danger: '#F87171',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString();
}

function FileCard({
  file,
  onOpen,
  onDelete,
  onToggleFav,
}: {
  file: HtmlFile;
  onOpen: (f: HtmlFile) => void;
  onDelete: (id: string) => void;
  onToggleFav: (id: string, current: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(file)} activeOpacity={0.7}>
      <View style={styles.cardIcon}>
        <FileCode size={22} color={C.active} strokeWidth={1.8} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{file.title}</Text>
        {file.preview_text ? (
          <Text style={styles.cardPreview} numberOfLines={2}>{file.preview_text}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Clock size={11} color={C.textFaint} strokeWidth={1.5} />
          <Text style={styles.cardDate}>{formatDate(file.updated_at)}</Text>
          <Text style={styles.cardSize}>{file.word_count} chars</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleFav(file.id, file.is_favorite)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {file.is_favorite ? (
            <Star size={18} color={C.warning} fill={C.warning} strokeWidth={1.5} />
          ) : (
            <StarOff size={18} color={C.textFaint} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDelete(file.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={17} color={C.danger} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

type FilterType = 'all' | 'favorites';

export default function FilesScreen() {
  const [files, setFiles] = useState<HtmlFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { loadFile, newFile } = useEditor();
  const router = useRouter();

  const fetchFiles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('html_files')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) setFiles(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleOpen = useCallback((file: HtmlFile) => {
    loadFile(file);
    router.push('/(tabs)');
  }, [loadFile, router]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete File', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('html_files').delete().eq('id', id);
          setFiles(prev => prev.filter(f => f.id !== id));
        },
      },
    ]);
  }, []);

  const handleToggleFav = useCallback(async (id: string, current: boolean) => {
    await supabase.from('html_files').update({ is_favorite: !current }).eq('id', id);
    setFiles(prev => prev.map(f => f.id === id ? { ...f, is_favorite: !current } : f));
  }, []);

  const handleNew = useCallback(() => {
    newFile();
    router.push('/(tabs)');
  }, [newFile, router]);

  const filtered = files.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.preview_text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || f.is_favorite;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FolderOpen size={20} color={C.active} strokeWidth={1.8} />
          <Text style={styles.headerTitle}>Files</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{files.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleNew}>
          <Plus size={18} color={C.bg} strokeWidth={2.5} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={C.textFaint} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search files..."
            placeholderTextColor={C.textFaint}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'favorites' && styles.filterTabActive]}
          onPress={() => setFilter('favorites')}
        >
          <Star size={12} color={filter === 'favorites' ? C.warning : C.textFaint} fill={filter === 'favorites' ? C.warning : 'none'} strokeWidth={1.5} />
          <Text style={[styles.filterTabText, filter === 'favorites' && styles.filterTabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* File list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.active} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <FileCode size={48} color={C.textFaint} strokeWidth={1} />
          <Text style={styles.emptyTitle}>
            {search ? 'No results found' : filter === 'favorites' ? 'No favorites yet' : 'No files yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try a different search term' : 'Tap New to create your first HTML file'}
          </Text>
          {!search && filter === 'all' && (
            <TouchableOpacity style={styles.emptyBtn} onPress={handleNew}>
              <Plus size={16} color={C.bg} strokeWidth={2.5} />
              <Text style={styles.emptyBtnText}>Create New File</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={f => f.id}
          renderItem={({ item }) => (
            <FileCard
              file={item}
              onOpen={handleOpen}
              onDelete={handleDelete}
              onToggleFav={handleToggleFav}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchFiles(true); }}
              tintColor={C.active}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: C.text },
  countBadge: {
    backgroundColor: C.surface2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: C.textMuted },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.active,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: C.bg },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: C.text,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
  },
  filterTabActive: { backgroundColor: C.activeAlpha },
  filterTabText: { fontFamily: 'Inter-Medium', fontSize: 12, color: C.textFaint },
  filterTabTextActive: { color: C.active },
  list: { padding: 12, gap: 8, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.activeAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: C.text },
  cardPreview: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.textMuted, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardDate: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.textFaint },
  cardSize: { fontFamily: 'Inter-Regular', fontSize: 11, color: C.textFaint },
  cardActions: { flexDirection: 'column', gap: 8, alignItems: 'center', paddingTop: 2 },
  actionBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: C.text, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.active,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: C.bg },
});
