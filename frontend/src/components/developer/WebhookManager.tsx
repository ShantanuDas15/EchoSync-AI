"use client";

import React, { useState } from 'react';
import { Webhook, Check, Copy, RefreshCw, Send, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import {
  WebhookConfig,
  validateWebhookUrl,
  generateWebhookSecret,
  maskWebhookSecret,
} from '@/lib/developerUtils';

interface WebhookManagerProps {
  initialConfig?: WebhookConfig;
}

const DEFAULT_WEBHOOK: WebhookConfig = {
  id: 'wh-1',
  url: 'https://api.example.com/webhooks/echosync-events',
  events: ['synthesis.completed', 'voice.cloned'],
  secret: 'whsec_9fa8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
  isActive: true,
  createdAt: '2026-08-05',
  lastDeliveryStatus: 'Success',
};

const AVAILABLE_EVENTS = [
  { id: 'synthesis.completed', label: 'synthesis.completed', desc: 'Fires when audio rendering pipeline completes.' },
  { id: 'synthesis.failed', label: 'synthesis.failed', desc: 'Fires if CUDA OOM or phonemizer throws an error.' },
  { id: 'voice.cloned', label: 'voice.cloned', desc: 'Fires when a 256-d speaker embedding finishes training.' },
  { id: 'model.updated', label: 'model.updated', desc: 'Fires when zero-shot neural model checkpoints reload.' },
];

export function WebhookManager({ initialConfig = DEFAULT_WEBHOOK }: WebhookManagerProps) {
  const [config, setConfig] = useState<WebhookConfig>(initialConfig);
  const [urlInput, setUrlInput] = useState(config.url);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(config.events);
  const [secret, setSecret] = useState(config.secret);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [unmaskedSecret, setUnmaskedSecret] = useState(false);
  const [testPingStatus, setTestPingStatus] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    const valResult = validateWebhookUrl(value);
    if (!valResult.isValid) {
      setUrlError(valResult.error || 'Invalid URL');
    } else {
      setUrlError(null);
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleRegenerateSecret = () => {
    if (confirm('Regenerate webhook signing secret? You will need to update your HMAC validation code.')) {
      const newSecret = generateWebhookSecret();
      setSecret(newSecret);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const valResult = validateWebhookUrl(urlInput);
    if (!valResult.isValid) {
      setUrlError(valResult.error || 'Invalid URL');
      return;
    }

    setConfig({
      ...config,
      url: urlInput.trim(),
      events: selectedEvents,
      secret,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendTestPing = () => {
    setTestPingStatus('Sending HTTP POST with signed HMAC-SHA256 signature...');
    setTimeout(() => {
      setTestPingStatus('200 OK — Test webhook payload delivered in 118ms');
      setTimeout(() => setTestPingStatus(null), 4000);
    }, 1000);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-slate-100 mb-1">
            <Webhook className="text-indigo-400" size={18} />
            <h2 className="text-base font-semibold">Webhooks & Event Subscriptions</h2>
          </div>
          <p className="text-xs text-slate-400">
            Receive automated real-time JSON HTTP POST events when audio syntheses complete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestPing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <Send size={13} className="text-indigo-400" />
            Send Test Ping
          </button>
        </div>
      </div>

      {testPingStatus && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Zap size={14} className="text-indigo-400 animate-pulse" />
          <span>{testPingStatus}</span>
        </div>
      )}

      {/* Form Configuration */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Endpoint URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Webhook Endpoint URL (HTTPS)
          </label>
          <div className="relative">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/echosync"
              className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none transition-colors ${
                urlError ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>
          {urlError ? (
            <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-mono">
              <AlertCircle size={12} /> {urlError}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Must be a valid HTTPS URL reachable by EchoSync delivery workers.
            </p>
          )}
        </div>

        {/* Signing Secret */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Webhook Signing Secret (HMAC-SHA256)
            </label>
            <button
              type="button"
              onClick={handleRegenerateSecret}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RefreshCw size={11} /> Regenerate Secret
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
            <code className="font-mono text-xs text-slate-300 flex-1 px-2 select-all">
              {unmaskedSecret ? secret : maskWebhookSecret(secret)}
            </code>
            <button
              type="button"
              onClick={() => setUnmaskedSecret(!unmaskedSecret)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              {unmaskedSecret ? 'Mask' : 'Reveal'}
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(secret);
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {copiedSecret ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedSecret ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Event Subscriptions */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Subscribed Events
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_EVENTS.map((event) => {
              const isChecked = selectedEvents.includes(event.id);

              return (
                <div
                  key={event.id}
                  onClick={() => handleToggleEvent(event.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-100">{event.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{event.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in font-medium">
              <CheckCircle2 size={14} /> Webhook configuration saved!
            </span>
          )}
          <button
            type="submit"
            disabled={Boolean(urlError) || selectedEvents.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
