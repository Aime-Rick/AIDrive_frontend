import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, Trash2, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);

  useEffect(() => {
  const checkDriveConnection = async () => {
    try {
      const response = await api.get('/drive/connection-status');
      if (response.data.status === 'success') {
        const wasConnected = isDriveConnected;
        const isConnected = response.data.data.is_connected;
        setIsDriveConnected(isConnected);
        
        // Dispatch custom event when connection status changes
        if (wasConnected !== isConnected) {
          window.dispatchEvent(new CustomEvent('driveConnectionChanged', { 
            detail: { isConnected } 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
    } finally {
      setIsLoadingConnection(false);
    }
  };    checkDriveConnection();

    // Check for OAuth callback completion by listening to window focus
    const handleWindowFocus = () => {
      // Only recheck if we think drive is not connected
      if (!isDriveConnected) {
        checkDriveConnection();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isDriveConnected]);

  const handleConnectDrive = () => {
    window.location.href = 'http://localhost:8000/authorize';
  };

  const handleDisconnectDrive = async () => {
    try {
      const response = await api.delete('/drive/disconnect');
      if (response.data.status === 'success') {
        setIsDriveConnected(false);
        // Dispatch custom event when disconnected
        window.dispatchEvent(new CustomEvent('driveConnectionChanged', { 
          detail: { isConnected: false } 
        }));
        toast({ 
          title: "Drive Disconnected", 
          description: "Your Google Drive has been disconnected successfully." 
        });
      }
    } catch (error) {
      console.error('Failed to disconnect Drive:', error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: "Could not disconnect Google Drive. Please try again later.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to delete your account? This action is irreversible and all your data will be lost."
    );

    if (isConfirmed) {
      try {
        await api.delete(`/users/${user.id}`);
        toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
        signOut(); // This will clear local state and redirect
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: "Could not delete your account. Please try again later.",
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration</CardTitle>
          <CardDescription>
            Connect your Google Drive account to enable file management and AI assistant features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConnection ? (
            <Button disabled>
              <Link className="mr-2 h-4 w-4" /> Checking Connection...
            </Button>
          ) : isDriveConnected ? (
            <div className="space-y-2">
              <Button disabled variant="secondary">
                <CheckCircle className="mr-2 h-4 w-4" /> Connected
              </Button>
              <Button variant="outline" onClick={handleDisconnectDrive} className="w-full">
                Disconnect Google Drive
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectDrive}>
              <Link className="mr-2 h-4 w-4" /> Connect to Google Drive
            </Button>
          )}
        </CardContent>
      </Card>

      <Card border-destructive>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
