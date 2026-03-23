import { useState } from "react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { DocumentWorkspace } from "@/components/DocumentWorkspace";
import { FloatingChat } from "@/components/FloatingChat";

const Documents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Header />
      <main className="ml-20 pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary font-orbitron">DOCUMENTS</h1>
            <p className="text-muted-foreground font-share-tech">Manage project documentation, agreements, and quotes</p>
          </div>
          <DocumentWorkspace />
        </div>
      </main>
      <FloatingChat />
    </div>
  );
};

export default Documents;
