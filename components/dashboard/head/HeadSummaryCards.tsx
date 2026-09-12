import React from "react";
import { Users, MapPin, FileCheck2, Boxes } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { prisma } from "@/lib/database/prisma";

export const HeadSummaryCards: React.FC = async () => {
  // Query real database records only; zero fake production statistics
  let farmerCount = 0;
  let parcelCount = 0;
  let damageReportCount = 0;
  let inventoryItemCount = 0;

  try {
    [farmerCount, parcelCount, damageReportCount, inventoryItemCount] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmParcel.count(),
      prisma.damageReport.count(),
      prisma.inventoryItem.count(),
    ]);
  } catch (error) {
    console.error("Database query notice in HeadSummaryCards:", error);
  }

  const cards = [
    {
      title: "Beneficiaries (RSBSA)",
      count: farmerCount,
      label: farmerCount > 0 ? "Baseline records" : "No records enrolled",
      icon: Users,
      badge: "Objective 1",
      variant: "default" as const,
      subtext: "Synthetic Demonstration Data — Baseline",
    },
    {
      title: "Registered Farm Parcels",
      count: parcelCount,
      label: parcelCount > 0 ? "Baseline plots" : "No parcels mapped",
      icon: MapPin,
      badge: "Objective 1 & 2",
      variant: "info" as const,
      subtext: "Synthetic Demonstration Data — Baseline",
    },
    {
      title: "Crop Loss / PCIC Dockets",
      count: damageReportCount,
      label: damageReportCount > 0 ? "Baseline dockets" : "No claims filed",
      icon: FileCheck2,
      badge: "Objective 6",
      variant: "warning" as const,
      subtext: "Pending Phase Activation",
    },
    {
      title: "Inventory Catalog Items",
      count: inventoryItemCount,
      label: inventoryItemCount > 0 ? "Baseline catalog" : "No items cataloged",
      icon: Boxes,
      badge: "Objective 4",
      variant: "neutral" as const,
      subtext: "Pending Phase Activation",
    },
  ];

  return (
    <section aria-labelledby="executive-kpi-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="executive-kpi-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Executive Oversight Summary
        </h2>
        <span className="text-[11px] text-amber-700 font-medium">
          Synthetic Demonstration Data — Not Actual OMAG Records
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden border-slate-200">
              <CardHeader className="mb-2">
                <CardTitle className="text-xs font-semibold text-slate-600 truncate pr-2">
                  {card.title}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {card.count}
                  </span>
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {card.label}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate">{card.subtext}</span>
                  <Badge variant={card.variant} size="sm">
                    {card.badge}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
