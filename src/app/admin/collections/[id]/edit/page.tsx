import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CollectionEditForm } from "./CollectionEditForm";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.id, params.id),
  });
  if (!collection) notFound();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Editează colecție</h1>
      <CollectionEditForm collection={collection} />
    </div>
  );
}
