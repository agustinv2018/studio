function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  const replacements = [
    // UI (ya aplicado)
    { pattern: /from\s+["'](\.\.\/)+ui\/([^"']+)["']/g, replace: (f) => `from "@/components/ui/${f}"` },

    // Internos del dashboard
    { pattern: /from\s+["']\.\/add-asset-dialog["']/g, replace: () => `from "@/components/shared/add-asset-dialog"` },
    { pattern: /from\s+["']\.\/ai-disposal-prompt-dialog["']/g, replace: () => `from "@/components/dashboard/ai-disposal-prompt-dialog"` },
    { pattern: /from\s+["']\.\/ui\/skeleton["']/g, replace: () => `from "@/components/ui/skeleton"` },

    // Corrección de ubicaciones de componentes renombrados
    { pattern: /from\s+["']@\/components\/asset-table["']/g, replace: () => `from "@/components/dashboard/asset-table"` },
    { pattern: /from\s+["']@\/components\/dashboard-page["']/g, replace: () => `from "@/components/dashboard/dashboard-page"` },

    // Flujos de IA
    { pattern: /from\s+["']@\/ai\/flows\/prompt-disposal["']/g, replace: () => `from "@/ai/flows/prompt-disposal"` },
  ];

  replacements.forEach(({ pattern, replace }) => {
    content = content.replace(pattern, (match, _g1, g2) => replace(g2));
  });

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("✅ Fixed:", filePath);
}
