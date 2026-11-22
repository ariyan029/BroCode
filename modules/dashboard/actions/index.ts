"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";
import JSZip from "jszip";

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("User Id is Required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId!,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
        await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,

          },
        },
      });
    }

     revalidatePath("/dashboard");
    return { success: true, isMarked: isChecked };
  } catch (error) {
       console.error("Error updating problem:", error);
    return { success: false, error: "Failed to update problem" };
  }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();

  try {
    const playground = await db.playground.findMany({
      where: {
        userId: user?.id,
      },
      include: {
        user: true,
        Starmark:{
            where:{
                userId:user?.id!
            },
            select:{
                isMarked:true
            }
        }
      },
    });

    return playground;
  } catch (error) {
    console.log(error);
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const user = await currentUser();

  const { template, title, description } = data;

  try {
    const playground = await db.playground.create({
      data: {
        title: title,
        description: description,
        template: template,
        userId: user?.id!,
      },
    });

    return playground;
  } catch (error) {
    console.log(error);
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  try {
    await db.playground.update({
      where: {
        id,
      },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const duplicateProjectById = async (id: string) => {
  try {
    const originalPlayground = await db.playground.findUnique({
      where: { id },
      // todo: add tempalte files
    });
    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,

        // todo: add template files
      },
    });

    revalidatePath("/dashboard");
    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating project:", error);
  }
};

export const getUserGithubRepos = async () => {
  const user = await currentUser();
  if (!user?.id) return { connected: false, repos: [] };

  const account = await db.account.findFirst({
    where: {
      userId: user.id,
      provider: "github",
    },
  });

  if (!account?.accessToken) {
    return { connected: false, repos: [] };
  }

  try {
    const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "User-Agent": "brocode-editor",
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn("GitHub API error fetching user repos:", res.status);
      return { connected: true, repos: [] };
    }

    const repos = (await res.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      default_branch: string;
      private: boolean;
      updated_at: string;
      language: string | null;
    }>;

    return {
      connected: true,
      repos: Array.isArray(repos)
        ? repos.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            url: r.html_url,
            defaultBranch: r.default_branch,
            isPrivate: r.private,
            updatedAt: r.updated_at,
            language: r.language,
          }))
        : [],
    };
  } catch (error) {
    console.error("Error fetching user GitHub repos:", error);
    return { connected: true, repos: [] };
  }
};

export const importGithubRepo = async (repoInput: string, branchName?: string) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("You must be signed in to import a repository");

  const account = await db.account.findFirst({
    where: {
      userId: user.id,
      provider: "github",
    },
  });

  let cleanInput = repoInput.trim().replace(/\.git$/, "").replace(/\/+$/, "");

  // If a full commit or tree URL was pasted, extract branch
  let detectedBranch = branchName?.trim() || "";
  const treeMatch = cleanInput.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)/);
  if (treeMatch) {
    detectedBranch = treeMatch[3];
    cleanInput = `https://github.com/${treeMatch[1]}/${treeMatch[2]}`;
  }

  const match = cleanInput.match(/(?:github\.com\/)?([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error("Invalid GitHub repository. Format: 'owner/repo' or 'https://github.com/owner/repo'");
  }

  const owner = match[1];
  const repo = match[2];

  const headers: Record<string, string> = {
    "User-Agent": "brocode-editor",
    Accept: "application/vnd.github.v3+json",
  };
  if (account?.accessToken) {
    headers["Authorization"] = `Bearer ${account.accessToken}`;
  }

  // Fetch repository metadata
  let repoData: { default_branch: string; name: string; description: string | null } | null = null;
  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });
    if (metaRes.ok) {
      repoData = await metaRes.json();
    }
  } catch (e) {
    console.warn("Could not fetch repo metadata:", e);
  }

  const branch = detectedBranch || repoData?.default_branch || "main";
  const repoTitle = repoData?.name || repo;
  const repoDesc = repoData?.description || `Imported from GitHub (${owner}/${repo})`;

  // Download repository zipball
  let zipBuffer: ArrayBuffer | null = null;

  if (account?.accessToken) {
    try {
      const apiZipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, {
        headers,
      });
      if (apiZipRes.ok) {
        zipBuffer = await apiZipRes.arrayBuffer();
      }
    } catch (e) {
      console.warn("Authenticated zipball fetch failed, trying public codeload:", e);
    }
  }

  if (!zipBuffer) {
    const codeloadUrls = [
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`,
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`,
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`,
    ];

    for (const url of codeloadUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          zipBuffer = await res.arrayBuffer();
          break;
        }
      } catch {
        // try next
      }
    }
  }

  if (!zipBuffer || zipBuffer.byteLength === 0) {
    throw new Error(
      `Could not download repository '${owner}/${repo}'. Ensure the repository exists and is accessible.`
    );
  }

  const zip = await JSZip.loadAsync(zipBuffer);
  const allPaths = Object.keys(zip.files);
  if (allPaths.length === 0) {
    throw new Error("Repository archive is empty");
  }

  const firstSlash = allPaths[0].indexOf("/");
  const prefix = firstSlash !== -1 ? allPaths[0].slice(0, firstSlash + 1) : "";

  const rootFolder: { folderName: string; items: any[] } = {
    folderName: "root",
    items: [],
  };

  const ignoredFolders = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo"]);
  const ignoredFiles = new Set([".DS_Store", "thumbs.db", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);

  let packageJsonContent: string | null = null;

  function getFolder(parent: any, name: string) {
    let folder = parent.items.find((i: any) => "folderName" in i && i.folderName === name);
    if (!folder) {
      folder = { folderName: name, items: [] };
      parent.items.push(folder);
    }
    return folder;
  }

  for (const relativePath of allPaths) {
    const file = zip.files[relativePath];
    if (file.dir) continue;

    const cleanPath = relativePath.startsWith(prefix) ? relativePath.slice(prefix.length) : relativePath;
    if (!cleanPath) continue;

    const parts = cleanPath.split("/");
    const fileNameWithExt = parts.pop()!;

    if (parts.some((p) => ignoredFolders.has(p))) continue;
    if (ignoredFiles.has(fileNameWithExt)) continue;

    let currentFolder = rootFolder;
    for (const part of parts) {
      currentFolder = getFolder(currentFolder, part);
    }

    const lastDot = fileNameWithExt.lastIndexOf(".");
    let filename = fileNameWithExt;
    let fileExtension = "";
    if (lastDot > 0) {
      filename = fileNameWithExt.slice(0, lastDot);
      fileExtension = fileNameWithExt.slice(lastDot + 1);
    }

    // Identify binary extensions
    const isBinary = /\.(png|jpe?g|gif|ico|webp|wasm|pdf|zip|tar|gz|exe|dll|so|dylib)$/i.test(fileNameWithExt);
    let content = "";
    if (!isBinary) {
      try {
        content = await file.async("string");
      } catch {
        content = "// Binary content";
      }
    } else {
      content = `// [Binary asset: ${fileNameWithExt}]`;
    }

    if (fileNameWithExt === "package.json" && parts.length === 0) {
      packageJsonContent = content;
    }

    currentFolder.items.push({
      filename,
      fileExtension,
      content,
    });
  }

  // Detect template type
  let template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR" = "REACT";
  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) template = "NEXTJS";
      else if (deps.vue) template = "VUE";
      else if (deps.express) template = "EXPRESS";
      else if (deps.hono) template = "HONO";
      else if (deps["@angular/core"]) template = "ANGULAR";
      else if (deps.react) template = "REACT";
    } catch {
      // keep default
    }
  }

  // Create playground in database
  const playground = await db.playground.create({
    data: {
      title: repoTitle,
      description: repoDesc,
      template,
      userId: user.id,
    },
  });

  // Save template file data
  await db.templateFile.create({
    data: {
      playgroundId: playground.id,
      content: JSON.stringify(rootFolder),
    },
  });

  revalidatePath("/dashboard");
  return { success: true, playgroundId: playground.id };
};
