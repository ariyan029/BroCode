"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Github,
  GitBranch,
  Loader2,
  FolderGit2,
  Lock,
  Globe,
  Search,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { getUserGithubRepos, importGithubRepo } from "../actions";

interface OpenRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  updatedAt: string;
  language: string | null;
}

export default function OpenRepoModal({ isOpen, onClose }: OpenRepoModalProps) {
  const router = useRouter();

  // Tab 1 state
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Tab 2 state
  const [userRepos, setUserRepos] = useState<UserRepo[]>([]);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUserRepos();
    }
  }, [isOpen]);

  const loadUserRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const res = await getUserGithubRepos();
      setIsGitHubConnected(res.connected);
      setUserRepos(res.repos || []);
    } catch (e) {
      console.warn("Could not load user repos:", e);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleImport = async (targetRepo: string, targetBranch?: string) => {
    if (!targetRepo.trim()) {
      toast.error("Please enter a repository URL or name");
      return;
    }

    setIsImporting(true);
    setImportStatus("Downloading repository archive...");

    try {
      setImportStatus("Extracting files & configuring workspace...");
      const res = await importGithubRepo(targetRepo, targetBranch);

      if (res?.success && res.playgroundId) {
        toast.success("Repository opened successfully!");
        onClose();
        router.push(`/playground/${res.playgroundId}`);
      } else {
        throw new Error("Failed to create playground from repository");
      }
    } catch (error: any) {
      console.error("Repository import error:", error);
      toast.error(error.message || "Failed to open repository");
    } finally {
      setIsImporting(false);
      setImportStatus("");
    }
  };

  const filteredRepos = userRepos.filter((r) =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isImporting && !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Open GitHub Repository</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Import any public or private repository directly into the BroCode editor
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full">
          <div className="px-6 border-b">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="url" className="text-xs">
                Repository URL
              </TabsTrigger>
              <TabsTrigger value="user-repos" className="text-xs flex items-center gap-1.5">
                Your Repositories
                {userRepos.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                    {userRepos.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Paste URL */}
          <TabsContent value="url" className="p-6 space-y-4 focus-visible:outline-none">
            <div className="space-y-2">
              <Label htmlFor="repo-url" className="text-sm font-medium">
                GitHub Repository URL or Shorthand
              </Label>
              <Input
                id="repo-url"
                placeholder="e.g. https://github.com/facebook/react or owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isImporting}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste any standard GitHub repository link, tree branch URL, or owner/repo name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> Branch (Optional)
              </Label>
              <Input
                id="branch"
                placeholder="main (defaults to repository default branch)"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isImporting}
                className="font-mono text-xs"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="pt-2">
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Try popular examples:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "octocat/Hello-World", desc: "Starter" },
                  { name: "octocat/Spoon-Knife", desc: "Demo" },
                ].map((item) => (
                  <Button
                    key={item.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5"
                    disabled={isImporting}
                    onClick={() => {
                      setRepoUrl(item.name);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#e93f3f] hover:bg-[#d63333] text-white flex items-center gap-1.5"
                onClick={() => handleImport(repoUrl, branch)}
                disabled={isImporting || !repoUrl.trim()}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{importStatus || "Importing..."}</span>
                  </>
                ) : (
                  <>
                    <span>Open in Editor</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: User Repositories */}
          <TabsContent value="user-repos" className="p-6 space-y-4 focus-visible:outline-none">
            {isLoadingRepos ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-[#e93f3f]" />
                <p className="text-xs">Fetching your repositories from GitHub...</p>
              </div>
            ) : !isGitHubConnected ? (
              <div className="border border-dashed rounded-lg p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Github className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">GitHub Account Not Linked</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Sign in with GitHub to automatically view and 1-click import all your personal and organization repositories.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can still open any public repository using the <strong>Repository URL</strong> tab!
                </p>
              </div>
            ) : userRepos.length === 0 ? (
              <div className="border border-dashed rounded-lg p-6 text-center text-xs text-muted-foreground">
                No repositories found on your GitHub account.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search your repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isImporting}
                  />
                </div>

                <ScrollArea className="h-64 border rounded-md p-2">
                  <div className="space-y-1.5">
                    {filteredRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="group flex items-center justify-between p-2.5 rounded-md hover:bg-muted/70 border border-transparent hover:border-border transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate hover:underline">
                              {repo.name}
                            </span>
                            {repo.isPrivate ? (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5 text-amber-500 border-amber-500/30">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5 text-muted-foreground">
                                <Globe className="w-2.5 h-2.5" /> Public
                              </Badge>
                            )}
                            {repo.language && (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                • {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {repo.description}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 hover:bg-[#e93f3f] hover:text-white hover:border-[#e93f3f] transition-colors shrink-0"
                          disabled={isImporting}
                          onClick={() => handleImport(repo.fullName, repo.defaultBranch)}
                        >
                          {isImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Open"
                          )}
                        </Button>
                      </div>
                    ))}
                    {filteredRepos.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        No repositories match your search.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end border-t mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isImporting}
              >
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
