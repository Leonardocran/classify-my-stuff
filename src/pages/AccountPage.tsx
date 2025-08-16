import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  LogOut, 
  Mail, 
  Calendar, 
  Shield, 
  Settings,
  Brain,
  Zap,
  Heart,
  History
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const AccountPage = () => {
  const { user, history, handleLogout } = useApp();
  const navigate = useNavigate();

  const totalAnalyzed = history.length;
  const totalFavorites = history.filter(h => h.isFavorite).length;
  const todayCount = history.filter(h => 
    new Date(h.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const avgConfidence = history.length > 0 
    ? history.reduce((acc, item) => acc + (item.results[0]?.score || 0), 0) / history.length * 100
    : 0;

  const handleLogoutClick = async () => {
    await handleLogout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary/15 backdrop-blur-sm rounded-full text-primary font-medium border border-primary/20">
          <User className="w-4 h-4" />
          Account Settings
        </div>
        <h1 className="text-3xl font-bold">Your Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and view account statistics
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.email || 'User'}</h3>
                    <p className="text-muted-foreground">AI Classification User</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user?.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Account Status</p>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">User ID</p>
                        <p className="font-medium text-xs text-muted-foreground">
                          {user?.id ? `${user.id.substring(0, 8)}...` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="p-6 bg-gradient-primary/5 border border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{totalAnalyzed}</p>
                  <p className="text-sm text-muted-foreground">Total Analyzed</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-500">{totalFavorites}</p>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">{todayCount}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <History className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-500">{avgConfidence.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-card/60 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/stats')}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  View Statistics
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/history')}
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card className="p-6 bg-destructive/5 border border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign out of your account. You'll need to log back in to access your data.
                </p>
                
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleLogoutClick}
                  size="lg"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="p-6 bg-muted/30 border border-border/30">
            <CardContent className="p-0">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">Classify My Stuff</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered image classification platform
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;