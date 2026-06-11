import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Code2, Component, Cpu, Layers, Copy, Check, Sparkles, Send,
  FileText, RefreshCw, HardDrive, Folder, Save, ChevronRight, BrainCircuit,
  FolderOpen, ArrowUp, Plus, X, Pencil, Trash2, FilePlus, RotateCcw
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// ── Toast Notification System ────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-icon">
            {t.type === 'success' && <Check size={14} />}
            {t.type === 'error' && <X size={14} />}
            {t.type === 'info' && <Sparkles size={14} />}
          </span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Logo Component (inline SVG, no external dependency) ──────────────────────
function SynthegnoticaLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="sg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="sgglow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#090a0f" />
      <circle cx="50" cy="50" r="48" fill="url(#sg1)" fillOpacity="0.1" />
      <circle cx="50" cy="50" r="47" stroke="url(#sg1)" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* S-curve neural path */}
      <path d="M 63 26 C 76 26 76 42 63 42 L 37 58 C 24 58 24 74 37 74"
        stroke="url(#sg1)" strokeWidth="7.5" strokeLinecap="round" fill="none" filter="url(#sgglow)" />
      {/* Neural nodes */}
      <circle cx="63" cy="26" r="5" fill="url(#sg1)" filter="url(#sgglow)" />
      <circle cx="50" cy="50" r="4" fill="url(#sg2)" filter="url(#sgglow)" />
      <circle cx="37" cy="74" r="5" fill="url(#sg2)" filter="url(#sgglow)" />
      {/* Branch sparks */}
      <line x1="63" y1="26" x2="74" y2="18" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="74" cy="18" r="2.5" fill="#a855f7" opacity="0.9" />
      <line x1="50" y1="50" x2="60" y2="42" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="60" cy="42" r="2" fill="#06b6d4" opacity="0.9" />
      <line x1="37" y1="74" x2="26" y2="82" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="26" cy="82" r="2.5" fill="#a855f7" opacity="0.9" />
    </svg>
  );
}

let toastIdCounter = 0;

export default function App() {
  const [activeTab, setActiveTab] = useState('playground');
  const [messages, setMessages] = useState([{
    sender: 'assistant',
    text: 'Welcome to Synthegnotica! I am your synthegnotic AI coding assistant — free, cloud-powered, no API keys needed.\n\nSelect a model from the dropdown above, pick a workspace folder using the folder icon, then describe what you want to build and I will generate the full code for you.'
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFile, setActiveFile] = useState('');
  const [activeFileContent, setActiveFileContent] = useState('');
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [isSavingEditor, setIsSavingEditor] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [workspacePath, setWorkspacePath] = useState('');
  const [newPathInput, setNewPathInput] = useState('');
  const [isChangingWorkspace, setIsChangingWorkspace] = useState(false);
  const [toasts, setToasts] = useState([]);

  // New file modal
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Rename modal
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Folder browser modal
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [modalCurrentPath, setModalCurrentPath] = useState('');
  const [modalParentPath, setModalParentPath] = useState('');
  const [modalSubfolders, setModalSubfolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const [extractedFiles, setExtractedFiles] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});

  const chatEndRef = useRef(null);
  const editorRef = useRef(null);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { loadWorkspaceInfo(); }, []);

  useEffect(() => {
    if (activeFile && workspacePath) {
      loadFileContent(activeFile);
      setIsEditorDirty(false);
    } else {
      setActiveFileContent('');
      setIsEditorDirty(false);
    }
  }, [activeFile, workspacePath]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditorDirty) handleSaveEditorContent();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditorDirty, activeFile, activeFileContent, workspacePath]);

  // ── Workspace ─────────────────────────────────────────────────────────────
  const loadWorkspaceInfo = async () => {
    try {
      let savedPath = localStorage.getItem('synthegnotica_workspace_path');
      if (!savedPath) {
        const info = await invoke('browse_folders', { path: null });
        savedPath = info.currentPath + '/SynthegnoticaWorkspace';
        localStorage.setItem('synthegnotica_workspace_path', savedPath);
      }
      setWorkspacePath(savedPath);
      setNewPathInput(savedPath);
      loadWorkspaceFiles(savedPath);
    } catch (err) {
      console.error('Error loading workspace info:', err);
    }
  };

  const loadWorkspaceFiles = async (path) => {
    if (!path) return;
    try {
      const files = await invoke('get_files', { workspaceRoot: path });
      setWorkspaceFiles(files);
      if (files.length > 0) setActiveFile(files[0].path);
      else setActiveFile('');
    } catch (err) {
      console.error('Error loading workspace files:', err);
    }
  };

  const loadFileContent = async (filePath) => {
    try {
      const content = await invoke('read_file', { workspaceRoot: workspacePath, filePath });
      setActiveFileContent(content);
    } catch (err) {
      setActiveFileContent(`// Error loading file: ${err}`);
    }
  };

  const applyWorkspaceChange = async (targetPath) => {
    const files = await invoke('get_files', { workspaceRoot: targetPath });
    setWorkspacePath(targetPath);
    setNewPathInput(targetPath);
    localStorage.setItem('synthegnotica_workspace_path', targetPath);
    setActiveFile('');
    setActiveFileContent('');
    setExtractedFiles([]);
    setSaveStatus({});
    setWorkspaceFiles(files);
    if (files.length > 0) setActiveFile(files[0].path);
    return files;
  };

  const handleChangeWorkspace = async (e) => {
    if (e) e.preventDefault();
    if (!newPathInput.trim() || isChangingWorkspace) return;
    setIsChangingWorkspace(true);
    try {
      const targetPath = newPathInput.trim().replace(/\\/g, '/');
      await applyWorkspaceChange(targetPath);
      toast(`Workspace switched to ${targetPath}`, 'success');
    } catch (err) {
      toast(`Error changing folder: ${err}`, 'error');
    } finally {
      setIsChangingWorkspace(false);
    }
  };

  const handleOpenFolderBrowser = async () => {
    try {
      const selected = await invoke('select_directory', { defaultPath: workspacePath });
      if (selected) {
        setIsChangingWorkspace(true);
        await applyWorkspaceChange(selected);
        toast(`Workspace changed to ${selected}`, 'success');
      }
    } catch (err) {
      if (!String(err).includes('cancelled')) toast('Folder picker cancelled or failed', 'error');
    } finally {
      setIsChangingWorkspace(false);
    }
  };

  const handleOpenVisualBrowser = async () => {
    setShowBrowserModal(true);
    setIsLoadingModal(true);
    try {
      const data = await invoke('browse_folders', { path: newPathInput || workspacePath || null });
      if (data.currentPath) {
        setModalCurrentPath(data.currentPath);
        setModalParentPath(data.parentPath);
        setModalSubfolders(data.subfolders || []);
      }
    } catch (err) {
      toast('Error launching folder explorer', 'error');
    } finally {
      setIsLoadingModal(false);
    }
  };

  const navigateModalFolder = async (targetPath) => {
    setIsLoadingModal(true);
    try {
      const data = await invoke('browse_folders', { path: targetPath });
      if (data.currentPath) {
        setModalCurrentPath(data.currentPath);
        setModalParentPath(data.parentPath);
        setModalSubfolders(data.subfolders || []);
      }
    } catch (err) {
      toast(`Navigation error: ${err}`, 'error');
    } finally {
      setIsLoadingModal(false);
    }
  };

  const handleCreateFolder = async (e) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await invoke('create_folder', { parentPath: modalCurrentPath, folderName: newFolderName.trim() });
      setNewFolderName('');
      navigateModalFolder(modalCurrentPath);
      toast('Folder created', 'success');
    } catch (err) {
      toast(`Error creating folder: ${err}`, 'error');
    }
  };

  const handleSelectModalFolder = async () => {
    setIsChangingWorkspace(true);
    try {
      await applyWorkspaceChange(modalCurrentPath);
      setShowBrowserModal(false);
      toast(`Workspace set to ${modalCurrentPath}`, 'success');
    } catch (err) {
      toast(`Error setting workspace: ${err}`, 'error');
    } finally {
      setIsChangingWorkspace(false);
    }
  };

  // ── File Operations ───────────────────────────────────────────────────────
  const handleSaveEditorContent = async () => {
    if (!activeFile || !workspacePath || isSavingEditor) return;
    setIsSavingEditor(true);
    try {
      await invoke('save_file', { workspaceRoot: workspacePath, filePath: activeFile, content: activeFileContent });
      setIsEditorDirty(false);
      toast(`Saved ${activeFile}`, 'success');
    } catch (err) {
      toast(`Save failed: ${err}`, 'error');
    } finally {
      setIsSavingEditor(false);
    }
  };

  const handleCreateNewFile = async (e) => {
    if (e) e.preventDefault();
    if (!newFileName.trim() || !workspacePath) return;
    try {
      await invoke('save_file', { workspaceRoot: workspacePath, filePath: newFileName.trim(), content: '' });
      const files = await invoke('get_files', { workspaceRoot: workspacePath });
      setWorkspaceFiles(files);
      setActiveFile(newFileName.trim());
      setShowNewFileModal(false);
      setNewFileName('');
      toast(`Created ${newFileName.trim()}`, 'success');
    } catch (err) {
      toast(`Error creating file: ${err}`, 'error');
    }
  };

  const handleDeleteFile = async (filePath) => {
    if (!window.confirm(`Delete "${filePath}"? This cannot be undone.`)) return;
    try {
      await invoke('delete_file', { workspaceRoot: workspacePath, filePath });
      const files = await invoke('get_files', { workspaceRoot: workspacePath });
      setWorkspaceFiles(files);
      if (activeFile === filePath) {
        setActiveFile(files.length > 0 ? files[0].path : '');
        setActiveFileContent('');
        setIsEditorDirty(false);
      }
      toast(`Deleted ${filePath}`, 'success');
    } catch (err) {
      toast(`Delete failed: ${err}`, 'error');
    }
  };

  const handleRenameFile = async (e) => {
    if (e) e.preventDefault();
    if (!renameValue.trim() || !renamingFile) return;
    try {
      await invoke('rename_file', { workspaceRoot: workspacePath, oldPath: renamingFile, newPath: renameValue.trim() });
      const files = await invoke('get_files', { workspaceRoot: workspacePath });
      setWorkspaceFiles(files);
      if (activeFile === renamingFile) setActiveFile(renameValue.trim());
      setRenamingFile(null);
      setRenameValue('');
      toast(`Renamed to ${renameValue.trim()}`, 'success');
    } catch (err) {
      toast(`Rename failed: ${err}`, 'error');
    }
  };

  const handleRefreshWorkspace = async () => {
    if (!workspacePath) return;
    await loadWorkspaceFiles(workspacePath);
    toast('Workspace refreshed', 'info');
  };

  // ── AI ────────────────────────────────────────────────────────────────────
  const parseGeneratedFiles = (text) => {
    const fileRegex = /###\s*\[(?:NEW|MODIFY)\]\s*([a-zA-Z0-9_\-\.\/]+)\s*[\r\n]+```[a-zA-Z\-]*[\r\n]+([\s\S]*?)```/gi;
    const files = [];
    let match;
    while ((match = fileRegex.exec(text)) !== null) {
      files.push({ path: match[1].trim(), content: match[2] });
    }
    if (files.length === 0) {
      const singleMatch = /```[a-zA-Z\-]*[\r\n]+([\s\S]*?)```/i.exec(text);
      if (singleMatch) files.push({ path: 'app.js', content: singleMatch[1] });
    }
    return files;
  };

  const handleSendMessage = async (textToSend) => {
    const input = textToSend || chatInput;
    if (!input.trim() || isGenerating) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setChatInput('');
    setIsGenerating(true);
    setExtractedFiles([]);
    setSaveStatus({});
    setMessages(prev => [...prev, { sender: 'assistant', text: '' }]);
    try {
      if (!window.puter?.ai) throw new Error('Puter.js SDK not loaded. Check your internet connection.');
      const prompt = `You are Synthegnotica AI, an expert software developer and coding assistant.\nWhen generating code files, always use this exact format so files can be saved to disk:\n\n### [NEW] filename.js\n\`\`\`javascript\n// code here\n\`\`\`\n\n### [NEW] styles.css\n\`\`\`css\n/* styles here */\n\`\`\`\n\nAlways write complete, production-ready files. Never use placeholders.\n\nUser Request: ${input}`;
      const response = await window.puter.ai.chat(prompt, { model: selectedModel, stream: true });
      let accumulated = '';
      for await (const part of response) {
        accumulated += part?.text || '';
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: 'assistant', text: accumulated };
          return updated;
        });
      }
      const files = parseGeneratedFiles(accumulated);
      setExtractedFiles(files);
      if (files.length > 0) toast(`${files.length} file(s) ready to save`, 'info');
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'assistant', text: `❌ Error: ${err.message || 'Could not connect to Synthegnotica AI.'}` };
        return updated;
      });
      toast(err.message || 'AI request failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDisk = async (file) => {
    const { path, content } = file;
    setSaveStatus(prev => ({ ...prev, [path]: 'saving' }));
    try {
      await invoke('save_file', { workspaceRoot: workspacePath, filePath: path, content });
      setSaveStatus(prev => ({ ...prev, [path]: 'success' }));
      const files = await invoke('get_files', { workspaceRoot: workspacePath });
      setWorkspaceFiles(files);
      setActiveFile(path);
      toast(`Saved ${path}`, 'success');
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [path]: 'error' }));
      toast(`Failed to save ${path}`, 'error');
    }
  };

  const handleSaveAll = async () => {
    const unsaved = extractedFiles.filter(f => saveStatus[f.path] !== 'success');
    for (const file of unsaved) await handleSaveToDisk(file);
  };

  // ── Clipboard ─────────────────────────────────────────────────────────────
  const handleCopyCode = () => {
    if (!activeFileContent) return;
    navigator.clipboard.writeText(activeFileContent);
    setCopiedFile(true);
    toast('Code copied to clipboard', 'success');
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleCopyComponent = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([{ sender: 'assistant', text: 'Chat cleared. What would you like to build?' }]);
    setExtractedFiles([]);
    setSaveStatus({});
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const systemDiagnostics = [
    { label: 'Application', value: 'Synthegnotica v0.1.0', icon: <Sparkles size={15} /> },
    { label: 'AI Engine', value: 'Puter.js Cloud (Free)', icon: <BrainCircuit size={15} /> },
    { label: 'Active Model', value: selectedModel, icon: <Cpu size={15} /> },
    { label: 'Node.js Runtime', value: 'v24.14.0', icon: <Layers size={15} /> },
    { label: 'NPM', value: 'v11.9.0', icon: <HardDrive size={15} /> },
    { label: 'Desktop Framework', value: 'Tauri v2 (Rust)', icon: <Layers size={15} /> },
    { label: 'Workspace Path', value: workspacePath || 'Not set', icon: <Folder size={15} /> },
    { label: 'Files in Workspace', value: String(workspaceFiles.length), icon: <FileText size={15} /> },
    { label: 'AI Computing', value: '0% Local (Cloud Offloaded)', icon: <Cpu size={15} /> },
  ];

  const componentsCatalog = [
    {
      name: 'Synthegnotica Glass Card',
      desc: 'Translucent frosted-glass container with depth shadow. Perfect for dashboard panels.',
      preview: (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', backdropFilter: 'blur(16px)', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '260px' }}>
          <h4 style={{ color: '#fff', marginBottom: '8px', fontFamily: 'Outfit' }}>Glass Card</h4>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Synthegnotica glassmorphic UI.</p>
        </div>
      ),
      code: `.sg-glass-card {\n  background: rgba(255,255,255,0.03);\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 16px;\n  backdrop-filter: blur(16px);\n  box-shadow: 0 8px 32px rgba(0,0,0,0.3);\n  transition: transform 0.2s ease, border-color 0.2s ease;\n}\n.sg-glass-card:hover {\n  transform: translateY(-2px);\n  border-color: rgba(168,85,247,0.3);\n}`
    },
    {
      name: 'Neon Gradient Button',
      desc: 'Primary CTA button with a purple-indigo gradient and hover glow pulse effect.',
      preview: <button className="btn btn-primary" style={{ padding: '10px 24px' }}>Launch App</button>,
      code: `.sg-btn-primary {\n  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);\n  border: none;\n  border-radius: 8px;\n  color: white;\n  font-weight: 600;\n  padding: 12px 24px;\n  box-shadow: 0 0 15px rgba(168,85,247,0.3);\n  transition: all 0.2s ease;\n  cursor: pointer;\n}\n.sg-btn-primary:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 0 30px rgba(168,85,247,0.6);\n}`
    },
    {
      name: 'Status Badge',
      desc: 'Neon capsule status badge. Use variant classes for different semantic states.',
      preview: (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="demo-badge purple">Active</span>
          <span className="demo-badge cyan">Live</span>
        </div>
      ),
      code: `.sg-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  font-weight: 600;\n  padding: 4px 12px;\n  border-radius: 20px;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n}\n.sg-badge-purple {\n  background: rgba(168,85,247,0.15);\n  color: #c084fc;\n  border: 1px solid rgba(168,85,247,0.3);\n}\n.sg-badge-cyan {\n  background: rgba(6,182,212,0.15);\n  color: #22d3ee;\n  border: 1px solid rgba(6,182,212,0.3);\n}`
    }
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <SynthegnoticaLogo size={28} />
          </div>
          <div className="brand-text">
            <div className="brand-logo-text">Synthegnotica</div>
            <div className="brand-sub">Synthegnotic AI IDE</div>
          </div>
          <span className="brand-badge">OSS</span>
        </div>

        <nav className="nav-links">
          {[
            { id: 'playground', icon: <Code2 size={17} />, label: 'AI Playground' },
            { id: 'catalog', icon: <Component size={17} />, label: 'Component Catalog' },
            { id: 'diagnostics', icon: <Cpu size={17} />, label: 'Workspace Stats' },
          ].map(({ id, icon, label }) => (
            <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-workspace">
          <div className="sidebar-workspace-label">
            <Folder size={12} />
            <span>Workspace</span>
          </div>
          <div className="sidebar-workspace-path" title={workspacePath}>
            {workspacePath ? workspacePath.split('/').pop() || workspacePath : 'Not set'}
          </div>
          <div className="sidebar-workspace-count">
            {workspaceFiles.length} file{workspaceFiles.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="status-indicator" />
          <div className="status-text">Engine Active</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-workspace">

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="page-title">
            <h1>
              {activeTab === 'playground' && <><Code2 size={22} style={{ color: 'var(--color-primary)' }} /><span>AI Playground</span></>}
              {activeTab === 'catalog' && <><Component size={22} style={{ color: 'var(--color-secondary)' }} /><span>Component Catalog</span></>}
              {activeTab === 'diagnostics' && <><Cpu size={22} style={{ color: 'var(--color-primary)' }} /><span>Workspace Stats</span></>}
            </h1>
            <p>
              {activeTab === 'playground' && 'Describe what to build — AI generates full code files you can save directly to disk.'}
              {activeTab === 'catalog' && 'Copy production-ready UI component code to use in your projects.'}
              {activeTab === 'diagnostics' && 'Live environment & workspace diagnostics.'}
            </p>
          </div>

          <div className="workspace-bar">
            <button className="workspace-bar-icon" onClick={handleOpenFolderBrowser} title="Browse folders (native dialog)">
              <FolderOpen size={16} style={{ color: 'var(--color-secondary)' }} />
            </button>
            <input
              type="text"
              className="workspace-bar-input"
              value={newPathInput}
              onChange={e => setNewPathInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChangeWorkspace()}
              placeholder="Workspace path…"
              spellCheck={false}
            />
            <button className="btn btn-secondary workspace-bar-btn" onClick={handleChangeWorkspace} disabled={isChangingWorkspace}>
              {isChangingWorkspace ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronRight size={12} />}
              <span>{isChangingWorkspace ? 'Switching…' : 'Set'}</span>
            </button>
            <button className="workspace-bar-link" onClick={handleOpenVisualBrowser} title="Visual folder browser">
              <FolderOpen size={13} />
            </button>
          </div>
        </header>

        {/* ── Tab: AI Playground ── */}
        <section className={`tab-panel ${activeTab === 'playground' ? 'active' : ''}`}>
          <div className="playground-grid">

            {/* Left: Chat */}
            <div className="glass-card chat-card">
              <div className="card-header">
                <h3 className="card-title">
                  <Terminal size={17} style={{ color: 'var(--color-primary)' }} />
                  Synthegnotica AI
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrainCircuit size={13} style={{ color: 'var(--color-secondary)' }} />
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="model-select"
                  >
                    <optgroup label="OpenAI (Free)">
                      <option value="gpt-4o-mini">gpt-4o-mini · Fast</option>
                      <option value="gpt-4o">gpt-4o · Smart</option>
                    </optgroup>
                    <optgroup label="Claude (Free)">
                      <option value="claude-3-5-sonnet">claude-3-5-sonnet · Balanced</option>
                      <option value="claude-3-opus">claude-3-opus · Powerful</option>
                      <option value="claude-3-haiku">claude-3-haiku · Fast</option>
                    </optgroup>
                    <optgroup label="Meta Llama (Free)">
                      <option value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B</option>
                      <option value="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo">Llama 3.1 8B · Fast</option>
                    </optgroup>
                  </select>
                  <button className="icon-btn" onClick={handleClearChat} title="Clear chat">
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

              <div className="chat-history">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
                ))}
                {isGenerating && (
                  <div className="chat-bubble assistant generating">
                    <RefreshCw size={13} style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                    <span>Generating…</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Generated files panel */}
              {extractedFiles.length > 0 && (
                <div className="generated-files-panel">
                  <div className="generated-files-header">
                    <FileText size={13} />
                    <span>{extractedFiles.length} file{extractedFiles.length !== 1 ? 's' : ''} generated</span>
                    {extractedFiles.length > 1 && (
                      <button className="btn btn-cyan save-all-btn" onClick={handleSaveAll}>
                        <Save size={11} /><span>Save All</span>
                      </button>
                    )}
                  </div>
                  {extractedFiles.map(file => (
                    <div key={file.path} className="generated-file-row">
                      <FileText size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span className="generated-file-name">{file.path}</span>
                      <button
                        className={`btn save-file-btn ${saveStatus[file.path] === 'success' ? 'btn-success' : saveStatus[file.path] === 'error' ? 'btn-danger' : 'btn-cyan'}`}
                        onClick={() => handleSaveToDisk(file)}
                        disabled={saveStatus[file.path] === 'saving' || saveStatus[file.path] === 'success'}
                      >
                        {saveStatus[file.path] === 'saving' && <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />}
                        {saveStatus[file.path] === 'success' && <Check size={10} />}
                        {saveStatus[file.path] === 'error' && <X size={10} />}
                        {!saveStatus[file.path] && <Save size={10} />}
                        <span>
                          {saveStatus[file.path] === 'saving' ? 'Saving…' :
                           saveStatus[file.path] === 'success' ? 'Saved' :
                           saveStatus[file.path] === 'error' ? 'Failed' : 'Save'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Presets */}
              <div className="presets-row">
                {[
                  ['📝', 'Task List', 'Build a beautiful, fully functional task manager app with index.html, style.css, and app.js'],
                  ['⏱️', 'Pomodoro', 'Generate a modern pomodoro timer with a clean UI in index.html'],
                  ['🧮', 'Calculator', 'Build a sleek interactive calculator in index.html with full CSS styling'],
                  ['📊', 'Dashboard', 'Create an analytics dashboard UI with charts and metrics in index.html'],
                ].map(([emoji, label, prompt]) => (
                  <button key={label} className="preset-btn" onClick={() => handleSendMessage(prompt)} disabled={isGenerating}>
                    <span>{emoji}</span><span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Describe the app or feature to build…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isGenerating}
                />
                <button className="btn btn-primary send-btn" onClick={() => handleSendMessage()} disabled={isGenerating || !chatInput.trim()}>
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* Right: File Editor */}
            <div className="glass-card editor-card">
              <div className="card-header">
                <h3 className="card-title">
                  <Folder size={17} style={{ color: 'var(--color-secondary)' }} />
                  Workspace
                </h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button className="icon-btn" onClick={handleRefreshWorkspace} title="Refresh workspace">
                    <RefreshCw size={13} />
                  </button>
                  <button className="icon-btn icon-btn-primary" onClick={() => setShowNewFileModal(true)} title="New file (Ctrl+N)">
                    <FilePlus size={13} />
                  </button>
                  {isEditorDirty && (
                    <button className="btn btn-cyan" style={{ padding: '5px 12px', fontSize: '12px', gap: '5px' }} onClick={handleSaveEditorContent} disabled={isSavingEditor} title="Save (Ctrl+S)">
                      {isSavingEditor ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                      <span>{isSavingEditor ? 'Saving…' : 'Save'}</span>
                    </button>
                  )}
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', gap: '5px' }} onClick={handleCopyCode} disabled={!activeFileContent}>
                    {copiedFile ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
                    <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* File tabs */}
              <div className="file-tabs">
                {workspaceFiles.map(file => (
                  <div key={file.path} className={`file-tab ${activeFile === file.path ? 'active' : ''}`}>
                    <button className="file-tab-name" onClick={() => setActiveFile(file.path)} title={file.path}>
                      <FileText size={11} />
                      <span>{file.path.split('/').pop()}</span>
                    </button>
                    <div className="file-tab-actions">
                      <button onClick={() => { setRenamingFile(file.path); setRenameValue(file.path); }} title="Rename" className="file-tab-btn">
                        <Pencil size={10} />
                      </button>
                      <button onClick={() => handleDeleteFile(file.path)} title="Delete" className="file-tab-btn danger">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {workspaceFiles.length === 0 && (
                  <div className="file-tabs-empty">
                    No files yet — ask AI to generate some or click <FilePlus size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </div>
                )}
              </div>

              {/* Editor */}
              <div className="editor-wrapper">
                <div className="editor-titlebar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="editor-filename">{activeFile || 'no file selected'}</span>
                    {isEditorDirty && <span className="editor-unsaved">● unsaved</span>}
                  </div>
                  <div className="editor-dots">
                    <span style={{ background: '#ef4444' }} />
                    <span style={{ background: '#f59e0b' }} />
                    <span style={{ background: '#10b981' }} />
                  </div>
                </div>
                <textarea
                  ref={editorRef}
                  className="code-editor"
                  value={activeFileContent}
                  onChange={e => {
                    if (!activeFile) return;
                    setActiveFileContent(e.target.value);
                    setIsEditorDirty(true);
                  }}
                  placeholder={activeFile ? '' : '// Select or create a file to start editing\n// Use the AI assistant to generate code →'}
                  spellCheck={false}
                  disabled={!activeFile}
                />
                {activeFile && <div className="editor-statusbar">
                  <span>{activeFileContent.split('\n').length} lines</span>
                  <span>{activeFileContent.length} chars</span>
                  <span>Ctrl+S to save</span>
                </div>}
              </div>
            </div>

          </div>
        </section>

        {/* ── Tab: Component Catalog ── */}
        <section className={`tab-panel ${activeTab === 'catalog' ? 'active' : ''}`}>
          <div className="grid-3">
            {componentsCatalog.map((comp, idx) => (
              <div key={idx} className="glass-card interactive">
                <div className="card-header">
                  <h3 className="card-title" style={{ fontSize: '15px' }}>{comp.name}</h3>
                  <button className="btn btn-secondary" style={{ padding: '5px 10px' }} onClick={() => handleCopyComponent(comp.code, idx)} title="Copy CSS code">
                    {copiedIndex === idx ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                  </button>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>{comp.desc}</p>
                <div className="catalog-demo">{comp.preview}</div>
                <div className="catalog-code">
                  <pre><code>{comp.code}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tab: Diagnostics ── */}
        <section className={`tab-panel ${activeTab === 'diagnostics' ? 'active' : ''}`}>
          <div className="grid-2">
            <div className="glass-card">
              <div className="card-header">
                <h3 className="card-title">System Status & Environment</h3>
                <span className="badge-pill free">
                  <div className="status-indicator" style={{ width: '6px', height: '6px' }} />
                  All Systems Operational
                </span>
              </div>
              <div className="diag-list">
                {systemDiagnostics.map((item, i) => (
                  <div key={i} className="diag-item">
                    <span className="diag-label">{item.icon}{item.label}</span>
                    <span className="diag-value" title={item.value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">Performance Overview</h3>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="diag-logo-ring">
                  <SynthegnoticaLogo size={56} />
                </div>
                <h2 style={{ fontSize: '22px', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800, marginTop: '16px' }}>Synthegnotica</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>AI-powered · Open Source · Zero Cost</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Local GPU/CPU Usage', val: '0%', pct: '0%', grad: 'var(--grad-primary)', note: 'Cloud offloaded' },
                  { label: 'Synthegnotica AI Readiness', val: '100%', pct: '100%', grad: 'var(--grad-cyan)', note: 'Ready' },
                  { label: 'Workspace Files Loaded', val: `${workspaceFiles.length}`, pct: '100%', grad: 'var(--grad-emerald)', note: '' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      <span>{bar.label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{bar.val} {bar.note && <span style={{ color: 'var(--color-text-muted)' }}>· {bar.note}</span>}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: bar.pct, background: bar.grad }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── New File Modal ── */}
      {showNewFileModal && (
        <div className="modal-overlay" onClick={() => setShowNewFileModal(false)}>
          <div className="modal-content" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><FilePlus size={16} style={{ color: 'var(--color-primary)' }} />New File</h3>
              <button className="modal-close" onClick={() => setShowNewFileModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateNewFile}>
              <div className="modal-body">
                <label className="modal-label">File path (relative to workspace)</label>
                <input type="text" className="chat-input" style={{ padding: '10px 14px', fontSize: '13px' }}
                  value={newFileName} onChange={e => setNewFileName(e.target.value)}
                  placeholder="e.g. index.html or src/app.js" autoFocus />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewFileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newFileName.trim()}>
                  <FilePlus size={13} /><span>Create File</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rename Modal ── */}
      {renamingFile && (
        <div className="modal-overlay" onClick={() => setRenamingFile(null)}>
          <div className="modal-content" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Pencil size={15} style={{ color: 'var(--color-primary)' }} />Rename File</h3>
              <button className="modal-close" onClick={() => setRenamingFile(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRenameFile}>
              <div className="modal-body">
                <label className="modal-label">Renaming: <code className="modal-code">{renamingFile}</code></label>
                <input type="text" className="chat-input" style={{ padding: '10px 14px', fontSize: '13px' }}
                  value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  placeholder="New file path…" autoFocus />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRenamingFile(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!renameValue.trim()}>
                  <Check size={13} /><span>Rename</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Folder Browser Modal ── */}
      {showBrowserModal && (
        <div className="modal-overlay" onClick={() => setShowBrowserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Folder size={16} style={{ color: 'var(--color-primary)' }} />Browse Workspace Directory</h3>
              <button className="modal-close" onClick={() => setShowBrowserModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="breadcrumb-trail">
                <span style={{ color: 'var(--color-text-muted)' }}>Path: </span>
                {modalCurrentPath.split('/').map((part, index, arr) => {
                  const subPath = arr.slice(0, index + 1).join('/');
                  return (
                    <span key={index} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span className="breadcrumb-item" onClick={() => navigateModalFolder(subPath)}>{part || 'Root'}</span>
                      {index < arr.length - 1 && <span style={{ padding: '0 3px', color: 'var(--color-text-muted)' }}>/</span>}
                    </span>
                  );
                })}
              </div>
              <div className="folder-browse-list">
                {isLoadingModal ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} /><span>Loading…</span>
                  </div>
                ) : (
                  <>
                    {modalCurrentPath !== modalParentPath && (
                      <div className="folder-browse-item parent-dir" onClick={() => navigateModalFolder(modalParentPath)}>
                        <ArrowUp size={13} /><span>.. Parent Folder</span>
                      </div>
                    )}
                    {modalSubfolders.map(name => (
                      <div key={name} className="folder-browse-item" onClick={() => navigateModalFolder(`${modalCurrentPath}/${name}`)}>
                        <FolderOpen size={13} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} /><span>{name}</span>
                      </div>
                    ))}
                    {modalSubfolders.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>No subfolders here.</div>
                    )}
                  </>
                )}
              </div>
              <form onSubmit={handleCreateFolder} className="new-folder-form">
                <input type="text" className="chat-input" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px' }}
                  value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name…" disabled={isLoadingModal} />
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', gap: '4px' }} type="submit" disabled={isLoadingModal || !newFolderName.trim()}>
                  <Plus size={13} /><span>Create</span>
                </button>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBrowserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSelectModalFolder} disabled={isLoadingModal || isChangingWorkspace}>
                <Check size={13} /><span>Select This Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
