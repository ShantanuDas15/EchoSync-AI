"use client";

import React, { useState } from 'react';
import { Key, Plus, Copy, Check, Eye, EyeOff, Trash2, Shield, AlertTriangle, X, Terminal, CheckCircle2 } from 'lucide-react';
import { ApiKey, maskApiKey, generateApiKey } from '@/lib/developerUtils';

interface ApiKeyManagerProps {
  initialKeys?: ApiKey[];
}

const DEFAULT_KEYS: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production Speech Service',
    key: 'echo_live_9x8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o',
    createdAt: '2026-08-01',
    lastUsed: '2026-08-15 11:30 AM',
    environment: 'live',
    permissions: ['synthesize', 'read:voices', 'write:voices'],
  },
  {
    id: 'key-2',
    name: 'Local Dev & CI Pipeline',
    key: 'echo_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
    createdAt: '2026-08-10',
    lastUsed: '2026-08-14 04:12 PM',
    environment: 'test',
    permissions: ['synthesize', 'read:voices'],
  },
];

export function ApiKeyManager({ initialKeys = DEFAULT_KEYS }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [unmaskedKeyIds, setUnmaskedKeyIds] = useState<string[]>([]);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Key Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'live' | 'test'>('live');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'synthesize',
    'read:voices',
  ]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [copiedNewSecret, setCopiedNewSecret] = useState(false);

  // Revoke modal state
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const toggleUnmask = (keyId: string) => {
    setUnmaskedKeyIds((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const rawSecret = generateApiKey(newKeyEnv);
    const newApiKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: rawSecret,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      environment: newKeyEnv,
      permissions: selectedPermissions,
    };

    setKeys((prev) => [newApiKey, ...prev]);
    setNewlyCreatedKey(newApiKey);
    setNewKeyName('');
  };

  const handleRevokeKey = (keyId: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    setKeyToRevoke(null);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Create Button */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-100 mb-1">
            <Key className="text-indigo-400" size={18} />
            <h2 className="text-base font-semibold">API Keys & Authentication</h2>
          </div>
          <p className="text-xs text-slate-400">
            Authenticate headless REST & WebSocket requests with server-side bearer tokens.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] shrink-0"
        >
          <Plus size={16} /> Create API Key
        </button>
      </div>

      {/* Keys Table / List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Name & Environment</th>
                <th className="py-3.5 px-4 font-semibold">API Key Token</th>
                <th className="py-3.5 px-4 font-semibold">Permissions</th>
                <th className="py-3.5 px-4 font-semibold">Created / Last Used</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {keys.map((apiKey) => {
                const isUnmasked = unmaskedKeyIds.includes(apiKey.id);
                const displayKey = isUnmasked ? apiKey.key : maskApiKey(apiKey.key);
                const isCopied = copiedKeyId === apiKey.id;

                return (
                  <tr key={apiKey.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Name & Env */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-200">{apiKey.name}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            apiKey.environment === 'live'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {apiKey.environment}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {apiKey.id}</span>
                      </div>
                    </td>

                    {/* Key token & copy */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl max-w-fit">
                        <code className="font-mono text-slate-300 text-xs tracking-wide">
                          {displayKey}
                        </code>
                        <button
                          onClick={() => toggleUnmask(apiKey.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                          title={isUnmasked ? 'Mask Key' : 'Reveal Key'}
                        >
                          {isUnmasked ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
                          title="Copy Full Token"
                        >
                          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    {/* Permissions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {apiKey.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Timestamps */}
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      <div>Created: {apiKey.createdAt}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">Used: {apiKey.lastUsed}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setKeyToRevoke(apiKey)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Revoke API Key"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={20} />
                  <h3 className="text-base font-semibold text-white">API Key Created Successfully</h3>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Save this secret key now. For your security, you will not be able to view the full unmasked key again.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Secret Key</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <code className="font-mono text-xs text-indigo-300 flex-1 break-all select-all">
                      {newlyCreatedKey.key}
                    </code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(newlyCreatedKey.key);
                        setCopiedNewSecret(true);
                        setTimeout(() => setCopiedNewSecret(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0"
                    >
                      {copiedNewSecret ? <Check size={14} /> : <Copy size={14} />}
                      {copiedNewSecret ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Key className="text-indigo-400" size={18} />
                    Generate New API Key
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Assign a human-readable identifier and scope appropriate permissions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Key Description / Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backend Production Server"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">Environment</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('live')}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        newKeyEnv === 'live'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">Live Production</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Real-time compute & quotas</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('test')}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        newKeyEnv === 'test'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">Sandbox / Test</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Isolated staging sandbox</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Permissions & Scopes
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    {[
                      { id: 'synthesize', label: 'Audio Synthesis (TTS)' },
                      { id: 'read:voices', label: 'Read Voice Profiles' },
                      { id: 'write:voices', label: 'Clone / Write Voices' },
                      { id: 'admin', label: 'Full Admin Access' },
                    ].map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newKeyName.trim() || selectedPermissions.length === 0}
                    className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle size={22} />
              <h3 className="text-base font-semibold text-white">Revoke API Key?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to permanently revoke <strong className="text-white">"{keyToRevoke.name}"</strong>? Any application or microservice utilizing this token will immediately fail with a 401 Unauthorized status.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setKeyToRevoke(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeKey(keyToRevoke.id)}
                className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-lg shadow-rose-600/20"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
