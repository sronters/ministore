import { Suspense } from "react";
import { CatalogPage } from "@/features/products/catalog-page";
import { LoadingList } from "@/components/state";

export default function Page() {
  return (
    <Suspense fallback={<div className="app-shell"><LoadingList /></div>}>
      <CatalogPage searchMode />
    </Suspense>
  );
}
