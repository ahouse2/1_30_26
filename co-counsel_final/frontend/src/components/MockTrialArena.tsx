import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '@/config';

interface Scenario {
  id: string;
  name: string;
  description: string;
}

export function MockTrialArena() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(buildApiUrl('/scenarios'));
        if (!response.ok) {
          throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
        }
        const data = await response.json();
        setScenarios(data.scenarios);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  const handleRunScenario = async () => {
    if (!selectedScenario) return;
    // Placeholder for running a scenario
    console.log(`Running scenario: ${selectedScenario.name}`);
    // In a real implementation, this would call POST /scenarios/run
  };

  return (
    <motion.div
      className="mock-trial-arena"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
    >
      <header>
        <h2>Mock Trial Arena</h2>
        <p className="panel-subtitle">Interactive scenario drills and courtroom rehearsals.</p>
      </header>
      {loading && <span>Loading Scenarios...</span>}
      {error && <span className="error-text">Error: {error}</span>}
      {!loading && !error && scenarios.length > 0 && (
        <div className="mock-trial-arena__select">
          <h3>Available Scenarios</h3>
          <select
            onChange={(e) => {
              const scenarioId = e.target.value;
              setSelectedScenario(scenarios.find((s) => s.id === scenarioId) || null);
            }}
            className="input-cinematic"
          >
            <option value="">Select a Scenario</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          {selectedScenario && (
            <div className="mock-trial-arena__detail">
              <h4>{selectedScenario.name}</h4>
              <p>{selectedScenario.description}</p>
              <button onClick={handleRunScenario} className="btn-cinematic">
                Run Scenario
              </button>
            </div>
          )}
        </div>
      )}
      {!loading && !error && scenarios.length === 0 && <span>No scenarios available.</span>}

      <div className="mock-trial-arena__footnote">Live video + transcript stream (placeholder)</div>
    </motion.div>
  );
}
