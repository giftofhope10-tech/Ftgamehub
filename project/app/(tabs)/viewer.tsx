import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  RefreshCw,
  Share2,
  Smartphone,
  Monitor,
  Tablet,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useEditor } from '@/lib/EditorContext';

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
};

type Viewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORT_SIZES: Record<Viewport, { width: number | '100%'; label: string }> = {
  mobile: { width: 375, label: 'Mobile' },
  tablet: { width: 768, label: 'Tablet' },
  desktop: { width: '100%', label: 'Desktop' },
};

export default function ViewerScreen() {
  const { currentContent, currentTitle } = useEditor();
  const [viewport, setViewport] = useState<Viewport>('mobile');
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const webRef = useRef<WebView>(null);

  const htmlSource = { html: currentContent, baseUrl: '' };

  const handleShare = async () => {
    try {
      await Share.share({ title: currentTitle, message: currentContent });
    } catch (_) {}
  };

  const handleReload = () => {
    webRef.current?.reload();
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));

  const viewportSize = VIEWPORT_SIZES[viewport];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} numberOfLines={1}>{currentTitle}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleReload}>
            <RefreshCw size={18} color={C.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={18} color={C.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Viewport selector */}
      <View style={styles.viewportBar}>
        <TouchableOpacity
          style={[styles.viewportBtn, viewport === 'mobile' && styles.viewportBtnActive]}
          onPress={() => setViewport('mobile')}
        >
          <Smartphone size={16} color={viewport === 'mobile' ? C.active : C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.viewportLabel, viewport === 'mobile' && styles.viewportLabelActive]}>
            Mobile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewportBtn, viewport === 'tablet' && styles.viewportBtnActive]}
          onPress={() => setViewport('tablet')}
        >
          <Tablet size={16} color={viewport === 'tablet' ? C.active : C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.viewportLabel, viewport === 'tablet' && styles.viewportLabelActive]}>
            Tablet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewportBtn, viewport === 'desktop' && styles.viewportBtnActive]}
          onPress={() => setViewport('desktop')}
        >
          <Monitor size={16} color={viewport === 'desktop' ? C.active : C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.viewportLabel, viewport === 'desktop' && styles.viewportLabelActive]}>
            Desktop
          </Text>
        </TouchableOpacity>

        <View style={styles.toolSep} />

        <TouchableOpacity style={styles.iconBtnSmall} onPress={handleZoomOut}>
          <ZoomOut size={16} color={C.textMuted} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.iconBtnSmall} onPress={handleZoomIn}>
          <ZoomIn size={16} color={C.textMuted} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* WebView container */}
      <View style={styles.previewContainer}>
        <View style={[
          styles.previewFrame,
          viewport !== 'desktop' && { width: viewportSize.width as number * zoom, alignSelf: 'center' },
        ]}>
          <WebView
            ref={webRef}
            source={htmlSource}
            style={[styles.webview, { transform: [{ scale: zoom }], transformOrigin: 'top left' }]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mixedContentMode="always"
            originWhitelist={['*']}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={C.active} size="large" />
            </View>
          )}
        </View>
      </View>

      {/* Bottom info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {viewportSize.label} {viewport !== 'desktop' ? `· ${viewportSize.width}px` : ''}
        </Text>
        <Text style={styles.infoText}>{currentContent.length} chars</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: C.text, flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText: { fontFamily: 'Inter-Medium', fontSize: 10, color: '#22C55E' },
  headerRight: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewportBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 4,
  },
  viewportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewportBtnActive: { backgroundColor: C.activeAlpha },
  viewportLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: C.textMuted },
  viewportLabelActive: { color: C.active },
  toolSep: { flex: 1 },
  iconBtnSmall: {
    padding: 6,
    borderRadius: 6,
  },
  zoomText: { fontFamily: 'Inter-Medium', fontSize: 12, color: C.textMuted, minWidth: 36, textAlign: 'center' },
  previewContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  previewFrame: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: { flex: 1, backgroundColor: 'white' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  infoText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 11, color: C.textFaint },
});
