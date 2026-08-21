import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HtmlFile } from '@/types/database';

interface EditorContextValue {
  currentContent: string;
  currentTitle: string;
  currentFileId: string | null;
  isDirty: boolean;
  fontSize: number;
  wordWrap: boolean;
  theme: 'dark' | 'light';
  autoSave: boolean;
  setCurrentContent: (v: string) => void;
  setCurrentTitle: (v: string) => void;
  setFontSize: (v: number) => void;
  setWordWrap: (v: boolean) => void;
  setTheme: (v: 'dark' | 'light') => void;
  setAutoSave: (v: boolean) => void;
  saveFile: () => Promise<void>;
  loadFile: (file: HtmlFile) => void;
  newFile: () => void;
  isSaving: boolean;
  saveError: string | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: #f9fafb;
      color: #1f2937;
    }
    h1 { color: #0ea5e9; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start editing your HTML here.</p>
</body>
</html>`;

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [currentContent, setContentState] = useState(DEFAULT_HTML);
  const [currentTitle, setTitleState] = useState('Untitled');
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fontSize, setFontSizeState] = useState(13);
  const [wordWrap, setWordWrapState] = useState(true);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [autoSave, setAutoSaveState] = useState(false);

  const setCurrentContent = useCallback((v: string) => {
    setContentState(v);
    setIsDirty(true);
  }, []);

  const setCurrentTitle = useCallback((v: string) => {
    setTitleState(v);
    setIsDirty(true);
  }, []);

  const setFontSize = useCallback((v: number) => setFontSizeState(v), []);
  const setWordWrap = useCallback((v: boolean) => setWordWrapState(v), []);
  const setTheme = useCallback((v: 'dark' | 'light') => setThemeState(v), []);
  const setAutoSave = useCallback((v: boolean) => setAutoSaveState(v), []);

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const saveFile = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    const preview = stripHtml(currentContent).slice(0, 200);
    const wc = currentContent.length;

    try {
      if (currentFileId) {
        const { error } = await supabase
          .from('html_files')
          .update({ title: currentTitle, content: currentContent, preview_text: preview, word_count: wc })
          .eq('id', currentFileId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('html_files')
          .insert({ title: currentTitle, content: currentContent, preview_text: preview, word_count: wc })
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setCurrentFileId(data.id);
      }
      setIsDirty(false);
    } catch (e: any) {
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [currentContent, currentTitle, currentFileId]);

  const loadFile = useCallback((file: HtmlFile) => {
    setContentState(file.content);
    setTitleState(file.title);
    setCurrentFileId(file.id);
    setIsDirty(false);
  }, []);

  const newFile = useCallback(() => {
    setContentState(DEFAULT_HTML);
    setTitleState('Untitled');
    setCurrentFileId(null);
    setIsDirty(false);
  }, []);

  return (
    <EditorContext.Provider value={{
      currentContent, currentTitle, currentFileId, isDirty,
      fontSize, wordWrap, theme, autoSave,
      setCurrentContent, setCurrentTitle, setFontSize, setWordWrap, setTheme, setAutoSave,
      saveFile, loadFile, newFile, isSaving, saveError,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
