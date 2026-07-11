import Link from "next/link";
import { getSiteStats } from "@/lib/db/queries/collections";
import { LayersIcon, DatabaseIcon, UploadIcon, GlobeIcon, PencilIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getSiteStats();
  const sections = [
    {
      href: "/admin/collections",
      icon: LayersIcon,
      title: "Colecții",
      desc: "Listează, editează și șterge colecții",
      stat: `${stats.collections} colecții`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/admin/items",
      icon: DatabaseIcon,
      title: "Items",
      desc: "Gestionează planșe, hărți și alte items",
      stat: `${stats.items} items`,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      href: "/admin/ingest",
      icon: UploadIcon,
      title: "Import CSV",
      desc: "Importă colecții și items din fișiere CSV",
      stat: null,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panou administrare</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestionează conținutul aplicației geo-spatial.org Explorer</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Colecții", value: stats.collections, icon: LayersIcon },
          { label: "Items totali", value: stats.items, icon: DatabaseIcon },
          { label: "Georeferențiate", value: stats.georeferenced, icon: GlobeIcon },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {sections.map(({ href, icon: Icon, title, desc, stat, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <div className={`inline-flex p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                {stat && <p className={`text-sm font-medium ${color}`}>{stat}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
