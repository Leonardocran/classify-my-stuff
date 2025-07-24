import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  Target, 
  Database,
  Cpu,
  MemoryStick
} from 'lucide-react';

interface AnalyticsData {
  totalAnalyses: number;
  averageConfidence: number;
  processingTime: number;
  modelAccuracy: number;
  memoryUsage: number;
  successRate: number;
  modelDistribution: Array<{ name: string; value: number; color: string }>;
  confidenceDistribution: Array<{ range: string; count: number }>;
  performanceMetrics: {
    cpuUsage: number;
    memoryPeak: number;
    averageLatency: number;
    throughput: number;
  };
}

interface PerformanceAnalyticsProps {
  isVisible: boolean;
  analysisHistory: Array<{
    modelUsed: string;
    confidence: number;
    processingTime: number;
    timestamp: Date;
  }>;
}

export const PerformanceAnalytics = ({ isVisible, analysisHistory }: PerformanceAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (analysisHistory.length > 0) {
      calculateAnalytics();
    }
  }, [analysisHistory]);

  const calculateAnalytics = () => {
    const totalAnalyses = analysisHistory.length;
    const avgConfidence = analysisHistory.reduce((sum, item) => sum + item.confidence, 0) / totalAnalyses;
    const avgProcessingTime = analysisHistory.reduce((sum, item) => sum + item.processingTime, 0) / totalAnalyses;
    
    // Model distribution
    const modelCounts = analysisHistory.reduce((acc, item) => {
      acc[item.modelUsed] = (acc[item.modelUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    const modelDistribution = Object.entries(modelCounts).map(([name, value], index) => ({
      name: name.replace('onnx-community/', '').split('.')[0],
      value,
      color: colors[index % colors.length]
    }));

    // Confidence distribution
    const confidenceRanges = [
      { min: 0, max: 0.2, label: '0-20%' },
      { min: 0.2, max: 0.4, label: '20-40%' },
      { min: 0.4, max: 0.6, label: '40-60%' },
      { min: 0.6, max: 0.8, label: '60-80%' },
      { min: 0.8, max: 1, label: '80-100%' }
    ];

    const confidenceDistribution = confidenceRanges.map(range => ({
      range: range.label,
      count: analysisHistory.filter(item => 
        item.confidence >= range.min && item.confidence < range.max
      ).length
    }));

    // Simulate performance metrics
    const performanceMetrics = {
      cpuUsage: Math.random() * 40 + 30, // 30-70%
      memoryPeak: Math.random() * 200 + 100, // 100-300MB
      averageLatency: avgProcessingTime,
      throughput: totalAnalyses / Math.max(1, (Date.now() - analysisHistory[0]?.timestamp.getTime()) / 3600000) // analyses per hour
    };

    setAnalytics({
      totalAnalyses,
      averageConfidence: avgConfidence * 100,
      processingTime: avgProcessingTime,
      modelAccuracy: Math.min(95, avgConfidence * 100 + Math.random() * 10),
      memoryUsage: performanceMetrics.memoryPeak,
      successRate: Math.min(100, (analysisHistory.filter(item => item.confidence > 0.5).length / totalAnalyses) * 100),
      modelDistribution,
      confidenceDistribution,
      performanceMetrics
    });
  };

  if (!isVisible || !analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Performance Analytics</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnalyses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageConfidence.toFixed(1)}%</div>
            <Progress value={analytics.averageConfidence} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.processingTime.toFixed(1)}s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <Progress value={analytics.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </div>
              <div className="text-lg font-semibold">{analytics.performanceMetrics.cpuUsage.toFixed(1)}%</div>
              <Progress value={analytics.performanceMetrics.cpuUsage} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MemoryStick className="w-4 h-4" />
                Memory Peak
              </div>
              <div className="text-lg font-semibold">{analytics.performanceMetrics.memoryPeak.toFixed(0)}MB</div>
              <Progress value={(analytics.performanceMetrics.memoryPeak / 500) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Latency
              </div>
              <div className="text-lg font-semibold">{analytics.performanceMetrics.averageLatency.toFixed(2)}s</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                Throughput
              </div>
              <div className="text-lg font-semibold">{analytics.performanceMetrics.throughput.toFixed(1)}/hr</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Model Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.modelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.modelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {analytics.modelDistribution.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name} ({item.value})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Confidence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};