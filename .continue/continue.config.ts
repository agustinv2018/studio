import { z } from "zod";
export interface ContinueConfig {
  agents: {
    id: string;
    name: string;
    description: string;
    prompt: string;
  }[];
}

export const config: ContinueConfig = {
  agents: [
    {
      id: "frontend",
      name: "FrontendBot",
      description: "Experto en React y Tailwind",
      prompt:
        "Sos un desarrollador frontend experto. Tu trabajo es implementar interfaces limpias, accesibles y eficientes utilizando React, Tailwind y buenas prácticas UX.",
    },
    {
      id: "backend",
      name: "BackendBot",
      description: "Node.js y API specialist",
      prompt:
        "Actuás como un ingeniero backend enfocado en Node.js, API REST seguras y limpias, y optimización de lógica del lado del servidor.",
    },
    {
      id: "security",
      name: "SecurityBot",
      description: "Auditor de seguridad (frontend y backend)",
      prompt:
        "Tu rol es auditar y proponer mejoras de seguridad tanto en frontend como backend. Tenés en cuenta OWASP Top 10, sanitización de datos, control de acceso, y gestión segura de tokens y claves.",
    },
  ],
};
