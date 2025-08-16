import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HistoryItem } from '@/components/ImageHistory';

interface ClassificationResult {
  label: string;
  score: number;
}

interface AppContextType {
  user: any;
  selectedImage: string | null;
  fileName: string;
  results: ClassificationResult[];
  history: HistoryItem[];
  selectedModel: string;
  isLoading: boolean;
  loadingProgress: number;
  setSelectedImage: (image: string | null) => void;
  setFileName: (name: string) => void;
  setResults: (results: ClassificationResult[]) => void;
  setSelectedModel: (model: string) => void;
  classifyImage: (imageUrl: string, fileName?: string) => Promise<void>;
  addToHistory: (item: HistoryItem) => void;
  toggleFavorite: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const uploadFile = async (file: File) => {
    const bucketName = 'classify-my-stuff';
    const filePath = `images/${Date.now()}-${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file:', error.message);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (err) {
      console.error('An unexpected error occurred during upload:', err);
      return null;
    }
  };

  const classifyImage = useCallback(async (imageUrl: string, fileName: string = 'uploaded-image') => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setLoadingProgress(0);

      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const predictions = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;

      setResults(predictions as ClassificationResult[]);

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl,
        fileName,
        timestamp: new Date(),
        results: predictions as ClassificationResult[],
        modelUsed: 'VGG19 (Server)',
      };

      setHistory(prev => [historyItem, ...prev]);

      toast({
        title: "Analysis Complete!",
        description: `Classified with VGG19 (Server) in ${processingTime.toFixed(1)}s`,
      });
    } catch (error) {
      console.error("Classification error:", error);
      toast({
        title: "Classification Failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  }, [toast]);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error signing you out.",
        variant: "destructive"
      });
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      selectedImage,
      fileName,
      results,
      history,
      selectedModel,
      isLoading,
      loadingProgress,
      setSelectedImage,
      setFileName,
      setResults,
      setSelectedModel,
      classifyImage,
      addToHistory,
      toggleFavorite,
      deleteHistoryItem,
      handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
};