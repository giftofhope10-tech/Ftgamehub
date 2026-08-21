import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Type,
  Moon,
  WrapText,
  Save,
  Info,
  ChevronRight,
  Minus,
  Plus,
  Code,
  Palette,
  Github,
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
  success: '#22D3EE',
  warning: '#FBBF24',
};

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  icon,
  label,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );
}

function Stepper({ value, min, max, step = 1, onChange }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >
        <Minus size={14} color={value <= min ? C.textFaint : C.text} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
      >
        <Plus size={14} color={value >= max ? C.textFaint : C.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

function LinkRow({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(url)}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={[styles.rowBody, { flex: 1 }]}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <ChevronRight size={16} color={C.textFaint} strokeWidth={1.8} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { fontSize, wordWrap, theme, autoSave, setFontSize, setWordWrap, setTheme, setAutoSave } = useEditor();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Settings size={20} color={C.active} strokeWidth={1.8} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="EDITOR" />
        <View style={styles.card}>
          <SettingRow
            icon={<Type size={18} color={C.active} strokeWidth={1.8} />}
            label="Font Size"
            subtitle="Code editor font size"
            right={
              <Stepper value={fontSize} min={10} max={24} onChange={setFontSize} />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<WrapText size={18} color={C.active} strokeWidth={1.8} />}
            label="Word Wrap"
            subtitle="Wrap long lines in editor"
            right={
              <Switch
                value={wordWrap}
                onValueChange={setWordWrap}
                trackColor={{ false: C.surface2, true: C.active }}
                thumbColor={C.text}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Save size={18} color={C.active} strokeWidth={1.8} />}
            label="Auto-Save"
            subtitle="Save automatically while editing"
            right={
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: C.surface2, true: C.active }}
                thumbColor={C.text}
              />
            }
          />
        </View>

        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Palette size={18} color={C.active} strokeWidth={1.8} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Preview Theme</Text>
              <Text style={styles.rowSubtitle}>Background for the HTML preview</Text>
            </View>
          </View>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeOption, styles.themeOptionDark, theme === 'dark' && styles.themeOptionActive]}
              onPress={() => setTheme('dark')}
            >
              <Moon size={16} color={C.text} strokeWidth={1.8} />
              <Text style={styles.themeLabel}>Dark UI</Text>
              {theme === 'dark' && <View style={styles.themeCheck} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, styles.themeOptionLight, theme === 'light' && styles.themeOptionActive]}
              onPress={() => setTheme('light')}
            >
              <Code size={16} color={'#1E293B'} strokeWidth={1.8} />
              <Text style={[styles.themeLabel, { color: '#1E293B' }]}>Light UI</Text>
              {theme === 'light' && <View style={[styles.themeCheck, { backgroundColor: '#0F172A' }]} />}
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <View style={styles.aboutHeader}>
            <View style={styles.aboutIcon}>
              <Code size={28} color={C.active} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={styles.aboutTitle}>HTML Editor & Viewer</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureList}>
            {[
              'Syntax highlighting for HTML, CSS & JS',
              'Live preview with viewport simulation',
              'Cloud file storage with Supabase',
              'Snippet library for quick insertion',
              'Share & export HTML files',
            ].map(f => (
              <View key={f} style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    gap: 8,
  },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: C.text },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  sectionHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: C.textFaint,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.activeAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: 'Inter-Medium', fontSize: 15, color: C.text },
  rowSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.textMuted },
  rowRight: {},
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: C.text,
    minWidth: 30,
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionDark: { backgroundColor: C.surface2 },
  themeOptionLight: { backgroundColor: '#F1F5F9' },
  themeOptionActive: { borderColor: C.active },
  themeLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: C.text },
  themeCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.active,
    marginLeft: 'auto',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  aboutIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.activeAlpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: { fontFamily: 'Inter-Bold', fontSize: 15, color: C.text },
  aboutVersion: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.textMuted, marginTop: 2 },
  featureList: { padding: 16, gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.active,
    marginTop: 6,
    flexShrink: 0,
  },
  featureText: { fontFamily: 'Inter-Regular', fontSize: 13, color: C.textMuted, flex: 1, lineHeight: 20 },
});
