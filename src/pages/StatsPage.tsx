import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Heart, 
  Calendar, 
  Target,
  Brain,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const StatsPage = () => {
  const { history } = useApp();

  const totalAnalyzed = history.length;
  const totalFavorites = history.filter(h => h.isFavorite).length;
  const todayCount = history.filter(h => 
    new Date(h.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const thisWeekCount = history.filter(h => {
    const itemDate = new Date(h.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return itemDate >= weekAgo;
  }).length;

  const avgConfidence = history.length > 0 
    ? history.reduce((acc, item) => acc + (item.results[0]?.score || 0), 0) / history.length * 100
    : 0;

  const mostCommonLabels = history.reduce((acc, item) => {
    const topLabel = item.results[0]?.label;
    if (topLabel) {
      acc[topLabel] = (acc[topLabel] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topLabels = Object.entries(mostCommonLabels)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const recentActivity = history.slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/15 backdrop-blur-sm rounded-full text-primary font-medium border border-primary/20">
          <BarChart3 className="w-4 h-4" />
          Your Analytics
        </div>
        <h1 className="text-3xl font-bold">Classification Statistics</h1>
        <p className="text-muted-foreground">
          Track your AI classification journey and insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-primary/5 border border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Analyzed</p>
                <p className="text-3xl font-bold text-primary">{totalAnalyzed}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-3xl font-bold text-red-500">{totalFavorites}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-3xl font-bold text-green-500">{todayCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-3xl font-bold text-blue-500">{avgConfidence.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Classifications */}
        <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Common Classifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLabels.length > 0 ? (
              <div className="space-y-4">
                {topLabels.map(([label, count], index) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium capitalize">
                          {label.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-bold">
                        {count} times
                      </span>
                    </div>
                    <Progress 
                      value={(count / totalAnalyzed) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No classifications yet. Start analyzing images!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <img 
                      src={item.imageUrl} 
                      alt={item.fileName}
                      className="w-12 h-12 rounded-lg object-cover border border-border/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.fileName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">
                          {item.results[0]?.label?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {((item.results[0]?.score || 0) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="p-6 bg-gradient-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{thisWeekCount}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {thisWeekCount > 0 ? (thisWeekCount / 7).toFixed(1) : '0'}
              </p>
              <p className="text-sm text-muted-foreground">Daily Average</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {history.filter(h => h.isFavorite).length}
              </p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {avgConfidence.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPage;