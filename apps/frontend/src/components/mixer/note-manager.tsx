'use client';

import { useState, useEffect } from 'react';
import { TxLink } from '@/components/ui';
import type { DepositNote } from '@cronos-x402/shared-types';

const STORAGE_KEY = 'cronos-mixer-notes';

interface StoredNote extends DepositNote {
  savedAt: string;
  label?: string;
  spent?: boolean;
}

function loadNotes(): StoredNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: StoredNote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

interface NoteManagerProps {
  onSelectNote?: (note: DepositNote) => void;
}

export function NoteManager({ onSelectNote }: NoteManagerProps) {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteJson, setNewNoteJson] = useState('');
  const [newNoteLabel, setNewNoteLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const addNote = () => {
    try {
      const parsed = JSON.parse(newNoteJson);
      if (!parsed.nullifier || !parsed.secret || !parsed.commitment || !parsed.nullifierHash) {
        throw new Error('Invalid note format');
      }

      const newNote: StoredNote = {
        ...parsed,
        savedAt: new Date().toISOString(),
        label: newNoteLabel || `Note ${notes.length + 1}`,
        spent: false,
      };

      // Check for duplicates
      const exists = notes.some((n) => n.commitment === newNote.commitment);
      if (exists) {
        setError('This note is already saved');
        return;
      }

      const updated = [...notes, newNote];
      setNotes(updated);
      saveNotes(updated);
      setNewNoteJson('');
      setNewNoteLabel('');
      setShowAddNote(false);
      setError(null);
    } catch {
      setError('Invalid note format. Please paste valid JSON.');
    }
  };

  const removeNote = (commitment: string) => {
    if (!confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      return;
    }
    const updated = notes.filter((n) => n.commitment !== commitment);
    setNotes(updated);
    saveNotes(updated);
  };

  const markAsSpent = (commitment: string) => {
    const updated = notes.map((n) =>
      n.commitment === commitment ? { ...n, spent: true } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const exportNotes = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mixer-notes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as StoredNote[];
        const newNotes = imported.filter(
          (imp) => !notes.some((n) => n.commitment === imp.commitment)
        );
        const updated = [...notes, ...newNotes];
        setNotes(updated);
        saveNotes(updated);
        alert(`Imported ${newNotes.length} new note(s)`);
      } catch {
        alert('Failed to import notes. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const activeNotes = notes.filter((n) => !n.spent);
  const spentNotes = notes.filter((n) => n.spent);

  return (
    <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Saved Notes</h3>
            <p className="text-slate-500 text-sm">Manage your deposit notes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddNote(true)}
            className="px-3 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Note
          </button>
          <button
            onClick={exportNotes}
            disabled={notes.length === 0}
            className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-sm font-medium rounded-lg border border-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export
          </button>
          <label className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-sm font-medium rounded-lg border border-white/[0.08] transition-colors cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={importNotes}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="mb-6 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
          <input
            type="text"
            value={newNoteLabel}
            onChange={(e) => setNewNoteLabel(e.target.value)}
            placeholder="Note label (optional)"
            className="w-full px-4 py-2.5 bg-surface-900 border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          <textarea
            value={newNoteJson}
            onChange={(e) => setNewNoteJson(e.target.value)}
            placeholder="Paste note JSON..."
            rows={4}
            className="w-full px-4 py-3 bg-surface-900 border border-white/[0.08] rounded-lg text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          {error && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={addNote}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Note
            </button>
            <button
              onClick={() => {
                setShowAddNote(false);
                setError(null);
              }}
              className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-sm font-medium rounded-lg border border-white/[0.08] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Notes */}
      {activeNotes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Active ({activeNotes.length})
          </h4>
          <div className="space-y-3">
            {activeNotes.map((note) => (
              <div
                key={note.commitment}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">{note.label}</span>
                  <span className="text-xs text-slate-500 bg-white/[0.05] px-2 py-1 rounded">
                    {new Date(note.savedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-mono mb-3 truncate bg-surface-900/50 px-3 py-2 rounded-lg">
                  {note.commitment.slice(0, 24)}...{note.commitment.slice(-8)}
                </div>

                {note.depositTxHash && (
                  <div className="text-xs mb-3">
                    <TxLink hash={note.depositTxHash} label="View deposit tx" />
                  </div>
                )}

                {note.leafIndex !== undefined && (
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Leaf Index: {note.leafIndex}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
                  {onSelectNote && (
                    <button
                      onClick={() => onSelectNote(note)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/30 transition-colors"
                    >
                      Use for Withdraw
                    </button>
                  )}
                  <button
                    onClick={() => markAsSpent(note.commitment)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/30 transition-colors"
                  >
                    Mark Spent
                  </button>
                  <button
                    onClick={() => removeNote(note.commitment)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg border border-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spent Notes */}
      {spentNotes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Spent ({spentNotes.length})
          </h4>
          <div className="space-y-2">
            {spentNotes.map((note) => (
              <div
                key={note.commitment}
                className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] opacity-60"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 font-medium line-through">{note.label}</span>
                  <span className="text-xs text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded">Spent</span>
                </div>
                <div className="text-xs text-slate-600 font-mono truncate">
                  {note.commitment.slice(0, 24)}...
                </div>
                <button
                  onClick={() => removeNote(note.commitment)}
                  className="mt-3 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-500 text-xs rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && !showAddNote && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium mb-2">No saved notes yet</p>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Deposit notes are saved here automatically. You can also import notes from a backup.
          </p>
        </div>
      )}

      {/* Security Warning */}
      <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <div className="flex gap-3">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-amber-400/70 text-xs">
            Notes are stored in your browser. Always keep a backup copy offline. Clearing browser data will delete your notes!
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing notes in other components
 */
export function useNoteStorage() {
  const addNote = (note: DepositNote, label?: string) => {
    const notes = loadNotes();
    const exists = notes.some((n) => n.commitment === note.commitment);
    if (exists) return false;

    const newNote: StoredNote = {
      ...note,
      savedAt: new Date().toISOString(),
      label: label || `Note ${notes.length + 1}`,
      spent: false,
    };

    saveNotes([...notes, newNote]);
    return true;
  };

  const markSpent = (commitment: string) => {
    const notes = loadNotes();
    const updated = notes.map((n) =>
      n.commitment === commitment ? { ...n, spent: true } : n
    );
    saveNotes(updated);
  };

  return { addNote, markSpent };
}
