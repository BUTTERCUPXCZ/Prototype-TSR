import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Brain, Activity, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/prototype')({
  component: RouteComponent,
})

// Dummy data for demonstration
const SAMPLE_TEXTS = [
  "This movie is absolutely wonderful! I loved every moment of it.",
  "The service was terrible and the food was cold.",
  "It's okay, nothing special but not bad either.",
  "I'm extremely disappointed with this purchase.",
  "Best experience ever! Highly recommend to everyone!"
]

interface PredictionResult {
  valence: number
  arousal: number
  pearsonR: number
  mae: number
  processingTime: number
}

interface ComparisonResults {
  baseline: PredictionResult
  proposed: PredictionResult
}

function RouteComponent() {
  const [inputText, setInputText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<ComparisonResults | null>(null)

  // Simulate model prediction with dummy data
  const analyzeSentiment = async () => {
    if (!inputText.trim()) return

    setIsAnalyzing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate dummy predictions based on text content
    const hasPositiveWords = /wonderful|great|excellent|amazing|love|best/i.test(inputText)
    const hasNegativeWords = /terrible|bad|worst|hate|disappointed/i.test(inputText)

    let baseValence = 0
    let baseArousal = 0.5

    if (hasPositiveWords) {
      baseValence = 0.7 + Math.random() * 0.2
      baseArousal = 0.6 + Math.random() * 0.3
    } else if (hasNegativeWords) {
      baseValence = -0.7 - Math.random() * 0.2
      baseArousal = 0.6 + Math.random() * 0.3
    } else {
      baseValence = (Math.random() - 0.5) * 0.4
      baseArousal = 0.3 + Math.random() * 0.4
    }

    // Baseline model (slightly less accurate)
    const baselineResults: PredictionResult = {
      valence: Number((baseValence + (Math.random() - 0.5) * 0.15).toFixed(4)),
      arousal: Number((baseArousal + (Math.random() - 0.5) * 0.15).toFixed(4)),
      pearsonR: Number((0.72 + Math.random() * 0.08).toFixed(4)),
      mae: Number((0.28 + Math.random() * 0.08).toFixed(4)),
      processingTime: Number((120 + Math.random() * 40).toFixed(2))
    }

    // Proposed model (improved accuracy with BiLSTM)
    const proposedResults: PredictionResult = {
      valence: Number((baseValence + (Math.random() - 0.5) * 0.08).toFixed(4)),
      arousal: Number((baseArousal + (Math.random() - 0.5) * 0.08).toFixed(4)),
      pearsonR: Number((0.82 + Math.random() * 0.06).toFixed(4)),
      mae: Number((0.18 + Math.random() * 0.06).toFixed(4)),
      processingTime: Number((140 + Math.random() * 40).toFixed(2))
    }

    setResults({
      baseline: baselineResults,
      proposed: proposedResults
    })
    setIsAnalyzing(false)
  }

  const loadSampleText = (text: string) => {
    setInputText(text)
    setResults(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Enhanced Tree-Structured Regional CNN–LSTM
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
              This prototype demonstrates our enhanced sentiment analysis model that predicts emotional dimensions (valence and arousal) from text input.
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
                  CNN-based regional encoder with unidirectional LSTM for sequential aggregation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Badge className="bg-primary">Proposed</Badge>
                  Tree-Structured Regional CNN-BiLSTM
                </h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced with Bidirectional LSTM for improved context awareness and accuracy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className='text-2xl font-bold'>Input Text for Analysis</CardTitle>
            <CardDescription>
              Enter a comment or sentence to analyze its sentiment dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sentiment-input">Text Input</Label>
              <Textarea
                id="sentiment-input"
                placeholder="Enter your text here... (e.g., 'This movie is absolutely wonderful!')"
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Sample Texts */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Samples:</Label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TEXTS.map((text, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSampleText(text)}
                    className="text-xs"
                  >
                    Sample {idx + 1}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={analyzeSentiment}
              disabled={!inputText.trim() || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Sentiment
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
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

               
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}

// Component for displaying model results
function ModelResults({ result, detailed = false }: { result: PredictionResult; detailed?: boolean }) {
  const valenceInfo = getValenceLabel(result.valence)
  const arousalInfo = getArousalLabel(result.arousal)
  const normalizeToPercent = (value: number) => Math.round(((value + 1) / 2) * 100)
  const normalizeArousalToPercent = (arousal: number) => Math.round(arousal * 100)

  return (
    <div className="space-y-4">
      {/* Valence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Valence (Positivity)</Label>
          <Badge variant="secondary" className={valenceInfo.color + " text-white"}>
            {valenceInfo.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={normalizeToPercent(result.valence)} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">Score: {result.valence.toFixed(4)}</p>
        </div>
      </div>

      {/* Arousal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Arousal (Intensity)</Label>
          <Badge variant="secondary" className={arousalInfo.color + " text-white"}>
            {arousalInfo.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={normalizeArousalToPercent(result.arousal)} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">Score: {result.arousal.toFixed(4)}</p>
        </div>
      </div>

      <Separator />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pearson r</Label>
          <p className="text-2xl font-bold text-primary">{result.pearsonR.toFixed(4)}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">MAE</Label>
          <p className="text-2xl font-bold text-destructive">{result.mae.toFixed(4)}</p>
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
  )
}

function getValenceLabel(valence: number) {
  if (valence > 0.5) return { label: 'Positive', color: 'bg-green-500' }
  if (valence < -0.5) return { label: 'Negative', color: 'bg-red-500' }
  return { label: 'Neutral', color: 'bg-gray-500' }
}

function getArousalLabel(arousal: number) {
  if (arousal > 0.6) return { label: 'High', color: 'bg-orange-500' }
  if (arousal < 0.4) return { label: 'Low', color: 'bg-blue-500' }
  return { label: 'Medium', color: 'bg-yellow-500' }
}

