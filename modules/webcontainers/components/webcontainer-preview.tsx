"use client";
import React, { useEffect, useState, useRef } from "react";

import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import TerminalComponent from "./terminal";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean; // Optional prop to force re-setup
}
const WebContainerPreview = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  writeFileSync,
  forceResetup = false,
}: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  const terminalRef = useRef<any>(null);

  // Reset setup state when forceResetup changes
  useEffect(() => {
    if (forceResetup) {
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
    }
  }, [forceResetup]);

  useEffect(() => {
    async function setupContainer() {
      if (!instance || isSetupComplete || isSetupInProgress) return;

      try {
        setIsSetupInProgress(true);
        setSetupError(null);

        try {
          const packageJsonExists = await instance.fs.readFile(
            "package.json",
            "utf8"
          );

          if (packageJsonExists) {
            // Files are already mounted, just reconnect to existing server
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "🔄 Reconnecting to existing WebContainer session...\r\n"
              );
            }

            instance.on("server-ready", (port: number, url: string) => {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  `🌐 Reconnected to server at ${url}\r\n`
                );
              }

              setPreviewUrl(url);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
            });

            setCurrentStep(4);
            setLoadingState((prev) => ({ ...prev, starting: true }));
            return;
          }
        } catch (error) {}

        // Step-1 transform data
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        // Write to terminal
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🔄 Transforming template data...\r\n"
          );
        }

        // @ts-ignore
        const files = transformToWebContainerFormat(templateData);
        setLoadingState((prev) => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);

        //  Step-2 Mount Files

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "📁 Mounting files to WebContainer...\r\n"
          );
        }
        await instance.mount(files);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "✅ Files mounted successfully\r\n"
          );
        }

        // Check for package.json and determine project type
        let hasPackageJson = false;
        let packageJson: any = null;
        try {
          const rawPkg = await instance.fs.readFile("package.json", "utf8");
          packageJson = JSON.parse(rawPkg);
          hasPackageJson = true;
        } catch {
          hasPackageJson = false;
        }

        const isStaticSite = !hasPackageJson;

        // Static HTTP server script for pure HTML/CSS/JS projects without a server
        const staticServerScript = `const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  try {
    reqPath = decodeURIComponent(reqPath);
  } catch (e) {}

  let targetPath = path.join(__dirname, reqPath);

  try {
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, 'index.html');
    }
  } catch (e) {}

  if (!fs.existsSync(targetPath)) {
    // Check root index.html as fallback
    const rootIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(rootIndex)) {
      targetPath = rootIndex;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1><p>File not found: ' + reqPath + '</p>');
      return;
    }
  }

  const ext = String(path.extname(targetPath)).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(targetPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Static web server running at http://localhost:' + PORT);
});
`;

        if (isStaticSite) {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "📄 No package.json found (static HTML/CSS site detected).\r\n🛠️  Configuring built-in static web server...\r\n"
            );
          }

          try {
            await instance.fs.writeFile("server.js", staticServerScript);
            packageJson = {
              name: "static-html-site",
              version: "1.0.0",
              private: true,
              scripts: {
                start: "node server.js",
                serve: "npx -y serve .",
              },
            };
            await instance.fs.writeFile(
              "package.json",
              JSON.stringify(packageJson, null, 2)
            );
          } catch (e) {
            console.error("Failed to write static server files:", e);
          }
        } else if (
          packageJson &&
          (!packageJson.scripts ||
            (!packageJson.scripts.start &&
              !packageJson.scripts.dev &&
              !packageJson.scripts.serve))
        ) {
          try {
            await instance.fs.writeFile("server.js", staticServerScript);
            if (!packageJson.scripts) packageJson.scripts = {};
            packageJson.scripts.start = "node server.js";
            await instance.fs.writeFile(
              "package.json",
              JSON.stringify(packageJson, null, 2)
            );
          } catch (e) {}
        }

        // Determine start command (start -> dev -> serve -> start)
        let startArgs = ["run", "start"];
        if (packageJson?.scripts?.start) {
          startArgs = ["run", "start"];
        } else if (packageJson?.scripts?.dev) {
          startArgs = ["run", "dev"];
        } else if (packageJson?.scripts?.serve) {
          startArgs = ["run", "serve"];
        }

        setLoadingState((prev) => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);

        // Step-3 Install dependencies
        if (isStaticSite) {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "⚡ Static site: zero dependencies needed. Ready to serve!\r\n"
            );
          }
        } else {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "📦 Installing dependencies...\r\n"
            );
          }

          const installProcess = await instance.spawn("npm", ["install"]);

          installProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                if (terminalRef.current?.writeToTerminal) {
                  terminalRef.current.writeToTerminal(data);
                }
              },
            })
          );

          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            throw new Error(
              `Failed to install dependencies. Exit code: ${installExitCode}`
            );
          }

          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "✅ Dependencies installed successfully\r\n"
            );
          }
        }

        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);

        // STEP-4 Start The Server

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            `🚀 Starting development server (npm ${startArgs.join(" ")})...\r\n`
          );
        }

        const startProcess = await instance.spawn("npm", startArgs);

        instance.on("server-ready", (port: number, url: string) => {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `🌐 Server ready at ${url}\r\n`
            );
          }
          setPreviewUrl(url);
          setLoadingState((prev) => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        // Handle start process output - stream to terminal
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(`❌ Error: ${errorMessage}\r\n`);
        }
        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
      }
    }

    setupContainer();
  }, [instance, templateData, isSetupComplete, isSetupInProgress]);

  useEffect(() => {
    return () => {};
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }
  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
            ? "text-blue-600"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title="WebContainer Preview"
            />
          </div>

          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
