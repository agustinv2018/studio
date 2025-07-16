"use client";

import { DashboardPage } from "@/components/dashboard-page";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";

export default function Home() {
    const { user } = useAuth();

    if (!user) {
        return null; // O un spinner de carga mientras se redirige
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
            <DashboardPage />
        </main>
        </div>
    );
}
