import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { HardDrive, Folder, FileText, Upload, FolderPlus, Loader2, RefreshCw, Search, X, Settings, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

const DrivePage = () => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [folderHistory, setFolderHistory] = useState<Array<{id: string, name: string}>>([{id: "root", name: "My Drive"}]);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean | null>(null); // null = checking, true = connected, false = not connected
  const { toast } = useToast();

  const fetchFiles = useCallback(async (folderId: string = "root") => {
    setIsLoading(true);
    try {
      const response = await api.get(`/drive/files?folder_id=${folderId}`);
      if (response.data.status === 'success') {
        const fetchedFiles = response.data.data || [];
        setAllFiles(fetchedFiles);
        setFiles(fetchedFiles);
        setSearchQuery(""); // Clear search when navigating folders
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch files." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to the server." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkDriveConnectionStatus = useCallback(async () => {
    try {
      console.log('Checking Google Drive connection status...');
      const response = await api.get('/drive/connection-status');
      console.log('Drive connection response:', response.data);
      
      if (response.data.status === 'success') {
        const isConnected = response.data.data.is_connected;
        console.log('Drive is connected:', isConnected);
        setIsDriveConnected(isConnected);
        
        // Only fetch files if Drive is connected
        if (isConnected) {
          fetchFiles(currentFolderId);
        } else {
          setIsLoading(false);
        }
      } else {
        console.log('Drive connection check failed - response not successful');
        setIsDriveConnected(false);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.log('Drive connection check failed:', error.response?.data?.detail || error.message);
      setIsDriveConnected(false);
      setIsLoading(false);
    }
  }, [fetchFiles, currentFolderId]);

  useEffect(() => {
    checkDriveConnectionStatus();
    
    // Listen for drive connection changes from settings page
    const handleDriveConnectionChange = (event: CustomEvent) => {
      const { isConnected } = event.detail;
      console.log('Drive connection status changed:', isConnected);
      setIsDriveConnected(isConnected);
      
      if (isConnected) {
        // Fetch files when drive is connected
        fetchFiles(currentFolderId);
      }
    };

    window.addEventListener('driveConnectionChanged', handleDriveConnectionChange as EventListener);
    
    return () => {
      window.removeEventListener('driveConnectionChanged', handleDriveConnectionChange as EventListener);
    };
  }, [checkDriveConnectionStatus, fetchFiles, currentFolderId]);

  useEffect(() => {
    // Only fetch files if Drive is connected and we're not checking connection status
    if (isDriveConnected === true) {
      fetchFiles(currentFolderId);
    }
  }, [fetchFiles, currentFolderId, isDriveConnected]);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiles(allFiles);
    } else {
      const filtered = allFiles.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFiles(filtered);
    }
  }, [searchQuery, allFiles]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderHistory(prev => [...prev, {id: folderId, name: folderName}]);
  };

  const navigateToBreadcrumb = (targetIndex: number) => {
    const targetFolder = folderHistory[targetIndex];
    setCurrentFolderId(targetFolder.id);
    setFolderHistory(prev => prev.slice(0, targetIndex + 1));
  };

  const refreshCurrentFolder = () => {
    if (isDriveConnected) {
      fetchFiles(currentFolderId);
    } else {
      checkDriveConnectionStatus();
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Folder name cannot be empty." });
      return;
    }

    setIsCreatingFolder(true);
    try {
      const response = await api.post("/drive/folder", { 
        folder_name: folderName.trim(),
        parent_folder_id: currentFolderId
      });
      if (response.data.status === 'success') {
        toast({ title: "Success", description: `Folder "${folderName}" created.` });
        setFolderName("");
        setIsCreateFolderOpen(false);
        fetchFiles(currentFolderId);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to create folder." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred while creating the folder." });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', currentFolderId);

      const response = await api.post("/drive/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        toast({ title: "Success", description: `"${file.name}" uploaded successfully.` });
        fetchFiles(currentFolderId);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to upload file." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred while uploading the file." });
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };
  
  const handleProcessFile = async (fileId: string, fileName: string) => {
    setIsProcessing(fileId);
    try {
      const response = await api.post("/drive/download", { file_id: fileId });
      if (response.data.status === 'success') {
        toast({ title: "Processing Started", description: `"${fileName}" is being processed and loaded.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to process file." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred while processing the file." });
    } finally {
      setIsProcessing(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Drive</h1>
        <p className="text-muted-foreground">Manage your files and folders from Google Drive.</p>
        
        {/* Breadcrumb Navigation - only show if Drive is connected */}
        {isDriveConnected === true && (
          <div className="flex items-center space-x-2 mt-4 text-sm">
            {folderHistory.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-primary transition-colors ${
                    index === folderHistory.length - 1 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Show loading state while checking drive connection */}
      {isDriveConnected === null && (
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center py-12">
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
              To access your files and manage your Google Drive, you need to connect your account first.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Why Connect Google Drive?</h3>
              <ul className="text-muted-foreground max-w-md space-y-1 text-left">
                <li>• Browse and manage your Google Drive files</li>
                <li>• Upload new files directly to your Drive</li>
                <li>• Create and organize folders</li>
                <li>• Process files for AI assistance</li>
                <li>• Seamless integration with all features</li>
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
      
      {/* Search Bar and File Explorer - only show if Drive is connected */}
      {isDriveConnected === true && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>File Explorer</CardTitle>
              <CardDescription>
                {searchQuery ? (
                  `Showing ${files.length} file(s) matching "${searchQuery}"`
                ) : (
                  "Browse and manage your connected Google Drive."
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshCurrentFolder} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new folder. It will be created in your Google Drive.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="folder-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="folder-name"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        className="col-span-3"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isCreatingFolder) {
                            handleCreateFolder();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateFolderOpen(false);
                        setFolderName("");
                      }}
                      disabled={isCreatingFolder}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder || !folderName.trim()}
                    >
                      {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                disabled={isUploading}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" /> Upload File
              </Button>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="*/*"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Loading your files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No files found</h3>
                  <p className="text-muted-foreground">No files or folders match your search "{searchQuery}".</p>
                  <Button 
                    variant="outline" 
                    onClick={clearSearch} 
                    className="mt-4"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <HardDrive className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No files found</h3>
                  <p className="text-muted-foreground">Your drive appears to be empty. Try uploading a file.</p>
                </>
              )}
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="bg-muted rounded-t-md">
                <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3">Last Modified</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="divide-y">
                  {files.map((file) => (
                    <div key={file.id} className="grid grid-cols-12 gap-3 p-3 hover:bg-accent text-sm items-center">
                      <div className="col-span-1">{getFileIcon(file.mimeType)}</div>
                      <div className="col-span-5 font-medium truncate" title={file.name}>
                        {file.mimeType.includes('folder') ? (
                          <button
                            onClick={() => navigateToFolder(file.id, file.name)}
                            className="text-left hover:text-primary transition-colors cursor-pointer w-full"
                          >
                            {file.name}
                          </button>
                        ) : (
                          file.name
                        )}
                      </div>
                      <div className="col-span-3 text-muted-foreground">
                        {file.modifiedTime ? (
                          (() => {
                            const date = new Date(file.modifiedTime);
                            return !isNaN(date.getTime()) ? format(date, "MMM dd, yyyy 'at' p") : "Unknown";
                          })()
                        ) : "Unknown"}
                      </div>
                      <div className="col-span-3 text-right">
                        {!file.mimeType.includes('folder') && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleProcessFile(file.id, file.name)}
                             disabled={isProcessing === file.id}
                           >
                             {isProcessing === file.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Process for AI
                           </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default DrivePage;
