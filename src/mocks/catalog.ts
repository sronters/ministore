import type { Category, ProductDetails, StoreRef } from "@/types/domain";

export const mockStores: StoreRef[] = [
  { id: "small", name: "Small", logoUrl: null },
  { id: "arbuz", name: "Arbuz", logoUrl: null },
  { id: "magnum", name: "Magnum", logoUrl: null }
];

export const mockCategories: Category[] = [
  { id: "dairy", name: "Молочные продукты" },
  { id: "bread", name: "Хлеб" },
  { id: "eggs", name: "Яйца" },
  { id: "drinks", name: "Напитки" },
  { id: "grocery", name: "Бакалея" },
  { id: "sweets", name: "Сладости" },
  { id: "meat", name: "Мясо" },
  { id: "household", name: "Бытовые товары" }
];

const [dairy, bread, eggs, drinks, grocery, sweets, meat, household] = mockCategories;
const now = "2026-06-22T14:30:00+05:00";
const old = "2026-06-21T10:10:00+05:00";
const stale = "2026-06-18T09:00:00+05:00";

type OfferSeed = [storeId: string, price: number, oldPrice: number | null, inStock: boolean, updatedAt?: string];

function product(
  id: string,
  name: string,
  brand: string | null,
  category: Category,
  packageValue: number | null,
  packageUnit: ProductDetails["packageUnit"],
  imageUrl: string | null,
  offers: OfferSeed[]
): ProductDetails {
  const productOffers = offers.map(([storeId, price, oldPrice, inStock, updatedAt]) => {
    const store = mockStores.find((item) => item.id === storeId);
    if (!store) throw new Error(`Unknown store ${storeId}`);
    return {
      id: `${id}_${storeId}`,
      productId: id,
      store,
      price,
      oldPrice,
      inStock,
      productUrl: inStock ? `https://${storeId}.kz/products/${id}` : null,
      updatedAt: updatedAt ?? now
    };
  });
  const available = productOffers.filter((offer) => offer.inStock);
  const prices = available.map((offer) => offer.price);
  const oldPrices = available.map((offer) => offer.oldPrice).filter((price): price is number => price !== null);

  return {
    id,
    name,
    brand,
    category,
    imageUrl,
    packageValue,
    packageUnit,
    minimumPrice: Math.min(...prices),
    oldMinimumPrice: oldPrices.length ? Math.min(...oldPrices) : null,
    offersCount: productOffers.length,
    inStock: available.length > 0,
    updatedAt: available[0]?.updatedAt ?? now,
    offers: productOffers
  };
}

export const mockProducts: ProductDetails[] = [
  product("product_001", "Молоко FoodMaster 2.5%, 1 л", "FoodMaster", dairy, 1, "l", "/products/milk.svg", [
    ["small", 489, 529, true],
    ["arbuz", 549, null, true],
    ["magnum", 505, 535, true]
  ]),
  product("product_002", "Молоко Lactel 3.2%, 1 л", "Lactel", dairy, 1, "l", "/products/milk.svg", [
    ["small", 565, null, true],
    ["arbuz", 535, 575, true],
    ["magnum", 579, null, true]
  ]),
  product("product_003", "Молоко FoodMaster 2.5%, 0.5 л", "FoodMaster", dairy, 0.5, "l", "/products/milk.svg", [
    ["small", 295, null, true],
    ["arbuz", 309, null, true]
  ]),
  product("product_004", "Кефир Bio Balance 1%, 1 л", "Bio Balance", dairy, 1, "l", "/products/dairy.svg", [
    ["small", 629, null, true],
    ["arbuz", 599, 645, true],
    ["magnum", 615, null, false]
  ]),
  product("product_005", "Сметана Простоквашино 20%, 300 г", "Простоквашино", dairy, 300, "g", null, [
    ["small", 675, null, true],
    ["arbuz", 705, null, true]
  ]),
  product("product_006", "Яйца Казгер-Кус C1, 10 шт.", "Казгер-Кус", eggs, 10, "pcs", "/products/eggs.svg", [
    ["small", 829, 899, true],
    ["arbuz", 799, 849, true],
    ["magnum", 845, null, true]
  ]),
  product("product_007", "Яйца домашние C0, 10 шт.", "Ауыл", eggs, 10, "pcs", "/products/eggs.svg", [
    ["small", 1090, null, false],
    ["arbuz", 1190, null, true],
    ["magnum", 1125, null, true]
  ]),
  product("product_008", "Хлеб пшеничный, 500 г", "Аксай", bread, 500, "g", "/products/bread.svg", [
    ["small", 229, null, true],
    ["arbuz", 255, null, true],
    ["magnum", 219, null, false]
  ]),
  product("product_009", "Батон молочный, 400 г", "Цесна", bread, 400, "g", "/products/bread.svg", [
    ["small", 205, null, true],
    ["magnum", 225, null, true]
  ]),
  product("product_010", "Coca-Cola Original, 1 л", "Coca-Cola", drinks, 1, "l", "/products/drink.svg", [
    ["small", 479, 529, true],
    ["arbuz", 499, null, true],
    ["magnum", 459, 499, true]
  ]),
  product("product_011", "Вода Tassay негазированная, 1.5 л", "Tassay", drinks, 1.5, "l", "/products/water.svg", [
    ["small", 269, null, true],
    ["arbuz", 255, null, true],
    ["magnum", 249, null, true]
  ]),
  product("product_012", "Сок Gracio яблочный, 1 л", "Gracio", drinks, 1, "l", "/products/drink.svg", [
    ["small", 725, null, true],
    ["arbuz", 759, null, true]
  ]),
  product("product_013", "Макароны Sultan рожки, 400 г", "Sultan", grocery, 400, "g", "/products/grocery.svg", [
    ["small", 365, null, true],
    ["arbuz", 389, null, true],
    ["magnum", 349, 399, true]
  ]),
  product("product_014", "Рис Пионер круглозёрный, 800 г", "Пионер", grocery, 800, "g", "/products/rice.svg", [
    ["small", 699, null, true],
    ["arbuz", 735, null, true],
    ["magnum", 715, null, true]
  ]),
  product("product_015", "Масло подсолнечное Шедевр, 1 л", "Шедевр", grocery, 1, "l", "/products/oil.svg", [
    ["small", 879, 945, true],
    ["arbuz", 905, null, true],
    ["magnum", 859, null, false, stale]
  ]),
  product("product_016", "Сахар-песок, 1 кг", null, grocery, 1, "kg", null, [
    ["small", 489, null, true],
    ["arbuz", 515, null, true],
    ["magnum", 475, null, true]
  ]),
  product("product_017", "Гречка ядрица Националь, 800 г", "Националь", grocery, 800, "g", "/products/rice.svg", [
    ["small", 845, null, true],
    ["arbuz", 819, 865, true],
    ["magnum", 835, null, true]
  ]),
  product("product_018", "Куриное филе охлаждённое, 1 кг", "Приосколье", meat, 1, "kg", "/products/chicken.svg", [
    ["small", 2890, null, true],
    ["arbuz", 3120, null, true],
    ["magnum", 2760, 2990, true, old]
  ]),
  product("product_019", "Говядина мякоть, 1 кг", "Qazaq Meat", meat, 1, "kg", null, [
    ["arbuz", 4690, null, true],
    ["magnum", 4550, null, true]
  ]),
  product("product_020", "Фарш говяжий, 1 кг", "Qazaq Meat", meat, 1, "kg", null, [
    ["small", 3590, null, true],
    ["arbuz", 3790, null, false],
    ["magnum", 3490, null, true]
  ]),
  product("product_021", "Бананы, 1 кг", null, grocery, 1, "kg", "/products/banana.svg", [
    ["small", 695, null, true],
    ["arbuz", 735, null, true],
    ["magnum", 679, null, true]
  ]),
  product("product_022", "Яблоки Gala, 1 кг", null, grocery, 1, "kg", "/products/apple.svg", [
    ["small", 789, null, true],
    ["arbuz", 759, null, true],
    ["magnum", 799, null, true]
  ]),
  product("product_023", "Шоколад Казахстан, 100 г", "Казахстан", sweets, 100, "g", "/products/chocolate.svg", [
    ["small", 499, null, true],
    ["arbuz", 475, 525, true],
    ["magnum", 489, null, true]
  ]),
  product("product_024", "Печенье Oreo, 95 г", "Oreo", sweets, 95, "g", "/products/cookie.svg", [
    ["small", 525, null, true],
    ["arbuz", 545, null, true],
    ["magnum", 499, 549, true]
  ]),
  product("product_025", "Конфеты Рахат ассорти, 250 г", "Рахат", sweets, 250, "g", "/products/chocolate.svg", [
    ["small", 1090, null, true],
    ["arbuz", 1045, null, true]
  ]),
  product("product_026", "Стиральный порошок Persil, 3 кг", "Persil", household, 3, "kg", "/products/household.svg", [
    ["small", 3890, 4290, true],
    ["arbuz", 4050, null, true],
    ["magnum", 3790, null, false]
  ]),
  product("product_027", "Средство для посуды Fairy, 450 мл", "Fairy", household, 450, "ml", "/products/household.svg", [
    ["small", 899, null, true],
    ["arbuz", 935, null, true],
    ["magnum", 875, null, true]
  ]),
  product("product_028", "Бумажные полотенца Familia, 2 рулона", "Familia", household, 2, "pcs", null, [
    ["small", 1190, null, true],
    ["magnum", 1250, null, true]
  ]),
  product("product_029", "Творог President 5%, 200 г", "President", dairy, 200, "g", "/products/dairy.svg", [
    ["small", 745, null, true],
    ["arbuz", 785, null, true],
    ["magnum", 729, 789, true]
  ]),
  product("product_030", "Чай Piala Gold, 100 пак.", "Piala", drinks, 100, "pcs", null, [
    ["small", 1390, null, true],
    ["arbuz", 1345, null, true],
    ["magnum", 1415, null, true]
  ])
];
