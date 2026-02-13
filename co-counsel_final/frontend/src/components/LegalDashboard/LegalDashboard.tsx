import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Lightbulb, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GraphStrategyBrief {
  generated_at: string;
  summary: string;
  focus_nodes: Array<{ id: string; label: string; type: string }>;
  argument_map: Array<any>; // Simplified for now
  contradictions: Array<any>; // Simplified for now
  leverage_points: Array<{ node: { id: string; label: string; type: string }; influence: number; connections: number; reason: string }>;
}

interface PredictiveOutcome {
  predicted_outcome: string;
  probabilities: { [key: string]: number };
  summary: string;
  strategy_brief: GraphStrategyBrief;
}

interface StrategicRecommendations {
  predicted_outcome: string;
  recommendations: string[];
  prediction_details: PredictiveOutcome;
}

const LegalDashboard: React.FC = () => {
  const [question, setQuestion] = useState("What are the key arguments in the contract dispute case?");
  const [focusNodes, setFocusNodes] = useState<string[]>(["ContractZ", "CompanyY"]);
  const [strategyBrief, setStrategyBrief] = useState<GraphStrategyBrief | null>(null);
  const [predictiveOutcome, setPredictiveOutcome] = useState<PredictiveOutcome | null>(null);
  const [strategicRecommendations, setStrategicRecommendations] = useState<StrategicRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder for fetching Legal Theory (Strategy Brief)
      // Replace with actual API call to /legal-theory/synthesize
      const mockStrategyBrief: GraphStrategyBrief = {
        generated_at: new Date().toISOString(),
        summary: "Key arguments revolve around contract clauses and company obligations.",
        focus_nodes: [
          { id: "ContractZ", label: "Sales Contract", type: "Contract" },
          { id: "CompanyY", label: "Acme Corp", type: "Organization" },
        ],
        argument_map: [],
        contradictions: [
          { source: { label: "Clause A" }, target: { label: "Clause B" }, relation: "CONTRADICTS", documents: ["doc1"] },
        ],
        leverage_points: [
          { node: { id: "PersonX", label: "John Doe", type: "Person" }, influence: 0.8, connections: 15, reason: "John Doe is connected to 15 node(s), linked to 3 document(s)." },
        ],
      };
      setStrategyBrief(mockStrategyBrief);

      // Placeholder for fetching Predictive Analytics
      // Replace with actual API call to /predictive-analytics/outcome
      const mockPredictiveOutcome: PredictiveOutcome = {
        predicted_outcome: "settlement",
        probabilities: { favorable: 0.3, unfavorable: 0.2, settlement: 0.5 },
        summary: "Based on the synthesized legal theories and available evidence, the predicted outcome is settlement with the following probabilities: favorable: 0.30, unfavorable: 0.20, settlement: 0.50.",
        strategy_brief: mockStrategyBrief,
      };
      setPredictiveOutcome(mockPredictiveOutcome);

      // Placeholder for fetching Strategic Recommendations
      // Replace with actual API call to /strategic-recommendations/get
      const mockStrategicRecommendations: StrategicRecommendations = {
        predicted_outcome: "settlement",
        recommendations: [
          "Prepare for negotiation by understanding key arguments and potential compromises.",
          "Be aware of contradictions that could impact negotiation.",
          "Consider the following focus nodes: [Sales Contract, Acme Corp]",
          "Key leverage points: [John Doe]",
        ],
        prediction_details: mockPredictiveOutcome,
      };
      setStrategicRecommendations(mockStrategicRecommendations);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [question, focusNodes]);

  if (loading) {
    return (
      <div className="legal-dashboard__loading">
        <BarChart className="spinner-icon" />
        <span>Loading legal dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evidence-viewer__state error-text">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="legal-dashboard">
      <Card className="legal-dashboard__card">
        <CardHeader className="legal-dashboard__header">
          <CardTitle className="legal-dashboard__title">
            <Scale className="legal-dashboard__icon" /> Legal Theory & Strategy Dashboard
          </CardTitle>
          <p className="legal-dashboard__subtitle">Insights for case outcomes and strategic planning.</p>
        </CardHeader>
        <CardContent className="legal-dashboard__content">
          <Tabs defaultValue="theory" className="legal-tabs">
            <TabsList className="legal-tabs__list">
              <TabsTrigger value="theory" className="legal-tabs__trigger">Legal Theory</TabsTrigger>
              <TabsTrigger value="predictive" className="legal-tabs__trigger">Predictive Analytics</TabsTrigger>
              <TabsTrigger value="strategic" className="legal-tabs__trigger">Strategic Recommendations</TabsTrigger>
            </TabsList>
            <TabsContent value="theory" className="legal-tabs__panel">
              <Card className="legal-panel">
                <CardHeader>
                  <CardTitle className="legal-panel__title">
                    <Lightbulb className="legal-panel__icon" /> Legal Theory Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="legal-panel__body">
                  <p className="legal-panel__summary">{strategyBrief?.summary}</p>
                  <h4 className="legal-panel__heading">Focus Nodes:</h4>
                  <div className="legal-chip-grid">
                    {strategyBrief?.focus_nodes.map(node => (
                      <Badge key={node.id} variant="outline" className="legal-chip">
                        {node.label} ({node.type})
                      </Badge>
                    ))}
                  </div>
                  <h4 className="legal-panel__heading">Contradictions:</h4>
                  <ScrollArea className="legal-scroll">
                    {strategyBrief?.contradictions && strategyBrief.contradictions.length > 0 ? (
                      <ul className="legal-bullet-list">
                        {strategyBrief.contradictions.map((contra, index) => (
                          <li key={index}>{contra.source.label} CONTRADICTS {contra.target.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="legal-empty">No significant contradictions identified.</p>
                    )}
                  </ScrollArea>
                  <h4 className="legal-panel__heading">Leverage Points:</h4>
                  <ScrollArea className="legal-scroll">
                    {strategyBrief?.leverage_points && strategyBrief.leverage_points.length > 0 ? (
                      <ul className="legal-bullet-list">
                        {strategyBrief.leverage_points.map((lp, index) => (
                          <li key={index}>{lp.node.label} (Influence: {lp.influence.toFixed(2)}, Connections: {lp.connections}) - {lp.reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="legal-empty">No significant leverage points identified.</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="predictive" className="legal-tabs__panel">
              <Card className="legal-panel">
                <CardHeader>
                  <CardTitle className="legal-panel__title">
                    <TrendingUp className="legal-panel__icon" /> Predictive Outcome
                  </CardTitle>
                </CardHeader>
                <CardContent className="legal-panel__body">
                  <p className="legal-panel__summary">{predictiveOutcome?.summary}</p>
                  <h4 className="legal-panel__heading">Probabilities:</h4>
                  <div className="legal-probabilities">
                    {predictiveOutcome?.probabilities && Object.entries(predictiveOutcome.probabilities).map(([outcome, prob]) => (
                      <div key={outcome} className="legal-prob-row">
                        <span className="legal-prob-label">{outcome}:</span>
                        <Progress value={prob * 100} className="legal-progress" indicatorColor={outcome === predictiveOutcome.predicted_outcome ? "bg-green-500" : "bg-blue-500"} />
                        <span className="legal-prob-value">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="strategic" className="legal-tabs__panel">
              <Card className="legal-panel">
                <CardHeader>
                  <CardTitle className="legal-panel__title">
                    <Lightbulb className="legal-panel__icon" /> Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="legal-panel__body">
                  <p className="legal-panel__summary">
                    Predicted Outcome: <Badge className="legal-chip legal-chip--success">{strategicRecommendations?.predicted_outcome}</Badge>
                  </p>
                  <h4 className="legal-panel__heading">Recommendations:</h4>
                  <ScrollArea className="legal-scroll legal-scroll--tall">
                    {strategicRecommendations?.recommendations && strategicRecommendations.recommendations.length > 0 ? (
                      <ul className="legal-bullet-list">
                        {strategicRecommendations.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="legal-empty">No specific recommendations generated.</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};

export default LegalDashboard;
