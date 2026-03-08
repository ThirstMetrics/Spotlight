export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAdminFieldMappings } from "@/lib/queries/admin";
import { FieldMappingTable } from "./FieldMappingTable";
import { FieldMappingDialog } from "./FieldMappingDialog";
import { Tag, Database, ArrowUpDown, CheckCircle2 } from "lucide-react";

export default async function FieldMappingsPage() {
  const mappings = await getAdminFieldMappings();

  // Serialize dates — these will be passed to a client component
  const serialized = mappings.map((m) => ({
    ...m,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
  }));

  // Derive metric card values
  const totalProfiles = serialized.length;
  const uniqueSources = new Set(serialized.map((m) => m.source)).size;
  const uniqueUploadTypes = new Set(serialized.map((m) => m.uploadType)).size;
  const avgColumnsPerProfile =
    totalProfiles > 0
      ? Math.round(
          serialized.reduce((sum, m) => sum + m.columnCount, 0) / totalProfiles
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-[#06113e] transition-colors"
          >
            Admin
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#06113e]">Field Mappings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Saved column mapping profiles for CSV/Excel data imports. Profiles are applied
              automatically during future uploads from the same source system.
            </p>
          </div>
          <FieldMappingDialog />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Profiles"
          value={totalProfiles}
          icon={<Tag className="h-5 w-5" />}
          subtitle={totalProfiles === 0 ? "Create your first profile" : "Saved mapping profiles"}
        />
        <MetricCard
          label="Source Systems"
          value={uniqueSources}
          icon={<Database className="h-5 w-5" />}
          subtitle={uniqueSources === 1 ? "source covered" : "sources covered"}
        />
        <MetricCard
          label="Upload Types"
          value={uniqueUploadTypes}
          icon={<ArrowUpDown className="h-5 w-5" />}
          subtitle={uniqueUploadTypes === 0 ? "No types yet" : "different data types"}
        />
        <MetricCard
          label="Avg. Columns Mapped"
          value={avgColumnsPerProfile > 0 ? avgColumnsPerProfile : "—"}
          icon={<CheckCircle2 className="h-5 w-5" />}
          subtitle={totalProfiles > 0 ? "columns per profile" : "No profiles yet"}
        />
      </div>

      {/* Mapping profiles table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#06113e]">Saved Profiles</CardTitle>
          <CardDescription>
            Column mapping profiles for each source system and upload type combination.
            These profiles are automatically applied when you upload a file from a known source,
            so you only need to configure the mapping once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serialized.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-600">
                No field mapping profiles yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Create a new profile to define how source file columns map to Spotlight
                schema fields. Once saved, profiles will be applied automatically during
                future uploads from the same source.
              </p>
              <div className="mt-4">
                <FieldMappingDialog />
              </div>
            </div>
          ) : (
            <FieldMappingTable data={serialized} />
          )}
        </CardContent>
      </Card>

      {/* Usage guide */}
      <Card className="border-dashed border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-600">How Field Mappings Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 space-y-2">
          <p>
            <span className="font-medium text-gray-700">1. Create a profile</span> — Use &quot;New Mapping Profile&quot;
            to define how a specific source system&apos;s column headers map to Spotlight&apos;s internal fields.
          </p>
          <p>
            <span className="font-medium text-gray-700">2. Upload data</span> — When you upload a file from the
            same source and type, Spotlight will automatically apply the saved mapping profile.
          </p>
          <p>
            <span className="font-medium text-gray-700">3. Review and adjust</span> — You can delete outdated
            profiles at any time. New profiles can be created if the source format changes.
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Supported sources: BirchStreet, Stratton Warren, Oracle, Micros, Agilysys, Toast, and custom formats.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
