import { db } from "@/lib/db";
import { items, collections } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ItemEditForm } from "./ItemEditForm";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const [item, allCollections] = await Promise.all([
    db.query.items.findFirst({ where: eq(items.id, params.id) }),
    db.select({ id: collections.id, title: collections.title }).from(collections).orderBy(asc(collections.title)),
  ]);

  if (!item) notFound();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Editează item</h1>
      <ItemEditForm item={item} collections={allCollections} />
    </div>
  );
}
