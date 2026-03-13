import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Terminal,
  Github,
  ChevronRight,
  ArrowLeft,
  Download,
  Star,
  Copy,
  Check,
  ExternalLink,
  Package,
  Shield,
  Zap,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { workflows, type Workflow } from "./data";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "workflow">("home");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflowId(id);
    setCurrentView("workflow");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentView("home");
    setSelectedWorkflowId(null);
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleBack}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-white tracking-tight text-lg group-hover:text-zinc-300 transition-colors">
              OpenCI
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Documentation
            </a>
            <button
              onClick={() => alert("Workflow submission portal coming soon!")}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Submit Workflow
            </button>
            <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {currentView === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero Section */}
              <div className="py-20 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  OpenCI v1.0 is now available
                </div>
                <div className="mb-10 w-full overflow-x-auto flex justify-center no-scrollbar">
                  <pre className="font-mono text-[0.55rem] sm:text-[0.7rem] md:text-xs lg:text-sm xl:text-base leading-tight text-white font-bold select-none text-left drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                    {` ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝`}
                  </pre>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6 max-w-2xl leading-snug">
                  AI Agents for your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
                    GitHub Workflows
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                  The easiest way to discover, install, and manage AI-powered GitHub Actions. Bring
                  Claude, Codex, and Gemini directly into your CI/CD pipeline.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                  <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Terminal className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                      placeholder="npx openci init"
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <CopyButton text="npx openci init" />
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                    Get Started
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-10 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-2xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all shadow-sm"
                    placeholder="Search for agents, reviewers, or automations..."
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  Featured Workflows
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onClick={() => handleSelectWorkflow(workflow.id)}
                  />
                ))}
              </div>

              {filteredWorkflows.length === 0 && (
                <div className="text-center py-20 text-zinc-500">
                  No workflows found matching "{searchQuery}"
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="workflow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedWorkflowId && (
                <WorkflowDetail
                  workflow={workflows.find((w) => w.id === selectedWorkflowId)!}
                  onBack={handleBack}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12 text-center text-zinc-500 text-sm">
        <p>OpenCI is an open-source project. Not affiliated with GitHub or Vercel.</p>
      </footer>
    </div>
  );
}

function WorkflowCard({ workflow, onClick }: { workflow: Workflow; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
        <ChevronRight className="w-5 h-5 text-zinc-400" />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <img
          src={workflow.avatar}
          alt={workflow.name}
          className="w-12 h-12 rounded-xl bg-white/10"
        />
        <div>
          <h3 className="font-semibold text-white text-lg tracking-tight">{workflow.name}</h3>
          <p className="text-sm text-zinc-500">{workflow.author}</p>
        </div>
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
        {workflow.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">{workflow.downloads}</span>
        </div>
        <div className="flex gap-2">
          {workflow.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-medium text-zinc-400 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowDetail({ workflow, onBack }: { workflow: Workflow; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to workflows
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <img
          src={workflow.avatar}
          alt={workflow.name}
          className="w-24 h-24 rounded-2xl bg-white/10 shrink-0"
        />
        <div className="flex-grow">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {workflow.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {workflow.author}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {workflow.downloads} installs
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              4.9
            </span>
          </div>
          <p className="text-lg text-zinc-300 leading-relaxed max-w-2xl">{workflow.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Installation */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Installation
            </h2>
            <div className="bg-[#111111] border border-white/10 rounded-xl p-4 flex items-center justify-between group">
              <code className="text-sm text-emerald-400 font-mono">{workflow.command}</code>
              <CopyButton text={workflow.command} />
            </div>
          </section>

          {/* Configuration */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Configuration Example
            </h2>
            <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden relative group">
              <div className="absolute top-3 right-3">
                <CopyButton text={workflow.yaml} />
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300">
                <code>{workflow.yaml}</code>
              </pre>
            </div>
          </section>

          {/* Readme */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Documentation
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none bg-white/[0.02] border border-white/10 rounded-xl p-6">
              {/* Simple markdown rendering for prototype */}
              {workflow.readme.split("\n").map((line, i) => {
                if (line.startsWith("# "))
                  return (
                    <h1 key={i} className="text-2xl font-bold text-white mb-4">
                      {line.replace("# ", "")}
                    </h1>
                  );
                if (line.startsWith("## "))
                  return (
                    <h2 key={i} className="text-xl font-semibold text-white mt-6 mb-3">
                      {line.replace("## ", "")}
                    </h2>
                  );
                if (line.startsWith("- "))
                  return (
                    <li key={i} className="ml-4 text-zinc-300 mb-1">
                      {line.replace("- ", "")}
                    </li>
                  );
                if (line.trim() === "") return <br key={i} />;
                return (
                  <p key={i} className="text-zinc-300 mb-4">
                    {line}
                  </p>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">About</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-500 block mb-1">Categories</span>
                <div className="flex flex-wrap gap-2">
                  {workflow.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-medium text-zinc-300 uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">License</span>
                <span className="text-zinc-300">MIT</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Links</span>
                <a
                  href="#"
                  className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Repository
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}
