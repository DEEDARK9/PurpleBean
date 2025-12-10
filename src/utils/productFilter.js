export const filterProducts = (items = [], query = '') => {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    if (!item) return false;
    const fields = [
      item.name,
      item.description,
      item.category,
      item.subcategory,
      item.subSubcategory,
    ]
      .filter(Boolean)
      .map((field) => field.toLowerCase());

    return fields.some((field) => field.includes(lowerQuery));
  });
};

