"use client";

import React, { useState } from 'react';
import { Terminal, Code2, Copy, Check, ExternalLink, ShieldCheck, Activity, Key, Webhook, Zap, Cpu } from 'lucide-react';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';
import { ApiKeyManager } from '@/components/developer/ApiKeyManager';
import { UsageChart } from '@/components/developer/UsageChart';
import { WebhookManager } from '@/components/developer/WebhookManager';

const CODE_EXAMPLES = {
  curl: `curl -X POST "https://api.echosync.ai/v1/synthesize" \\
  -H "Authorization: Bearer echo_live_***8x9" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello world from EchoSync AI neural engine.",
    "voice_id": "sarah-broadcast-256",
    "speed": 1.0,
    "stream": true
  }' --output output.wav`,

  python: `from echosync import EchoSync

client = EchoSync(api_key="echo_live_***8x9")

# Real-time streaming audio generation
stream = client.synthesis.create_stream(
    text="Zero-shot voice cloning at 60 FPS streaming speed.",
    voice_id="sarah-broadcast-256",
    speed=1.0,
    pitch=0.0
)

with open("output.wav", "wb") as f:
    for chunk in stream:
        f.write(chunk)`,

  typescript: `import { EchoSyncClient } from '@echosync/sdk';

const client = new EchoSyncClient({
  apiKey: process.env.ECHOSYNC_API_KEY!,
});

const audioStream = await client.synthesize({
  text: 'High fidelity neural speech generation.',
  voiceId: 'sarah-broadcast-256',
  responseFormat: 'pcm_22050',
});

audioStream.pipe(process.stdout);`,
};

export default function DeveloperPortalPage() {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'typescript'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'keys' | 'usage' | 'webhooks' | 'docs'>('keys');

  const copySnippet = async () => {
    await navigator.clipboard.writeText(CODE_EXAMPLES[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      <NavigationHeader activeTab="developer" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Code2 size={20} />
              </span>
              <h1 className="text-3xl font-light text-slate-100 tracking-tight">
                Developer API Portal
              </h1>
            </div>
            <p className="text-slate-400 mt-1 text-sm">
              Headless zero-shot synthesis orchestration, token telemetry, and webhook pipelines
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ShantanuDas15/EchoSync-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
            >
              <ExternalLink size={14} /> REST API Docs
            </a>
          </div>
        </div>

        {/* System Overview Stat Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">API Uptime</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">99.98%</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Avg TTFB</div>
              <div className="text-xl font-bold text-white font-mono">
                142 <span className="text-xs text-slate-400">ms</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Mean RTF Factor</div>
              <div className="text-xl font-bold text-violet-300 font-mono">0.24x</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Workers</div>
              <div className="text-xl font-bold text-cyan-300 font-mono">32 CUDA</div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          {[
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'usage', label: 'Telemetry & Graphs', icon: Activity },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'docs', label: 'Quickstart SDK', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveNavTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="space-y-6">
          {activeNavTab === 'keys' && <ApiKeyManager />}

          {activeNavTab === 'usage' && <UsageChart />}

          {activeNavTab === 'webhooks' && <WebhookManager />}

          {activeNavTab === 'docs' && (
            <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="text-indigo-400" size={18} />
                  <h2 className="text-base font-semibold text-white">SDK & API Quickstart</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
                    {(['curl', 'python', 'typescript'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveCodeTab(lang)}
                        className={`px-3 py-1 text-xs font-mono font-medium rounded-lg uppercase transition-all ${
                          activeCodeTab === lang
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={copySnippet}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-indigo-300 leading-relaxed">
                  {CODE_EXAMPLES[activeCodeTab]}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-400">
                <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <span className="font-semibold text-slate-200 block mb-1">Base Endpoint</span>
                  <code className="text-indigo-400 font-mono text-[11px]">https://api.echosync.ai/v1</code>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <span className="font-semibold text-slate-200 block mb-1">WebSocket Gateway</span>
                  <code className="text-indigo-400 font-mono text-[11px]">wss://stream.echosync.ai/ws</code>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                  <span className="font-semibold text-slate-200 block mb-1">Rate Limit</span>
                  <code className="text-indigo-400 font-mono text-[11px]">10,000 req / min (Enterprise)</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutFooter />
    </main>
  );
}
