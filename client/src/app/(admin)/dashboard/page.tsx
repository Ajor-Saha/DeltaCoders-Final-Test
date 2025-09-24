"use client";

import { useState } from "react";
import { SubjectForm } from "../subjects/_components/subject-form";



export default function DashboardClient() {
  const [timeframe, setTimeframe] = useState("last-year");




  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Dashboard Header for PDF */}
          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-center mb-2">TaskForge Dashboard Report</h1>
            <p className="text-center text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            <p className="text-center text-gray-600">Timeframe: {timeframe}</p>
          </div>

          {/* Subject Learning Form */}

          <div className="w-full">
            <SubjectForm />
          </div>
        </div>
      </main>
    </div>
  );
}
