import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSettingsContext } from '@/context/SettingsContext';
import { fetchVoicePersonas } from '@/utils/apiClient';
import { ModuleCatalogEntry, ModuleModelOverride, ProviderCatalogEntry, ThemePreference, VoicePersona } from '@/types';

type TabId = 'providers' | 'credentials' | 'research' | 'autonomy' | 'appearance';

const TABS: { id: TabId; label: string }[] = [
  { id: 'providers', label: 'Providers' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'research', label: 'Research Tools' },
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'appearance', label: 'Appearance' },
];

const VOICE_PROFILE_STORAGE_KEY = 'co-counsel.voice.profile';

function capabilityModels(
  provider: ProviderCatalogEntry | undefined,
  capability: 'chat' | 'embeddings' | 'vision'
) {
  if (!provider) return [];
  return provider.models.filter((model) => model.capabilities.includes(capability));
}

export function SettingsPanel(): JSX.Element {
  const {
    settings,
    catalog,
    updateSettings,
    refreshModelCatalog,
    themePreference,
    setThemePreference,
    loading,
    saving,
    error,
  } = useSettingsContext();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('providers');
  const [primaryProvider, setPrimaryProvider] = useState('');
  const [secondaryProvider, setSecondaryProvider] = useState('');
  const [chatModel, setChatModel] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [visionModel, setVisionModel] = useState('');
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [keysToClear, setKeysToClear] = useState<Record<string, boolean>>({});
  const [apiBaseUrls, setApiBaseUrls] = useState<Record<string, string>>({});
  const [localRuntimePaths, setLocalRuntimePaths] = useState<Record<string, string>>({});
  const [refreshingProvider, setRefreshingProvider] = useState<string | null>(null);
  const [moduleOverrides, setModuleOverrides] = useState<Record<string, ModuleModelOverride>>({});
  const [showModuleAdvanced, setShowModuleAdvanced] = useState(false);
  const [courtListenerToken, setCourtListenerToken] = useState('');
  const [clearCourtListener, setClearCourtListener] = useState(false);
  const [pacerToken, setPacerToken] = useState('');
  const [clearPacerToken, setClearPacerToken] = useState(false);
  const [unicourtToken, setUnicourtToken] = useState('');
  const [clearUnicourtToken, setClearUnicourtToken] = useState(false);
  const [lacsToken, setLacsToken] = useState('');
  const [clearLacsToken, setClearLacsToken] = useState(false);
  const [caselawToken, setCaselawToken] = useState('');
  const [clearCaselawToken, setClearCaselawToken] = useState(false);
  const [researchToken, setResearchToken] = useState('');
  const [clearResearchToken, setClearResearchToken] = useState(false);
  const [policyEnabled, setPolicyEnabled] = useState(true);
  const [policyInitialTrust, setPolicyInitialTrust] = useState('0.6');
  const [policyTrustThreshold, setPolicyTrustThreshold] = useState('0.35');
  const [policyDecay, setPolicyDecay] = useState('0.15');
  const [policySuccessReward, setPolicySuccessReward] = useState('0.2');
  const [policyFailurePenalty, setPolicyFailurePenalty] = useState('0.45');
  const [policyExplorationProbability, setPolicyExplorationProbability] = useState('0.05');
  const [policySeed, setPolicySeed] = useState('');
  const [policyObservableRoles, setPolicyObservableRoles] = useState('strategy, ingestion, research, cocounsel, qa');
  const [policySuppressibleRoles, setPolicySuppressibleRoles] = useState('ingestion, cocounsel');
  const [graphRefinementEnabled, setGraphRefinementEnabled] = useState(true);
  const [graphRefinementInterval, setGraphRefinementInterval] = useState('900');
  const [graphRefinementIdleLimit, setGraphRefinementIdleLimit] = useState('3');
  const [graphRefinementMinEdges, setGraphRefinementMinEdges] = useState('0');
  const [voiceProfiles, setVoiceProfiles] = useState<VoicePersona[]>([]);
  const [preferredVoice, setPreferredVoice] = useState('aurora');

  const providerCatalog = catalog.length > 0 ? catalog : settings?.providers.available ?? [];
  const parseRoles = (value: string) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

  useEffect(() => {
    if (!settings) return;
    setPrimaryProvider(settings.providers.primary ?? '');
    setSecondaryProvider(settings.providers.secondary ?? '');
    const defaults = settings.providers.defaults ?? {};
    setChatModel(defaults['chat'] ?? '');
    setEmbeddingModel(defaults['embeddings'] ?? '');
    setVisionModel(defaults['vision'] ?? '');
    setModuleOverrides(settings.providers.module_overrides ?? {});
    setProviderKeys({});
    setKeysToClear({});
    setApiBaseUrls(settings.providers.api_base_urls ?? {});
    setLocalRuntimePaths(settings.providers.local_runtime_paths ?? {});
    setCourtListenerToken('');
    setClearCourtListener(false);
    setPacerToken('');
    setClearPacerToken(false);
    setUnicourtToken('');
    setClearUnicourtToken(false);
    setLacsToken('');
    setClearLacsToken(false);
    setCaselawToken('');
    setClearCaselawToken(false);
    setResearchToken('');
    setClearResearchToken(false);
    const policy = settings.agents_policy;
    setPolicyEnabled(policy.enabled);
    setPolicyInitialTrust(String(policy.initial_trust));
    setPolicyTrustThreshold(String(policy.trust_threshold));
    setPolicyDecay(String(policy.decay));
    setPolicySuccessReward(String(policy.success_reward));
    setPolicyFailurePenalty(String(policy.failure_penalty));
    setPolicyExplorationProbability(String(policy.exploration_probability));
    setPolicySeed(policy.seed === null || policy.seed === undefined ? '' : String(policy.seed));
    setPolicyObservableRoles(policy.observable_roles.join(', '));
    setPolicySuppressibleRoles(policy.suppressible_roles.join(', '));
    const graph = settings.graph_refinement;
    setGraphRefinementEnabled(graph.enabled);
    setGraphRefinementInterval(String(graph.interval_seconds));
    setGraphRefinementIdleLimit(String(graph.idle_limit));
    setGraphRefinementMinEdges(String(graph.min_new_edges));
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_PROFILE_STORAGE_KEY);
      if (stored) {
        setPreferredVoice(stored);
      }
    } catch (_error) {
      // localStorage may be unavailable in restricted browser modes.
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchVoicePersonas()
      .then((personas) => {
        if (!active) return;
        if (personas.length > 0) {
          setVoiceProfiles(personas);
        }
      })
      .catch(() => {
        if (!active) return;
        setVoiceProfiles([
          {
            persona_id: 'aurora',
            label: 'Aurora',
            description: 'Warm, empathetic cadence suitable for sensitive updates.',
          },
          {
            persona_id: 'lyra',
            label: 'Lyra',
            description: 'Crisp, energetic tone tuned for investigative stand-ups.',
          },
          {
            persona_id: 'atlas',
            label: 'Atlas',
            description: 'Calm, authoritative delivery for compliance briefings.',
          },
        ]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (voiceProfiles.length === 0) return;
    if (voiceProfiles.some((persona) => persona.persona_id === preferredVoice)) return;
    setPreferredVoice(voiceProfiles[0].persona_id);
  }, [voiceProfiles, preferredVoice]);

  const providerStatus = useMemo(() => {
    const map = new Map<string, boolean>();
    settings?.credentials.providers.forEach((entry) => {
      map.set(entry.provider_id, entry.has_api_key);
    });
    return map;
  }, [settings?.credentials.providers]);

  const serviceStatus = settings?.credentials.services ?? {};

  const selectedPrimary = providerCatalog.find((entry) => entry.id === primaryProvider);
  const selectedSecondary = providerCatalog.find((entry) => entry.id === secondaryProvider);
  const moduleCatalog: ModuleCatalogEntry[] = useMemo(() => {
    if (settings?.module_catalog && settings.module_catalog.length > 0) {
      return settings.module_catalog;
    }
    return [
      { module_id: 'ingestion', label: 'Ingestion', source: 'core' },
      { module_id: 'forensics', label: 'Forensics', source: 'core' },
      { module_id: 'graph', label: 'Graph', source: 'core' },
      { module_id: 'timeline', label: 'Timeline', source: 'core' },
      { module_id: 'research', label: 'Research', source: 'core' },
      { module_id: 'strategy', label: 'Strategy', source: 'core' },
      { module_id: 'drafting', label: 'Drafting', source: 'core' },
      { module_id: 'presentation', label: 'Presentation', source: 'core' },
      { module_id: 'voice', label: 'Voice', source: 'core' },
      { module_id: 'qa', label: 'QA', source: 'core' },
      { module_id: 'centcom', label: 'CENTCOM', source: 'core' },
    ];
  }, [settings?.module_catalog]);

  const ensureModelSelection = useCallback(
    (provider: ProviderCatalogEntry | undefined, capability: 'chat' | 'embeddings' | 'vision', current: string) => {
      if (!provider) return current;
      const models = capabilityModels(provider, capability);
      if (models.length === 0) {
        return '';
      }
      if (current && models.some((model) => model.id === current)) {
        return current;
      }
      return models[0].id;
    },
    []
  );

  useEffect(() => {
    setChatModel((current) => ensureModelSelection(selectedPrimary, 'chat', current));
  }, [ensureModelSelection, selectedPrimary]);

  useEffect(() => {
    setEmbeddingModel((current) => ensureModelSelection(selectedPrimary, 'embeddings', current));
  }, [ensureModelSelection, selectedPrimary]);

  useEffect(() => {
    setVisionModel((current) => ensureModelSelection(selectedPrimary, 'vision', current));
  }, [ensureModelSelection, selectedPrimary]);

  const handleProvidersSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!primaryProvider) {
      return;
    }
    const baseUrlOverrides: Record<string, string | null> = {};
    Object.entries(apiBaseUrls).forEach(([providerId, baseUrl]) => {
      const trimmed = baseUrl.trim();
      baseUrlOverrides[providerId] = trimmed.length > 0 ? trimmed : null;
    });
    await updateSettings({
      providers: {
        primary: primaryProvider,
        secondary: secondaryProvider ? secondaryProvider : null,
        defaults: {
          chat: chatModel || null,
          embeddings: embeddingModel || null,
          vision: visionModel || null,
        },
        api_base_urls: baseUrlOverrides,
        local_runtime_paths: localRuntimePaths,
        module_overrides: Object.fromEntries(
          Object.entries(moduleOverrides)
            .filter(([, override]) =>
              override.provider_id ||
              override.chat_model ||
              override.embedding_model ||
              override.vision_model
            )
            .map(([moduleId, override]) => [
              moduleId,
              {
                provider_id: override.provider_id || null,
                chat_model: override.chat_model || null,
                embedding_model: override.embedding_model || null,
                vision_model: override.vision_model || null,
              },
            ])
        ),
      },
    });
  };

  const updateModuleOverride = (moduleId: string, patch: Partial<ModuleModelOverride>) => {
    setModuleOverrides((current) => ({
      ...current,
      [moduleId]: {
        ...current[moduleId],
        ...patch,
      },
    }));
  };

  const handleRefreshModels = async (providerId: string) => {
    setRefreshingProvider(providerId);
    try {
      await refreshModelCatalog(providerId);
    } finally {
      setRefreshingProvider(null);
    }
  };

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const apiKeys: Record<string, string | null> = {};
    Object.entries(providerKeys).forEach(([id, value]) => {
      if (value && value.trim().length > 0) {
        apiKeys[id] = value.trim();
      }
    });
    Object.entries(keysToClear).forEach(([id, remove]) => {
      if (remove) {
        apiKeys[id] = null;
      }
    });
    if (Object.keys(apiKeys).length === 0) {
      return;
    }
    await updateSettings({
      credentials: {
        provider_api_keys: apiKeys,
      },
    });
    setProviderKeys({});
    setKeysToClear({});
  };

  const handleResearchSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const credentials: Record<string, string | null> = {};
    let hasUpdate = false;
    if (clearCourtListener || courtListenerToken.trim().length > 0) {
      credentials.courtlistener_token = clearCourtListener ? null : courtListenerToken.trim();
      hasUpdate = true;
    }
    if (clearPacerToken || pacerToken.trim().length > 0) {
      credentials.pacer_api_key = clearPacerToken ? null : pacerToken.trim();
      hasUpdate = true;
    }
    if (clearUnicourtToken || unicourtToken.trim().length > 0) {
      credentials.unicourt_api_key = clearUnicourtToken ? null : unicourtToken.trim();
      hasUpdate = true;
    }
    if (clearLacsToken || lacsToken.trim().length > 0) {
      credentials.lacs_api_key = clearLacsToken ? null : lacsToken.trim();
      hasUpdate = true;
    }
    if (clearCaselawToken || caselawToken.trim().length > 0) {
      credentials.caselaw_api_key = clearCaselawToken ? null : caselawToken.trim();
      hasUpdate = true;
    }
    if (clearResearchToken || researchToken.trim().length > 0) {
      credentials.research_browser_api_key = clearResearchToken ? null : researchToken.trim();
      hasUpdate = true;
    }
    if (!hasUpdate) {
      return;
    }
    await updateSettings({
      credentials: credentials,
    });
    setCourtListenerToken('');
    setPacerToken('');
    setUnicourtToken('');
    setLacsToken('');
    setCaselawToken('');
    setResearchToken('');
    setClearCourtListener(false);
    setClearPacerToken(false);
    setClearUnicourtToken(false);
    setClearLacsToken(false);
    setClearCaselawToken(false);
    setClearResearchToken(false);
  };

  const handleAutonomySubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const agentsPolicy = {
      enabled: policyEnabled,
      initial_trust: Number(policyInitialTrust),
      trust_threshold: Number(policyTrustThreshold),
      decay: Number(policyDecay),
      success_reward: Number(policySuccessReward),
      failure_penalty: Number(policyFailurePenalty),
      exploration_probability: Number(policyExplorationProbability),
      seed: policySeed.trim().length > 0 ? Number(policySeed) : null,
      observable_roles: parseRoles(policyObservableRoles),
      suppressible_roles: parseRoles(policySuppressibleRoles),
    };
    const graphRefinement = {
      enabled: graphRefinementEnabled,
      interval_seconds: Number(graphRefinementInterval),
      idle_limit: Number(graphRefinementIdleLimit),
      min_new_edges: Number(graphRefinementMinEdges),
    };
    await updateSettings({
      agents_policy: agentsPolicy,
      graph_refinement: graphRefinement,
    });
  };

  const handleThemeChange = (value: ThemePreference) => {
    void setThemePreference(value);
  };

  const handleVoiceProfileChange = (value: string) => {
    setPreferredVoice(value);
    try {
      localStorage.setItem(VOICE_PROFILE_STORAGE_KEY, value);
    } catch (_error) {
      // localStorage may be unavailable in restricted browser modes.
    }
  };

  const providerTab = (
    <form className="settings-form" onSubmit={handleProvidersSubmit}>
      <fieldset disabled={saving || loading}>
        <legend className="sr-only">Provider selection</legend>
        <label>
          Primary provider
          <select value={primaryProvider} onChange={(event) => setPrimaryProvider(event.target.value)}>
            {providerCatalog.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Secondary provider
          <select value={secondaryProvider} onChange={(event) => setSecondaryProvider(event.target.value)}>
            <option value="">None</option>
            {providerCatalog
              .filter((entry) => entry.id !== primaryProvider)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.display_name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Chat model
          <select value={chatModel} onChange={(event) => setChatModel(event.target.value)}>
            {capabilityModels(selectedPrimary, 'chat').map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Embedding model
          <select value={embeddingModel} onChange={(event) => setEmbeddingModel(event.target.value)}>
            {capabilityModels(selectedPrimary, 'embeddings').map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vision model
          <select value={visionModel} onChange={(event) => setVisionModel(event.target.value)}>
            {capabilityModels(selectedPrimary, 'vision').map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}
              </option>
            ))}
          </select>
        </label>
        <div className="settings-subsection module-overrides">
          <div className="settings-subsection-header">
            <div>
              <h3>Module overrides</h3>
              <p className="settings-hint">
                Override provider + model per swarm/station. Defaults fall back to global settings.
              </p>
            </div>
            <button
              type="button"
              className={`toggle-pill ${showModuleAdvanced ? 'active' : ''}`}
              onClick={() => setShowModuleAdvanced((current) => !current)}
            >
              {showModuleAdvanced ? 'Advanced On' : 'Advanced Off'}
            </button>
          </div>
          <div className="module-override-grid">
            {moduleCatalog.map((module) => {
              const override = moduleOverrides[module.module_id] ?? {};
              const overrideProviderId = override.provider_id ?? '';
              const activeProviderId = overrideProviderId || primaryProvider;
              const activeProvider = providerCatalog.find((entry) => entry.id === activeProviderId);
              const autoLabel = overrideProviderId ? 'Auto (provider default)' : 'Auto (global default)';
              const chatOptions = capabilityModels(activeProvider, 'chat');
              const embeddingOptions = capabilityModels(activeProvider, 'embeddings');
              const visionOptions = capabilityModels(activeProvider, 'vision');

              const handleProviderChange = (value: string) => {
                if (!value) {
                  updateModuleOverride(module.module_id, {
                    provider_id: '',
                    chat_model: '',
                    embedding_model: '',
                    vision_model: '',
                  });
                  return;
                }
                const selected = providerCatalog.find((entry) => entry.id === value);
                updateModuleOverride(module.module_id, {
                  provider_id: value,
                  chat_model: selected ? capabilityModels(selected, 'chat')[0]?.id ?? '' : '',
                  embedding_model: selected ? capabilityModels(selected, 'embeddings')[0]?.id ?? '' : '',
                  vision_model: selected ? capabilityModels(selected, 'vision')[0]?.id ?? '' : '',
                });
              };

              return (
                <div key={module.module_id} className="module-override-card">
                  <div className="module-override-header">
                    <div>
                      <div className="module-override-title">{module.label}</div>
                      <div className="module-override-meta">{module.module_id}</div>
                    </div>
                    <span className={`module-override-badge ${module.source === 'core' ? 'core' : 'team'}`}>
                      {module.source === 'core' ? 'Core' : 'Team'}
                    </span>
                  </div>
                  <div className="module-override-fields">
                    <label>
                      Provider
                      <select
                        value={overrideProviderId}
                        onChange={(event) => handleProviderChange(event.target.value)}
                      >
                        <option value="">Use global default</option>
                        {providerCatalog.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.display_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Chat model
                      <select
                        value={override.chat_model ?? ''}
                        onChange={(event) =>
                          updateModuleOverride(module.module_id, { chat_model: event.target.value })
                        }
                      >
                        <option value="">{autoLabel}</option>
                        {chatOptions.length === 0 ? (
                          <option value="" disabled>
                            No chat models
                          </option>
                        ) : (
                          chatOptions.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.display_name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    {showModuleAdvanced && (
                      <>
                        <label>
                          Embeddings
                          <select
                            value={override.embedding_model ?? ''}
                            onChange={(event) =>
                              updateModuleOverride(module.module_id, { embedding_model: event.target.value })
                            }
                          >
                            <option value="">{autoLabel}</option>
                            {embeddingOptions.length === 0 ? (
                              <option value="" disabled>
                                No embedding models
                              </option>
                            ) : (
                              embeddingOptions.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.display_name}
                                </option>
                              ))
                            )}
                          </select>
                        </label>
                        <label>
                          Vision
                          <select
                            value={override.vision_model ?? ''}
                            onChange={(event) =>
                              updateModuleOverride(module.module_id, { vision_model: event.target.value })
                            }
                          >
                            <option value="">{autoLabel}</option>
                            {visionOptions.length === 0 ? (
                              <option value="" disabled>
                                No vision models
                              </option>
                            ) : (
                              visionOptions.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.display_name}
                                </option>
                              ))
                            )}
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="settings-subsection">
          <h3>Provider endpoints</h3>
          <p className="settings-hint">
            Configure API base URLs for cloud and local runtimes (OpenRouter, LocalAI, LM Studio, Ollama).
          </p>
          {providerCatalog.map((entry) => (
            <div key={entry.id} className="provider-endpoint">
              <label>
                {entry.display_name} base URL
                <input
                  type="url"
                  placeholder="https://"
                  value={apiBaseUrls[entry.id] ?? ''}
                  onChange={(event) =>
                    setApiBaseUrls((current) => ({ ...current, [entry.id]: event.target.value }))
                  }
                />
              </label>
              <button
                type="button"
                className="link-button"
                onClick={() => handleRefreshModels(entry.id)}
                disabled={refreshingProvider === entry.id || saving || loading}
              >
                {refreshingProvider === entry.id ? 'Refreshing models...' : 'Refresh models'}
              </button>
            </div>
          ))}
        </div>
        <div className="settings-subsection">
          <h3>Local runtime paths</h3>
          <p className="settings-hint">Optional overrides for local runners (llama.cpp, GGUF, Ollama).</p>
          {['ollama', 'llama.cpp', 'gguf-local', 'localai', 'lmstudio'].map((providerId) => {
            const entry = providerCatalog.find((item) => item.id === providerId);
            const label = entry?.display_name ?? providerId;
            return (
              <label key={providerId}>
                {label} path
                <input
                  type="text"
                  value={localRuntimePaths[providerId] ?? ''}
                  placeholder="runtime/path"
                  onChange={(event) =>
                    setLocalRuntimePaths((current) => ({
                      ...current,
                      [providerId]: event.target.value,
                    }))
                  }
                />
              </label>
            );
          })}
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            Save provider preferences
          </button>
        </div>
      </fieldset>
    </form>
  );

  const credentialsTab = (
    <form className="settings-form" onSubmit={handleCredentialsSubmit}>
      <fieldset disabled={saving || loading}>
        <legend className="sr-only">Provider credentials</legend>
        {providerCatalog.map((entry) => (
          <div key={entry.id} className="credentials-field">
            <label>
              {entry.display_name} API key
              <input
                type="password"
                placeholder={providerStatus.get(entry.id) ? 'Stored' : 'Enter API key'}
                value={providerKeys[entry.id] ?? ''}
                onChange={(event) =>
                  setProviderKeys((current) => ({ ...current, [entry.id]: event.target.value }))
                }
              />
            </label>
            {providerStatus.get(entry.id) && (
              <button
                type="button"
                className="link-button"
                onClick={() =>
                  setKeysToClear((current) => ({ ...current, [entry.id]: !current[entry.id] }))
                }
              >
                {keysToClear[entry.id] ? 'Restore' : 'Remove stored key'}
              </button>
            )}
          </div>
        ))}
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            Save credentials
          </button>
        </div>
      </fieldset>
    </form>
  );

  const researchTab = (
    <form className="settings-form" onSubmit={handleResearchSubmit}>
      <fieldset disabled={saving || loading}>
        <legend className="sr-only">Research integrations</legend>
        <label>
          CourtListener token
          <input
            type="password"
            placeholder={serviceStatus.courtlistener ? 'Stored' : 'Enter token'}
            value={courtListenerToken}
            onChange={(event) => setCourtListenerToken(event.target.value)}
          />
        </label>
        {serviceStatus.courtlistener && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearCourtListener((current) => !current)}
          >
            {clearCourtListener ? 'Keep stored token' : 'Remove stored token'}
          </button>
        )}
        <label>
          PACER API key
          <input
            type="password"
            placeholder={serviceStatus.pacer ? 'Stored' : 'Enter API key'}
            value={pacerToken}
            onChange={(event) => setPacerToken(event.target.value)}
          />
        </label>
        {serviceStatus.pacer && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearPacerToken((current) => !current)}
          >
            {clearPacerToken ? 'Keep stored key' : 'Remove stored key'}
          </button>
        )}
        <label>
          UniCourt API key
          <input
            type="password"
            placeholder={serviceStatus.unicourt ? 'Stored' : 'Enter API key'}
            value={unicourtToken}
            onChange={(event) => setUnicourtToken(event.target.value)}
          />
        </label>
        {serviceStatus.unicourt && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearUnicourtToken((current) => !current)}
          >
            {clearUnicourtToken ? 'Keep stored key' : 'Remove stored key'}
          </button>
        )}
        <label>
          LACS credential
          <input
            type="password"
            placeholder={serviceStatus.lacs ? 'Stored' : 'Enter credential'}
            value={lacsToken}
            onChange={(event) => setLacsToken(event.target.value)}
          />
        </label>
        {serviceStatus.lacs && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearLacsToken((current) => !current)}
          >
            {clearLacsToken ? 'Keep stored credential' : 'Remove stored credential'}
          </button>
        )}
        <label>
          Case.law API key
          <input
            type="password"
            placeholder={serviceStatus.caselaw ? 'Stored' : 'Enter API key'}
            value={caselawToken}
            onChange={(event) => setCaselawToken(event.target.value)}
          />
        </label>
        {serviceStatus.caselaw && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearCaselawToken((current) => !current)}
          >
            {clearCaselawToken ? 'Keep stored key' : 'Remove stored key'}
          </button>
        )}
        <label>
          Research browser API key
          <input
            type="password"
            placeholder={serviceStatus.research_browser ? 'Stored' : 'Enter API key'}
            value={researchToken}
            onChange={(event) => setResearchToken(event.target.value)}
          />
        </label>
        {serviceStatus.research_browser && (
          <button
            type="button"
            className="link-button"
            onClick={() => setClearResearchToken((current) => !current)}
          >
            {clearResearchToken ? 'Keep stored key' : 'Remove stored key'}
          </button>
        )}
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            Save research credentials
          </button>
        </div>
      </fieldset>
    </form>
  );

  const appearanceTab = (
    <form className="settings-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset disabled={saving || loading}>
        <legend className="sr-only">Theme preference</legend>
        <div className="radio-group">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((value) => (
            <label key={value} className={themePreference === value ? 'active' : ''}>
              <input
                type="radio"
                name="theme-preference"
                value={value}
                checked={themePreference === value}
                onChange={() => handleThemeChange(value)}
              />
              {value === 'system' ? 'Match system' : value === 'light' ? 'Light' : 'Dark'}
            </label>
          ))}
        </div>
        <div className="settings-subsection">
          <h3>Voice profile</h3>
          <p className="settings-hint">
            Default voice used for spoken assistant responses. Select a natural persona for your workflow.
          </p>
          <label>
            Preferred voice
            <select value={preferredVoice} onChange={(event) => handleVoiceProfileChange(event.target.value)}>
              {voiceProfiles.map((persona) => (
                <option key={persona.persona_id} value={persona.persona_id}>
                  {persona.label}
                </option>
              ))}
            </select>
          </label>
          {voiceProfiles.find((persona) => persona.persona_id === preferredVoice)?.description && (
            <p className="settings-hint">
              {voiceProfiles.find((persona) => persona.persona_id === preferredVoice)?.description}
            </p>
          )}
        </div>
      </fieldset>
    </form>
  );

  const autonomyTab = (
    <form className="settings-form" onSubmit={handleAutonomySubmit}>
      <fieldset disabled={saving || loading}>
        <legend className="sr-only">Autonomy controls</legend>
        <label>
          Enable adaptive policy tuning
          <input
            type="checkbox"
            checked={policyEnabled}
            onChange={(event) => setPolicyEnabled(event.target.checked)}
          />
        </label>
        <label>
          Initial trust
          <input
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={policyInitialTrust}
            onChange={(event) => setPolicyInitialTrust(event.target.value)}
          />
        </label>
        <label>
          Trust threshold
          <input
            type="number"
            step="0.01"
            min="0"
            max="1.5"
            value={policyTrustThreshold}
            onChange={(event) => setPolicyTrustThreshold(event.target.value)}
          />
        </label>
        <label>
          Decay
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={policyDecay}
            onChange={(event) => setPolicyDecay(event.target.value)}
          />
        </label>
        <label>
          Success reward
          <input
            type="number"
            step="0.01"
            min="0"
            max="1.5"
            value={policySuccessReward}
            onChange={(event) => setPolicySuccessReward(event.target.value)}
          />
        </label>
        <label>
          Failure penalty
          <input
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={policyFailurePenalty}
            onChange={(event) => setPolicyFailurePenalty(event.target.value)}
          />
        </label>
        <label>
          Exploration probability
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={policyExplorationProbability}
            onChange={(event) => setPolicyExplorationProbability(event.target.value)}
          />
        </label>
        <label>
          Seed (optional)
          <input
            type="number"
            value={policySeed}
            onChange={(event) => setPolicySeed(event.target.value)}
          />
        </label>
        <label>
          Observable roles (comma-separated)
          <input
            type="text"
            value={policyObservableRoles}
            onChange={(event) => setPolicyObservableRoles(event.target.value)}
          />
        </label>
        <label>
          Suppressible roles (comma-separated)
          <input
            type="text"
            value={policySuppressibleRoles}
            onChange={(event) => setPolicySuppressibleRoles(event.target.value)}
          />
        </label>
        <label>
          Graph refinement enabled
          <input
            type="checkbox"
            checked={graphRefinementEnabled}
            onChange={(event) => setGraphRefinementEnabled(event.target.checked)}
          />
        </label>
        <label>
          Graph refinement interval (seconds)
          <input
            type="number"
            step="10"
            min="60"
            value={graphRefinementInterval}
            onChange={(event) => setGraphRefinementInterval(event.target.value)}
          />
        </label>
        <label>
          Graph refinement idle limit
          <input
            type="number"
            min="1"
            value={graphRefinementIdleLimit}
            onChange={(event) => setGraphRefinementIdleLimit(event.target.value)}
          />
        </label>
        <label>
          Minimum new edges per run
          <input
            type="number"
            min="0"
            value={graphRefinementMinEdges}
            onChange={(event) => setGraphRefinementMinEdges(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            Save autonomy settings
          </button>
        </div>
      </fieldset>
    </form>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'providers':
        return providerTab;
      case 'credentials':
        return credentialsTab;
      case 'research':
        return researchTab;
      case 'autonomy':
        return autonomyTab;
      case 'appearance':
        return appearanceTab;
      default:
        return null;
    }
  };

  return (
    <div className="settings-panel">
      <button
        type="button"
        className="settings-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="settings-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path
              d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Zm8.5 3.25a7.92 7.92 0 0 1-.12 1.34l2.02 1.58-1.9 3.3-2.4-.97a8.18 8.18 0 0 1-2.31 1.34l-.36 2.56h-3.8l-.36-2.56a8.18 8.18 0 0 1-2.31-1.34l-2.4.97-1.9-3.3 2.02-1.58A7.92 7.92 0 0 1 3.5 12c0-.45.04-.9.12-1.34L1.6 9.08l1.9-3.3 2.4.97a8.18 8.18 0 0 1 2.31-1.34L8.57 2.85h3.8l.36 2.56a8.18 8.18 0 0 1 2.31 1.34l2.4-.97 1.9 3.3-2.02 1.58c.08.44.12.89.12 1.34Z"
              fill="currentColor"
            />
          </svg>
        </span>
        Settings
      </button>
      {open && (
        <div className="settings-surface" role="dialog" aria-modal="false">
          <header className="settings-header">
            <h2>Application settings</h2>
            {error ? <p className="settings-error">{error}</p> : null}
          </header>
          <div className="settings-body">
            <nav className="settings-tabs" aria-label="Settings categories">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="settings-content">{renderTab()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
