import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Save,
  FilePlus,
  AlignLeft,
  WrapText,
  ChevronDown,
  Check,
  Copy,
  ClipboardPaste,
} from 'lucide-react-native';
import { useEditor } from '@/lib/EditorContext';
import * as ExpoClipboard from 'expo-clipboard';

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
  danger: '#F87171',
  keyword: '#F472B6',
  tag: '#38BDF8',
  attr: '#34D399',
  value: '#FBBF24',
  comment: '#64748B',
  string: '#86EFAC',
};

const SNIPPETS = [
  { label: 'div', code: '<div class="">\n  \n</div>' },
  { label: 'p', code: '<p></p>' },
  { label: 'h1', code: '<h1></h1>' },
  { label: 'img', code: '<img src="" alt="" />' },
  { label: 'a', code: '<a href=""></a>' },
  { label: 'ul/li', code: '<ul>\n  <li></li>\n  <li></li>\n</ul>' },
  { label: 'table', code: '<table>\n  <tr>\n    <td></td>\n    <td></td>\n  </tr>\n</table>' },
  { label: 'form', code: '<form action="" method="post">\n  <input type="text" name="" />\n  <button type="submit">Submit</button>\n</form>' },
  { label: 'script', code: '<script>\n  \n</script>' },
  { label: 'style', code: '<style>\n  \n</style>' },
  { label: 'link', code: '<link rel="stylesheet" href="" />' },
  { label: 'meta', code: '<meta name="" content="" />' },
];

const FONT_SIZES = [11, 12, 13, 14, 15, 16, 18, 20];

function tokenizeLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    // HTML comment
    const commentMatch = remaining.match(/^(<!--.*?-->)/s);
    if (commentMatch) {
      parts.push(<Text key={key++} style={{ color: C.comment }}>{commentMatch[1]}</Text>);
      remaining = remaining.slice(commentMatch[1].length);
      continue;
    }
    // Opening/closing tag
    const tagMatch = remaining.match(/^(<\/?[a-zA-Z][a-zA-Z0-9\-]*)((?:\s+[^>]*)?)(\/?>)/);
    if (tagMatch) {
      parts.push(<Text key={key++} style={{ color: C.tag }}>{tagMatch[1]}</Text>);
      // Parse attributes inside
      const attrStr = tagMatch[2];
      if (attrStr.length > 0) {
        const attrParts: React.ReactNode[] = [];
        let ap = attrStr;
        let ak = 0;
        while (ap.length > 0) {
          const attrKv = ap.match(/^(\s+)([a-zA-Z\-:]+)(=)("([^"]*)")/);
          if (attrKv) {
            attrParts.push(<Text key={ak++} style={{ color: C.textMuted }}>{attrKv[1]}</Text>);
            attrParts.push(<Text key={ak++} style={{ color: C.attr }}>{attrKv[2]}</Text>);
            attrParts.push(<Text key={ak++} style={{ color: C.textFaint }}>{attrKv[3]}</Text>);
            attrParts.push(<Text key={ak++} style={{ color: C.value }}>{"\"" + attrKv[5] + "\""}</Text>);
            ap = ap.slice(attrKv[0].length);
          } else if (ap.match(/^\s+[a-zA-Z\-:]+/)) {
            const boolAttr = ap.match(/^(\s+)([a-zA-Z\-:]+)/);
            if (boolAttr) {
              attrParts.push(<Text key={ak++} style={{ color: C.textMuted }}>{boolAttr[1]}</Text>);
              attrParts.push(<Text key={ak++} style={{ color: C.attr }}>{boolAttr[2]}</Text>);
              ap = ap.slice(boolAttr[0].length);
            } else {
              attrParts.push(<Text key={ak++} style={{ color: C.textMuted }}>{ap}</Text>);
              ap = '';
            }
          } else {
            attrParts.push(<Text key={ak++} style={{ color: C.textMuted }}>{ap}</Text>);
            ap = '';
          }
        }
        parts.push(...attrParts);
      }
      parts.push(<Text key={key++} style={{ color: C.tag }}>{tagMatch[3]}</Text>);
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }
    // CSS property: value
    const cssMatch = remaining.match(/^([a-zA-Z\-]+)(\s*:\s*)([^;{}\n]+)(;?)/);
    if (cssMatch) {
      parts.push(<Text key={key++} style={{ color: C.attr }}>{cssMatch[1]}</Text>);
      parts.push(<Text key={key++} style={{ color: C.textFaint }}>{cssMatch[2]}</Text>);
      parts.push(<Text key={key++} style={{ color: C.value }}>{cssMatch[3]}</Text>);
      parts.push(<Text key={key++} style={{ color: C.textFaint }}>{cssMatch[4]}</Text>);
      remaining = remaining.slice(cssMatch[0].length);
      continue;
    }
    // Fallback: plain text char by char batched
    const plainEnd = remaining.search(/[<]/);
    if (plainEnd === -1) {
      parts.push(<Text key={key++} style={{ color: C.text }}>{remaining}</Text>);
      remaining = '';
    } else if (plainEnd === 0) {
      parts.push(<Text key={key++} style={{ color: C.text }}>{remaining[0]}</Text>);
      remaining = remaining.slice(1);
    } else {
      parts.push(<Text key={key++} style={{ color: C.text }}>{remaining.slice(0, plainEnd)}</Text>);
      remaining = remaining.slice(plainEnd);
    }
  }

  return parts;
}

function SyntaxLine({ line, lineNum, showLineNums }: { line: string; lineNum: number; showLineNums: boolean }) {
  const tokens = tokenizeLine(line);
  return (
    <View style={styles.syntaxLine}>
      {showLineNums && (
        <Text style={styles.lineNum}>{String(lineNum).padStart(3, ' ')}</Text>
      )}
      <Text style={styles.lineContent}>{tokens}</Text>
    </View>
  );
}

export default function EditorScreen() {
  const {
    currentContent, currentTitle, isDirty, isSaving, saveError,
    fontSize, wordWrap,
    setCurrentContent, setCurrentTitle, setFontSize, setWordWrap,
    saveFile, newFile,
  } = useEditor();

  const [showSnippets, setShowSnippets] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showLineNums, setShowLineNums] = useState(true);
  const [rawMode, setRawMode] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const lines = currentContent.split('\n');

  const insertSnippet = useCallback((code: string) => {
    const before = currentContent.slice(0, selection.start);
    const after = currentContent.slice(selection.end);
    setCurrentContent(before + code + after);
    setShowSnippets(false);
  }, [currentContent, selection, setCurrentContent]);

  const handleAutoClose = useCallback((text: string) => {
    const last = text[text.length - 1];
    const pairs: Record<string, string> = { '<': '>', '{': '}', '(': ')' };
    if (pairs[last]) {
      const cursor = text.length;
      setCurrentContent(text + pairs[last]);
      return;
    }
    setCurrentContent(text);
  }, [setCurrentContent]);

  const handleSave = useCallback(async () => {
    await saveFile();
  }, [saveFile]);

  const handleNew = useCallback(() => {
    if (isDirty) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Create new file?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New File', style: 'destructive', onPress: newFile },
      ]);
    } else {
      newFile();
    }
  }, [isDirty, newFile]);

  const handleCopy = useCallback(async () => {
    await ExpoClipboard.setStringAsync(currentContent);
  }, [currentContent]);

  const handlePaste = useCallback(async () => {
    const text = await ExpoClipboard.getStringAsync();
    const before = currentContent.slice(0, selection.start);
    const after = currentContent.slice(selection.end);
    setCurrentContent(before + text + after);
  }, [currentContent, selection, setCurrentContent]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TextInput
            value={currentTitle}
            onChangeText={setCurrentTitle}
            style={styles.titleInput}
            placeholder="File name..."
            placeholderTextColor={C.textFaint}
            maxLength={80}
          />
          {isDirty && <View style={styles.dirtyDot} />}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleNew}>
            <FilePlus size={20} color={C.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={C.bg} />
            ) : (
              <Save size={18} color={C.bg} strokeWidth={2} />
            )}
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner */}
      {saveError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      {/* Toolbar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.toolbarScroll}
        contentContainerStyle={styles.toolbar}
      >
        <TouchableOpacity style={styles.toolBtn} onPress={() => setShowSnippets(true)}>
          <Text style={styles.toolBtnText}>{'</>'} Snippets</Text>
        </TouchableOpacity>

        <View style={styles.toolSep} />

        <TouchableOpacity
          style={[styles.toolBtn, showLineNums && styles.toolBtnActive]}
          onPress={() => setShowLineNums(v => !v)}
        >
          <AlignLeft size={15} color={showLineNums ? C.active : C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.toolBtnText, showLineNums && styles.toolBtnTextActive]}>Lines</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, wordWrap && styles.toolBtnActive]}
          onPress={() => setWordWrap(!wordWrap)}
        >
          <WrapText size={15} color={wordWrap ? C.active : C.textMuted} strokeWidth={1.8} />
          <Text style={[styles.toolBtnText, wordWrap && styles.toolBtnTextActive]}>Wrap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={() => setShowFontPicker(true)}>
          <Text style={styles.toolBtnText}>Aa {fontSize}px</Text>
          <ChevronDown size={12} color={C.textMuted} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.toolSep} />

        <TouchableOpacity style={styles.toolBtn} onPress={handleCopy}>
          <Copy size={15} color={C.textMuted} strokeWidth={1.8} />
          <Text style={styles.toolBtnText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={handlePaste}>
          <ClipboardPaste size={15} color={C.textMuted} strokeWidth={1.8} />
          <Text style={styles.toolBtnText}>Paste</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statText}>{lines.length} lines</Text>
        <Text style={styles.statText}>{currentContent.length} chars</Text>
        <Text style={styles.statText}>HTML</Text>
      </View>

      {/* Editor area */}
      <KeyboardAvoidingView
        style={styles.editorContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={120}
      >
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          {/* Syntax view layer */}
          <View style={styles.syntaxLayer} pointerEvents="none">
            {lines.map((line, i) => (
              <SyntaxLine
                key={i}
                line={line}
                lineNum={i + 1}
                showLineNums={showLineNums}
              />
            ))}
          </View>
          {/* Raw input layer */}
          <TextInput
            ref={inputRef}
            value={currentContent}
            onChangeText={handleAutoClose}
            onSelectionChange={e => setSelection(e.nativeEvent.selection)}
            style={[
              styles.rawInput,
              {
                fontSize,
                lineHeight: fontSize * 1.6,
                paddingLeft: showLineNums ? 44 : 12,
                flexWrap: wordWrap ? 'wrap' : 'nowrap',
              },
            ]}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled={false}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Snippets Modal */}
      <Modal visible={showSnippets} transparent animationType="slide" onRequestClose={() => setShowSnippets(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSnippets(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>HTML Snippets</Text>
            <ScrollView>
              {SNIPPETS.map(s => (
                <TouchableOpacity key={s.label} style={styles.snippetRow} onPress={() => insertSnippet(s.code)}>
                  <Text style={styles.snippetLabel}>{`<${s.label}>`}</Text>
                  <Text style={styles.snippetCode} numberOfLines={1}>{s.code.replace(/\n/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Font Size Modal */}
      <Modal visible={showFontPicker} transparent animationType="fade" onRequestClose={() => setShowFontPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFontPicker(false)}>
          <View style={styles.fontPickerSheet}>
            <Text style={styles.modalTitle}>Font Size</Text>
            <View style={styles.fontGrid}>
              {FONT_SIZES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.fontOption, fontSize === s && styles.fontOptionActive]}
                  onPress={() => { setFontSize(s); setShowFontPicker(false); }}
                >
                  {fontSize === s && <Check size={12} color={C.bg} strokeWidth={2.5} />}
                  <Text style={[styles.fontOptionText, fontSize === s && styles.fontOptionTextActive]}>{s}px</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleInput: {
    flex: 1,
    color: C.text,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    paddingVertical: 4,
  },
  dirtyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.warning },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 12,
    gap: 6,
    backgroundColor: C.active,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: C.bg },
  errorBanner: { backgroundColor: '#450A0A', paddingHorizontal: 16, paddingVertical: 8 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.danger },
  toolbarScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: C.border },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
    height: 44,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toolBtnActive: { backgroundColor: C.activeAlpha },
  toolBtnText: { fontFamily: 'Inter-Medium', fontSize: 12, color: C.textMuted },
  toolBtnTextActive: { color: C.active },
  toolSep: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 10, color: C.textFaint },
  editorContainer: { flex: 1 },
  editorScroll: { flex: 1 },
  syntaxLayer: { position: 'absolute', top: 0, left: 0, right: 0, padding: 12, pointerEvents: 'none' },
  syntaxLine: { flexDirection: 'row', minHeight: 20 },
  lineNum: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    lineHeight: 13 * 1.6,
    color: C.textFaint,
    width: 32,
    textAlign: 'right',
    marginRight: 8,
    userSelect: 'none',
  },
  lineContent: { fontFamily: 'JetBrainsMono-Regular', fontSize: 13, lineHeight: 13 * 1.6, flex: 1 },
  rawInput: {
    fontFamily: 'JetBrainsMono-Regular',
    color: 'transparent',
    padding: 12,
    minHeight: '100%',
  } as any,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: C.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  snippetLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    color: C.tag,
    width: 80,
  },
  snippetCode: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: C.textMuted,
    flex: 1,
  },
  fontPickerSheet: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  fontOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.surface2,
  },
  fontOptionActive: { backgroundColor: C.active },
  fontOptionText: { fontFamily: 'Inter-Medium', fontSize: 13, color: C.textMuted },
  fontOptionTextActive: { color: C.bg },
});
