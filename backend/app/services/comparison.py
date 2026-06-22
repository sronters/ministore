from app.schemas.catalog import CartComparisonOut, MissingItemOut, ProductDetailsOut, StoreComparisonOut, StoreOut


def compare_cart(items: list[tuple[str, int]], products: list[ProductDetailsOut]) -> CartComparisonOut:
    quantities = dict(items)
    stores: dict[str, StoreOut] = {}
    for product in products:
        for offer in product.offers:
            stores[offer.store.id] = offer.store

    comparisons: list[StoreComparisonOut] = []
    for store in stores.values():
        total = 0
        available = 0
        missing: list[MissingItemOut] = []
        for product in products:
            offer = next((candidate for candidate in product.offers if candidate.store.id == store.id and candidate.inStock), None)
            if offer is None:
                missing.append(MissingItemOut(productId=product.id, name=product.name))
                continue
            total += offer.price * quantities.get(product.id, 0)
            available += 1
        comparisons.append(
            StoreComparisonOut(
                store=store,
                total=total,
                availableItemsCount=available,
                totalItemsCount=len(products),
                complete=not missing,
                missingItems=missing,
                differenceFromBest=None,
            )
        )

    comparisons.sort(key=lambda item: (not item.complete, -item.availableItemsCount, item.total))
    complete = [item for item in comparisons if item.complete]
    best = complete[0] if complete else (comparisons[0] if comparisons else None)
    maximum_saving = max([item.total for item in complete], default=0) - best.total if best and complete else None
    for item in comparisons:
        if best and item.complete and best.complete:
            item.differenceFromBest = item.total - best.total
    return CartComparisonOut(bestStore=best, stores=comparisons, maximumSaving=maximum_saving)
