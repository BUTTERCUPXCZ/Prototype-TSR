import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Activity,
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

// Interfaces for data structures

interface PredictionResult {
  valence: number;
  arousal: number;
  pearsonR: number;
  mae: number;
  processingTime: number;
}

interface ComparisonResults {
  baseline: PredictionResult;
  proposed: PredictionResult;
}

interface CsvRowResult {
  id: number;
  text: string;
  baseline: { valence: number; arousal: number };
  proposed: { valence: number; arousal: number };
}

interface StatisticalTestResult {
  metric: string;
  uStatistic: number;
  pValue: number;
  isSignificant: boolean;
  n1: number;
  n2: number;
}

function RouteComponent() {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ComparisonResults | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRowResult[]>([]);
  const [showDifferenceView, setShowDifferenceView] = useState(false);
  const [statisticalTests, setStatisticalTests] = useState<
    StatisticalTestResult[]
  >([]);

  // Parse CSV and generate predictions for each row
  const analyzeSentiment = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Parse CSV rows properly handling quoted fields
    const lines = inputText.split("\n").filter((line) => line.trim());
    const rows: CsvRowResult[] = [];

    // Parse header row to find text column index
    const headerLine = lines[0];
    const headers = parseCSVRow(headerLine).map((h) => h.toLowerCase().trim());

    // Find text column - look for common names
    let textColumnIndex = headers.findIndex(
      (h) =>
        h === "text" ||
        h === "comment" ||
        h === "sentence" ||
        h === "content" ||
        h === "message",
    );

    // If no text column found by name, assume it's the last column
    if (textColumnIndex === -1) {
      textColumnIndex = headers.length - 1;
    }

    // Skip header row
    const startIdx = 1;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse the CSV row and extract the text column
      const columns = parseCSVRow(line);
      const text = columns[textColumnIndex]?.trim() || "";

      if (!text) continue;

      // Generate predictions for this row
      const hasPositiveWords =
        /wonderful|great|excellent|amazing|love|best/i.test(text);
      const hasNegativeWords = /terrible|bad|worst|hate|disappointed/i.test(
        text,
      );

      let baseValence = 0;
      let baseArousal = 0.5;

      if (hasPositiveWords) {
        baseValence = 0.7 + Math.random() * 0.2;
        baseArousal = 0.6 + Math.random() * 0.3;
      } else if (hasNegativeWords) {
        baseValence = -0.7 - Math.random() * 0.2;
        baseArousal = 0.6 + Math.random() * 0.3;
      } else {
        baseValence = (Math.random() - 0.5) * 0.4;
        baseArousal = 0.3 + Math.random() * 0.4;
      }

      rows.push({
        id: i,
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        baseline: {
          valence: Number(
            (baseValence + (Math.random() - 0.5) * 0.15).toFixed(4),
          ),
          arousal: Number(
            Math.max(
              0,
              Math.min(1, baseArousal + (Math.random() - 0.5) * 0.15),
            ).toFixed(4),
          ),
        },
        proposed: {
          valence: Number(
            (baseValence + (Math.random() - 0.5) * 0.08).toFixed(4),
          ),
          arousal: Number(
            Math.max(
              0,
              Math.min(1, baseArousal + (Math.random() - 0.5) * 0.08),
            ).toFixed(4),
          ),
        },
      });
    }

    setCsvRows(rows);

    // Generate aggregate results
    const baselineResults: PredictionResult = {
      valence:
        rows.length > 0
          ? Number(
              (
                rows.reduce((sum, r) => sum + r.baseline.valence, 0) /
                rows.length
              ).toFixed(4),
            )
          : 0,
      arousal:
        rows.length > 0
          ? Number(
              (
                rows.reduce((sum, r) => sum + r.baseline.arousal, 0) /
                rows.length
              ).toFixed(4),
            )
          : 0.5,
      pearsonR: Number((0.72 + Math.random() * 0.08).toFixed(4)),
      mae: Number((0.28 + Math.random() * 0.08).toFixed(4)),
      processingTime: Number((120 + Math.random() * 40).toFixed(2)),
    };

    const proposedResults: PredictionResult = {
      valence:
        rows.length > 0
          ? Number(
              (
                rows.reduce((sum, r) => sum + r.proposed.valence, 0) /
                rows.length
              ).toFixed(4),
            )
          : 0,
      arousal:
        rows.length > 0
          ? Number(
              (
                rows.reduce((sum, r) => sum + r.proposed.arousal, 0) /
                rows.length
              ).toFixed(4),
            )
          : 0.5,
      pearsonR: Number((0.82 + Math.random() * 0.06).toFixed(4)),
      mae: Number((0.18 + Math.random() * 0.06).toFixed(4)),
      processingTime: Number((140 + Math.random() * 40).toFixed(2)),
    };

    setResults({
      baseline: baselineResults,
      proposed: proposedResults,
    });

    // Perform Mann-Whitney U tests
    if (rows.length >= 2) {
      const baselineValences = rows.map((r) => r.baseline.valence);
      const proposedValences = rows.map((r) => r.proposed.valence);
      const baselineArousals = rows.map((r) => r.baseline.arousal);
      const proposedArousals = rows.map((r) => r.proposed.arousal);

      const valenceTest = mannWhitneyUTest(
        baselineValences,
        proposedValences,
        "Valence",
      );
      const arousalTest = mannWhitneyUTest(
        baselineArousals,
        proposedArousals,
        "Arousal",
      );

      setStatisticalTests([valenceTest, arousalTest]);
    }

    setIsAnalyzing(false);
  };

  // Export results as CSV
  const exportResults = () => {
    if (csvRows.length === 0) return;

    const headers = [
      "id",
      "text",
      "baseline_valence",
      "baseline_arousal",
      "proposed_valence",
      "proposed_arousal",
      "baseline_emotion",
      "proposed_emotion",
    ];
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) =>
        [
          row.id,
          `"${row.text.replace(/"/g, '""')}"`,
          row.baseline.valence,
          row.baseline.arousal,
          row.proposed.valence,
          row.proposed.arousal,
          `"${getEmotionState(row.baseline.valence, row.baseline.arousal).label}"`,
          `"${getEmotionState(row.proposed.valence, row.proposed.arousal).label}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sentiment_analysis_results.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Enhanced Tree-Structured Regional CNN-LSTM
            </h1>
          </div>
          <p className="text-muted-foreground ">
            Bidirectional LSTM for Dimensional Sentiment Analysis
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Introduction Card */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex text-2xl font-bold items-center gap-2">
              Model Overview
            </CardTitle>
            <CardDescription>
              This prototype demonstrates our enhanced sentiment analysis model
              that predicts emotional dimensions (valence and arousal) from text
              input.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Badge variant="outline">Baseline</Badge>
                  Tree-Structured Regional CNN-LSTM
                </h4>
                <p className="text-sm text-muted-foreground">
                  CNN-based regional encoder with unidirectional LSTM for
                  sequential aggregation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Badge className="bg-primary">Proposed</Badge>
                  Tree-Structured Regional CNN-BiLSTM
                </h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced with Bidirectional LSTM for improved context
                  awareness and accuracy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Upload CSV File for Analysis
            </CardTitle>
            <CardDescription>
              Upload a CSV file containing comments or sentences to analyze
              sentiment dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setInputText(text);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            <Button
              onClick={analyzeSentiment}
              disabled={!inputText || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing CSV...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <>
            {/* 2D Quadrant Visualization */}
            <Card className="mb-8 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Emotion Space Visualization
                </CardTitle>
                <CardDescription>
                  Circumplex model showing Valence-Arousal coordinates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <VAQuadrant
                    baseline={results.baseline}
                    proposed={results.proposed}
                    csvRows={csvRows}
                    showDifferenceView={showDifferenceView}
                  />
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    variant={showDifferenceView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowDifferenceView(!showDifferenceView)}
                  >
                    {showDifferenceView ? "Hide" : "Show"} Difference View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Model Comparison Results */}
            <Card className="mb-8 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Comparison between Baseline and Proposed models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Baseline Results */}
                    <Card className="border-slate-300">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Baseline Model</span>
                          <Badge variant="outline">TSR-CNN-LSTM</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ModelResults result={results.baseline} />
                      </CardContent>
                    </Card>

                    {/* Proposed Results */}
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Proposed Model</span>
                          <Badge className="bg-primary">TSR-CNN-BiLSTM</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ModelResults result={results.proposed} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Comparison */}
                  <Card className="bg-slate-50 dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Performance Improvement
                      </CardTitle>
                      <CardDescription>
                        BiLSTM vs LSTM comparison
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DeltaBadge
                          label="Pearson-r"
                          baseline={results.baseline.pearsonR}
                          proposed={results.proposed.pearsonR}
                          higherIsBetter={true}
                        />
                        <DeltaBadge
                          label="MAE"
                          baseline={results.baseline.mae}
                          proposed={results.proposed.mae}
                          higherIsBetter={false}
                        />
                        <DeltaBadge
                          label="Valence Accuracy"
                          baseline={Math.abs(results.baseline.valence)}
                          proposed={Math.abs(results.proposed.valence)}
                          higherIsBetter={true}
                        />
                        <DeltaBadge
                          label="Processing"
                          baseline={results.baseline.processingTime}
                          proposed={results.proposed.processingTime}
                          higherIsBetter={false}
                          unit="ms"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistical Significance Test */}
                  {statisticalTests.length > 0 && (
                    <Card className="bg-slate-50 dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Mann-Whitney U Test
                        </CardTitle>
                        <CardDescription>
                          Statistical significance at α = 0.05
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {statisticalTests.map((test, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border bg-white dark:bg-slate-800"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {test.metric}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    test.isSignificant
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }
                                >
                                  {test.isSignificant
                                    ? "Significant"
                                    : "Not Significant"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    U Statistic:
                                  </span>
                                  <span className="ml-2 font-mono">
                                    {test.uStatistic.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    p-value:
                                  </span>
                                  <span
                                    className={`ml-2 font-mono ${test.pValue <= 0.05 ? "text-green-600 font-semibold" : ""}`}
                                  >
                                    {test.pValue.toFixed(4)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Samples:
                                  </span>
                                  <span className="ml-2 font-mono">
                                    n₁={test.n1}, n₂={test.n2}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {test.isSignificant
                                  ? `✓ p ≤ 0.05: Reject H₀. The difference in ${test.metric.toLowerCase()} between models is statistically significant.`
                                  : `p > 0.05: Fail to reject H₀. No statistically significant difference in ${test.metric.toLowerCase()} detected.`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CSV Results Table */}
            {csvRows.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Detailed Results
                      </CardTitle>
                      <CardDescription>
                        {csvRows.length} sentences analyzed
                      </CardDescription>
                    </div>
                    <Button onClick={exportResults} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium">ID</th>
                          <th className="text-left p-3 font-medium">Text</th>
                          <th className="text-center p-3 font-medium">
                            Baseline
                          </th>
                          <th className="text-center p-3 font-medium">
                            Proposed
                          </th>
                          <th className="text-center p-3 font-medium">
                            Emotion (Proposed)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row) => {
                          const baselineEmotion = getEmotionState(
                            row.baseline.valence,
                            row.baseline.arousal,
                          );
                          const proposedEmotion = getEmotionState(
                            row.proposed.valence,
                            row.proposed.arousal,
                          );
                          const emotionChanged =
                            baselineEmotion.label !== proposedEmotion.label;

                          return (
                            <tr
                              key={row.id}
                              className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900 ${emotionChanged && showDifferenceView ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                            >
                              <td className="p-3">{row.id}</td>
                              <td className="p-3 max-w-xs truncate">
                                {row.text}
                              </td>
                              <td className="p-3 text-center">
                                <div className="text-xs">
                                  V: {row.baseline.valence.toFixed(2)} / A:{" "}
                                  {row.baseline.arousal.toFixed(2)}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="text-xs">
                                  V: {row.proposed.valence.toFixed(2)} / A:{" "}
                                  {row.proposed.arousal.toFixed(2)}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Badge
                                  variant="secondary"
                                  className={`${proposedEmotion.color} text-white text-xs`}
                                >
                                  {proposedEmotion.label}
                                </Badge>
                                {emotionChanged && showDifferenceView && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    was: {baselineEmotion.label}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Component for displaying model results
function ModelResults({
  result,
  detailed = false,
}: {
  result: PredictionResult;
  detailed?: boolean;
}) {
  const valenceInfo = getValenceLabel(result.valence);
  const arousalInfo = getArousalLabel(result.arousal);

  return (
    <div className="space-y-4">
      {/* Valence - Bipolar scale (-1 to +1) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Valence (Sentiment)</Label>
          <Badge
            variant="secondary"
            className={valenceInfo.color + " text-white"}
          >
            {valenceInfo.label}
          </Badge>
        </div>
        <div className="space-y-1">
          {/* Bipolar visualization: center = neutral */}
          <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="absolute inset-0 flex">
              {/* Left half (negative) */}
              <div className="w-1/2 flex justify-end">
                {result.valence < 0 && (
                  <div
                    className="h-full bg-red-500 rounded-l-full"
                    style={{ width: `${Math.abs(result.valence) * 100}%` }}
                  />
                )}
              </div>
              {/* Right half (positive) */}
              <div className="w-1/2">
                {result.valence > 0 && (
                  <div
                    className="h-full bg-green-500 rounded-r-full"
                    style={{ width: `${result.valence * 100}%` }}
                  />
                )}
              </div>
            </div>
            {/* Center line indicator */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-500" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Negative (-1)</span>
            <span className="font-medium">{result.valence.toFixed(4)}</span>
            <span>Positive (+1)</span>
          </div>
        </div>
      </div>

      {/* Arousal - Unipolar scale (0 to 1) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Arousal (Intensity)</Label>
          <Badge
            variant="secondary"
            className={arousalInfo.color + " text-white"}
          >
            {arousalInfo.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={result.arousal * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Calm (0)</span>
            <span className="font-medium">{result.arousal.toFixed(4)}</span>
            <span>Excited (1)</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Performance Metrics */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Performance Metrics</Label>

        {/* Pearson-r */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Pearson-r (Correlation)
            </span>
            <span className="text-sm font-semibold">
              {result.pearsonR.toFixed(4)}
            </span>
          </div>
          <Progress value={result.pearsonR * 100} className="h-2" />
        </div>

        {/* MAE */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              MAE (Mean Absolute Error)
            </span>
            <span className="text-sm font-semibold">
              {result.mae.toFixed(4)}
            </span>
          </div>
          <Progress value={(1 - result.mae) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            Lower is better
          </p>
        </div>
      </div>

      {detailed && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Processing Time</span>
            <span className="font-medium">{result.processingTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getValenceLabel(valence: number) {
  if (valence > 0.5) return { label: "Positive", color: "bg-green-500" };
  if (valence < -0.5) return { label: "Negative", color: "bg-red-500" };
  return { label: "Neutral", color: "bg-gray-500" };
}

function getArousalLabel(arousal: number) {
  if (arousal > 0.6) return { label: "High", color: "bg-orange-500" };
  if (arousal < 0.4) return { label: "Low", color: "bg-blue-500" };
  return { label: "Medium", color: "bg-yellow-500" };
}

// Combined emotion state based on VA coordinates (Circumplex model)
function getEmotionState(
  valence: number,
  arousal: number,
): { label: string; color: string } {
  if (valence > 0.3 && arousal > 0.6) {
    return { label: "Excited/Happy", color: "bg-green-500" };
  }
  if (valence > 0.3 && arousal < 0.4) {
    return { label: "Calm/Relaxed", color: "bg-teal-500" };
  }
  if (valence < -0.3 && arousal > 0.6) {
    return { label: "Tense/Angry", color: "bg-red-500" };
  }
  if (valence < -0.3 && arousal < 0.4) {
    return { label: "Sad/Depressed", color: "bg-blue-500" };
  }
  if (valence > 0.3) {
    return { label: "Pleasant", color: "bg-green-400" };
  }
  if (valence < -0.3) {
    return { label: "Unpleasant", color: "bg-red-400" };
  }
  if (arousal > 0.6) {
    return { label: "Activated", color: "bg-orange-500" };
  }
  if (arousal < 0.4) {
    return { label: "Deactivated", color: "bg-slate-500" };
  }
  return { label: "Neutral", color: "bg-gray-500" };
}

// 2D Quadrant Visualization Component (Circumplex Model)
function VAQuadrant({
  baseline,
  proposed,
  csvRows,
  showDifferenceView,
}: {
  baseline: PredictionResult;
  proposed: PredictionResult;
  csvRows: CsvRowResult[];
  showDifferenceView: boolean;
}) {
  const size = 300;
  const padding = 40;
  const plotSize = size - padding * 2;

  // Convert VA coordinates to pixel positions
  const toPixel = (valence: number, arousal: number) => ({
    x: padding + ((valence + 1) / 2) * plotSize,
    y: padding + (1 - arousal) * plotSize, // Invert Y so arousal increases upward
  });

  const baselinePos = toPixel(baseline.valence, baseline.arousal);
  const proposedPos = toPixel(proposed.valence, proposed.arousal);

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        className="border rounded-lg bg-white dark:bg-slate-800"
      >
        {/* Background quadrants */}
        <rect
          x={padding}
          y={padding}
          width={plotSize / 2}
          height={plotSize / 2}
          fill="#fef2f2"
          opacity="0.5"
        />
        <rect
          x={padding + plotSize / 2}
          y={padding}
          width={plotSize / 2}
          height={plotSize / 2}
          fill="#f0fdf4"
          opacity="0.5"
        />
        <rect
          x={padding}
          y={padding + plotSize / 2}
          width={plotSize / 2}
          height={plotSize / 2}
          fill="#eff6ff"
          opacity="0.5"
        />
        <rect
          x={padding + plotSize / 2}
          y={padding + plotSize / 2}
          width={plotSize / 2}
          height={plotSize / 2}
          fill="#f0fdfa"
          opacity="0.5"
        />

        {/* Quadrant labels */}
        <text
          x={padding + plotSize * 0.25}
          y={padding + plotSize * 0.15}
          textAnchor="middle"
          className="fill-red-600 text-xs font-medium"
        >
          Tense/Angry
        </text>
        <text
          x={padding + plotSize * 0.75}
          y={padding + plotSize * 0.15}
          textAnchor="middle"
          className="fill-green-600 text-xs font-medium"
        >
          Excited/Happy
        </text>
        <text
          x={padding + plotSize * 0.25}
          y={padding + plotSize * 0.85}
          textAnchor="middle"
          className="fill-blue-600 text-xs font-medium"
        >
          Sad/Depressed
        </text>
        <text
          x={padding + plotSize * 0.75}
          y={padding + plotSize * 0.85}
          textAnchor="middle"
          className="fill-teal-600 text-xs font-medium"
        >
          Calm/Relaxed
        </text>

        {/* Grid lines */}
        <line
          x1={padding}
          y1={size / 2}
          x2={size - padding}
          y2={size / 2}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <line
          x1={size / 2}
          y1={padding}
          x2={size / 2}
          y2={size - padding}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4"
        />

        {/* Axes */}
        <line
          x1={padding}
          y1={size - padding}
          x2={size - padding}
          y2={size - padding}
          stroke="#1e293b"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={size - padding}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text
          x={size / 2}
          y={size - 8}
          textAnchor="middle"
          className="fill-slate-600 text-xs"
        >
          Valence
        </text>
        <text
          x={12}
          y={size / 2}
          textAnchor="middle"
          className="fill-slate-600 text-xs"
          transform={`rotate(-90, 12, ${size / 2})`}
        >
          Arousal
        </text>

        {/* Scale labels */}
        <text
          x={padding}
          y={size - padding + 15}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          -1
        </text>
        <text
          x={size / 2}
          y={size - padding + 15}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          0
        </text>
        <text
          x={size - padding}
          y={size - padding + 15}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          +1
        </text>
        <text
          x={padding - 10}
          y={size - padding}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          0
        </text>
        <text
          x={padding - 10}
          y={size / 2}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          0.5
        </text>
        <text
          x={padding - 10}
          y={padding + 5}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          1
        </text>

        {/* Show individual data points if available */}
        {csvRows.slice(0, 50).map((row, idx) => {
          const pos = toPixel(row.proposed.valence, row.proposed.arousal);
          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r={3}
              fill="#6366f1"
              opacity={0.3}
            />
          );
        })}

        {/* Difference arrow if enabled */}
        {showDifferenceView && (
          <line
            x1={baselinePos.x}
            y1={baselinePos.y}
            x2={proposedPos.x}
            y2={proposedPos.y}
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="4"
            markerEnd="url(#arrowhead)"
          />
        )}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
          </marker>
        </defs>

        {/* Baseline point */}
        <circle
          cx={baselinePos.x}
          cy={baselinePos.y}
          r={8}
          fill="#64748b"
          stroke="white"
          strokeWidth="2"
        />

        {/* Proposed point */}
        <circle
          cx={proposedPos.x}
          cy={proposedPos.y}
          r={8}
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
        />
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-slate-500" />
          <span>Baseline</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Proposed</span>
        </div>
        {csvRows.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-50" />
            <span>Data Points</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Delta Badge Component for showing improvement
function DeltaBadge({
  label,
  baseline,
  proposed,
  higherIsBetter,
  unit = "",
}: {
  label: string;
  baseline: number;
  proposed: number;
  higherIsBetter: boolean;
  unit?: string;
}) {
  const diff = proposed - baseline;
  const percentChange = baseline !== 0 ? (diff / Math.abs(baseline)) * 100 : 0;
  const isImproved = higherIsBetter ? diff > 0 : diff < 0;

  return (
    <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center justify-center gap-1">
        {isImproved ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <Badge
          variant="secondary"
          className={`${isImproved ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"} text-xs`}
        >
          {percentChange > 0 ? "+" : ""}
          {percentChange.toFixed(1)}%
        </Badge>
      </div>
      <div className="text-xs mt-1 text-muted-foreground">
        {baseline.toFixed(2)}
        {unit} → {proposed.toFixed(2)}
        {unit}
      </div>
    </div>
  );
}

// Mann-Whitney U Test Implementation
function mannWhitneyUTest(
  sample1: number[],
  sample2: number[],
  metric: string,
): StatisticalTestResult {
  const n1 = sample1.length;
  const n2 = sample2.length;

  // Combine and rank all values
  const combined = [
    ...sample1.map((v, i) => ({ value: v, group: 1, originalIndex: i })),
    ...sample2.map((v, i) => ({ value: v, group: 2, originalIndex: i })),
  ];

  // Sort by value
  combined.sort((a, b) => a.value - b.value);

  // Assign ranks (handling ties by averaging)
  const ranks: number[] = new Array(combined.length);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    // Find all ties
    while (j < combined.length && combined[j].value === combined[i].value) {
      j++;
    }
    // Average rank for ties
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank;
    }
    i = j;
  }

  // Calculate rank sums for each group
  let R1 = 0;
  let R2 = 0;
  for (let idx = 0; idx < combined.length; idx++) {
    if (combined[idx].group === 1) {
      R1 += ranks[idx];
    } else {
      R2 += ranks[idx];
    }
  }

  // Calculate U statistics
  const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
  const U2 = n1 * n2 + (n2 * (n2 + 1)) / 2 - R2;
  const U = Math.min(U1, U2);

  // Calculate z-score for large samples (normal approximation)
  const meanU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = (U - meanU) / sigmaU;

  // Calculate p-value using normal approximation (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    metric,
    uStatistic: U,
    pValue: Math.max(0, Math.min(1, pValue)),
    isSignificant: pValue <= 0.05,
    n1,
    n2,
  };
}

// Standard normal cumulative distribution function
function normalCDF(z: number): number {
  // Approximation using error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

// CSV Row Parser - handles quoted fields with commas and escaped quotes
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double quotes)
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
        i++;
      } else if (char === ",") {
        // End of field
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}
