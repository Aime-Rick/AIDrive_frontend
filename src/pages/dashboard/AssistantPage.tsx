import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { Bot, User, Send, Loader2, BrainCircuit, Settings, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! How can I help you with your documents today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null); // null = checking, true = initialized, false = not initialized
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean | null>(null); // null = checking, true = connected, false = not connected
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    checkDriveConnectionStatus(); // Check drive connection first
    
    // Listen for drive connection changes from settings page
    const handleDriveConnectionChange = (event: CustomEvent) => {
      const { isConnected } = event.detail;
      console.log('Drive connection status changed:', isConnected);
      setIsDriveConnected(isConnected);
      
      if (isConnected) {
        // Reset database initialization status when drive is connected
        setIsInitialized(null);
        checkInitializationStatus(true);
      }
    };

    window.addEventListener('driveConnectionChanged', handleDriveConnectionChange as EventListener);
    
    return () => {
      window.removeEventListener('driveConnectionChanged', handleDriveConnectionChange as EventListener);
    };
  }, []); // Check on component mount

  // Also check when the component becomes visible/focused, but with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only check if we're not already in a loading state and if drive connection status is known
        if (isDriveConnected !== null) {
          console.log('Debounced status check triggered');
          if (isDriveConnected) {
            checkInitializationStatus(false); // Don't force check on visibility change
          }
        }
      }, 500); // Wait 500ms before checking
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isDriveConnected !== null) {
        console.log('Tab became visible, checking status');
        debouncedCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDriveConnected, isInitialized]); // Depend on isDriveConnected and isInitialized to avoid unnecessary checks

  const checkDriveConnectionStatus = async () => {
    try {
      console.log('Checking Google Drive connection status...');
      const response = await api.get('/drive/connection-status');
      console.log('Drive connection response:', response.data);
      
      if (response.data.status === 'success') {
        const isConnected = response.data.data.is_connected;
        console.log('Drive is connected:', isConnected);
        setIsDriveConnected(isConnected);
        
        // Only check database status if Drive is connected
        if (isConnected) {
          checkInitializationStatus(true); // Force check after Drive connection confirmed
        }
      } else {
        console.log('Drive connection check failed - response not successful');
        setIsDriveConnected(false);
      }
    } catch (error: any) {
      console.log('Drive connection check failed:', error.response?.data?.detail || error.message);
      setIsDriveConnected(false);
    }
  };

  const checkInitializationStatus = async (forceCheck = false) => {
    try {
      // If we're not forcing a check and localStorage says it's initialized, trust it temporarily
      const hasInitialized = localStorage.getItem('db_initialized');
      if (!forceCheck && hasInitialized === 'true' && isInitialized === true) {
        console.log('Using cached initialization status');
        return;
      }

      // Always check with the server for the most up-to-date status
      console.log('Checking database status...');
      const response = await api.get('/vector-db/status');
      console.log('Database status response:', response.data);
      
      if (response.data.status === 'success') {
        const isInitialized = response.data.data.is_initialized;
        console.log('Database is initialized:', isInitialized);
        setIsInitialized(isInitialized);
        if (isInitialized) {
          localStorage.setItem('db_initialized', 'true');
        } else {
          localStorage.removeItem('db_initialized');
        }
      } else {
        console.log('Database status check failed - response not successful');
        setIsInitialized(false);
        localStorage.removeItem('db_initialized');
      }
    } catch (error: any) {
      // If the check fails, assume database needs initialization
      console.log('Database status check failed:', error.response?.data?.detail || error.message);
      setIsInitialized(false);
      localStorage.removeItem('db_initialized');
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const response = await api.post('/vector-db/initialize');
      if (response.data.status === 'success') {
        localStorage.setItem('db_initialized', 'true');
        setIsInitialized(true);
        toast({
          title: "Success",
          description: `Database initialized successfully with ${response.data.data.total_files || 0} files! You can now start chatting with your documents.`,
        });
      } else {
        throw new Error("Initialization failed");
      }
    } catch (error: any) {
      console.error('Database initialization failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to initialize the database. Please try again.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/rag/query', { query: input });
      if (response.data.status === 'success' && response.data.data.answer) {
        const assistantMessage: Message = { role: 'assistant', content: response.data.data.answer };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the assistant.",
      });
      // Optional: remove the user's message if the API call fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-h-screen overflow-hidden">
      <header className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Chat with your documents and get intelligent answers.</p>
      </header>

      {/* Show loading state while checking drive connection */}
      {isDriveConnected === null && (
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Checking Google Drive connection...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Drive connection prompt when not connected */}
      {isDriveConnected === false && (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LinkIcon className="h-6 w-6" />
              Connect Google Drive
            </CardTitle>
            <CardDescription>
              To use the AI Assistant, you need to connect your Google Drive account first. This allows us to access and process your documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Why Connect Google Drive?</h3>
              <ul className="text-muted-foreground max-w-md space-y-1 text-left">
                <li>• Access your documents for intelligent search</li>
                <li>• Chat with your files using AI</li>
                <li>• Get insights from your document collection</li>
                <li>• Manage your files seamlessly</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 items-center">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You'll be redirected to the Settings page where you can connect your Google Drive account safely and securely.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show loading state while checking initialization (only if Drive is connected) */}
      {isDriveConnected === true && isInitialized === null && (
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Checking database status...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show initialization interface for connected users with uninitialized database */}
      {isDriveConnected === true && isInitialized === false && (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <BrainCircuit className="h-6 w-6" />
              Welcome to AI Assistant
            </CardTitle>
            <CardDescription>
              It looks like this is your first time using the assistant. We need to initialize the database with your documents to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Initialize Database</h3>
              <p className="text-muted-foreground max-w-md">
                This will process all your Google Drive documents and prepare them for intelligent search and chat.
              </p>
            </div>
            <Button 
              onClick={initializeDatabase} 
              disabled={isInitializing}
              size="lg"
              className="min-w-[200px]"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Initialize Database
                </>
              )}
            </Button>
            {isInitializing && (
              <p className="text-sm text-muted-foreground">
                This may take a few minutes depending on the number of documents...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show normal chat interface for users with connected Drive and initialized database */}
      {isDriveConnected === true && isInitialized === true && (
        <Card className="flex-1 flex flex-col max-h-[calc(100vh-12rem)]">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Chat Interface</CardTitle>
            <CardDescription>Ask questions about the files you've processed.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            <div ref={scrollAreaRef} className="flex-1 space-y-4 overflow-y-auto pr-4 min-h-0 max-h-[60vh]">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`p-3 rounded-lg max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: ({ children, ...props }) => (
                              <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            ),
                            pre: ({ children, ...props }) => (
                              <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-2" {...props}>
                                {children}
                              </pre>
                            ),
                            a: ({ children, href, ...props }) => (
                              <a 
                                href={href} 
                                className="text-blue-600 underline hover:text-blue-800" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                            h1: ({ children, ...props }) => (
                              <h1 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h1>
                            ),
                            h2: ({ children, ...props }) => (
                              <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>{children}</h2>
                            ),
                            h3: ({ children, ...props }) => (
                              <h3 className="text-base font-semibold mt-3 mb-1" {...props}>{children}</h3>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="list-disc list-inside my-2 space-y-1" {...props}>{children}</ul>
                            ),
                            ol: ({ children, ...props }) => (
                              <ol className="list-decimal list-inside my-2 space-y-1" {...props}>{children}</ol>
                            ),
                            li: ({ children, ...props }) => (
                              <li className="ml-2" {...props}>{children}</li>
                            ),
                            p: ({ children, ...props }) => (
                              <p className="my-1" {...props}>{children}</p>
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                   {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted flex items-center">
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    </div>
                  </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t flex-shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssistantPage;
