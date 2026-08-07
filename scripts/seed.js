const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: "Comidas", sort_order: 1 },
  { name: "Carnes a la Plancha", sort_order: 2 },
  { name: "Flautas, Tacos y Pescado", sort_order: 3 },
  { name: "Bebidas", sort_order: 4 },
  { name: "Hamburguesas Clásicas", sort_order: 5 },
  { name: "Hamburguesas de Especialidad", sort_order: 6 },
  { name: "Otros Antojitos", sort_order: 7 },
  { name: "Especiales de Carne", sort_order: 8 },
];

const diningTables = [
  { name: "Mesa 1", sort_order: 1 },
  { name: "Mesa 2", sort_order: 2 },
  { name: "Mesa 3", sort_order: 3 },
  { name: "Mesa 4", sort_order: 4 },
  { name: "Barra", sort_order: 5 },
  { name: "Para llevar", sort_order: 6 },
];

const productsRaw = [
  // Comidas
  { name: "Caldo de res", price: 110.0, category_name: "Comidas", barcode: "2000000000100", active: true },
  { name: "Caldo de pollo", price: 100.0, category_name: "Comidas", barcode: "2000000000101", active: true },
  { name: "Chile relleno", price: 75.0, category_name: "Comidas", barcode: "2000000000102", active: true },
  { name: "Mole", price: 85.0, category_name: "Comidas", barcode: "2000000000103", active: true },
  { name: "Asado", price: 85.0, category_name: "Comidas", barcode: "2000000000104", active: true },
  { name: "Guisado verde", price: 85.0, category_name: "Comidas", barcode: "2000000000105", active: true },
  { name: "Pechuga rellena", price: 90.0, category_name: "Comidas", barcode: "2000000000106", active: true },
  { name: "Fajitas de pollo", price: 80.0, category_name: "Comidas", barcode: "2000000000107", active: true },
  { name: "Carne c/ chile", price: 0.0, category_name: "Comidas", barcode: "2000000000108", active: false },
  { name: "Orden de enchiladas", price: 90.0, category_name: "Comidas", barcode: "2000000000109", active: true },

  // Carnes a la Plancha
  { name: "Chuleta ahumada", price: 100.0, category_name: "Carnes a la Plancha", barcode: "2000000000110", active: true },
  { name: "Milanesa", price: 100.0, category_name: "Carnes a la Plancha", barcode: "2000000000111", active: true },

  // Flautas, Tacos y Pescado
  { name: "Flautas sin sopa", price: 70.0, category_name: "Flautas, Tacos y Pescado", barcode: "2000000000112", active: true },
  { name: "Flautas con sopa", price: 85.0, category_name: "Flautas, Tacos y Pescado", barcode: "2000000000113", active: true },
  { name: "Taco de Bistek", price: 25.0, category_name: "Flautas, Tacos y Pescado", barcode: "2000000000114", active: true },
  { name: "Taco de Adobada", price: 25.0, category_name: "Flautas, Tacos y Pescado", barcode: "2000000000115", active: true },
  { name: "Filete de pescado", price: 120.0, category_name: "Flautas, Tacos y Pescado", barcode: "2000000000116", active: true },

  // Bebidas
  { name: "Refresco", price: 0.0, category_name: "Bebidas", barcode: "2000000000117", active: true },
  { name: "Agua del día", price: 30.0, category_name: "Bebidas", barcode: "2000000000118", active: true },
  { name: "Café", price: 25.0, category_name: "Bebidas", barcode: "2000000000119", active: true },

  // Hamburguesas Clásicas
  { name: "Ham. Jamón y Queso", price: 50.0, category_name: "Hamburguesas Clásicas", barcode: "2000000000120", active: true },
  { name: "Ham. Tocino, Jamón, Queso", price: 60.0, category_name: "Hamburguesas Clásicas", barcode: "2000000000121", active: true },
  { name: "Ham. Aguacate, Jamón, Queso", price: 60.0, category_name: "Hamburguesas Clásicas", barcode: "2000000000122", active: true },

  // Hamburguesas de Especialidad
  { name: "Ham. Hawaiana", price: 75.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000123", active: true },
  { name: "Ham. Súper Especial", price: 90.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000124", active: true },
  { name: "Ham. de Pollo", price: 75.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000125", active: true },
  { name: "Ham. Guerrera", price: 90.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000126", active: true },
  { name: "Ham. Especial", price: 75.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000127", active: true },
  { name: "Salchiburguer", price: 75.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000128", active: true },
  { name: "Ham. Suprema", price: 90.0, category_name: "Hamburguesas de Especialidad", barcode: "2000000000129", active: true },

  // Otros Antojitos
  { name: "Hot-Dog", price: 25.0, category_name: "Otros Antojitos", barcode: "2000000000130", active: true },
  { name: "Gordita", price: 20.0, category_name: "Otros Antojitos", barcode: "2000000000131", active: true },
  { name: "Burrito", price: 25.0, category_name: "Otros Antojitos", barcode: "2000000000132", active: true },
  { name: "Mollete", price: 50.0, category_name: "Otros Antojitos", barcode: "2000000000133", active: true },
  { name: "Lonche de Adobada", price: 85.0, category_name: "Otros Antojitos", barcode: "2000000000134", active: true },
  { name: "Lonche de Carnitas", price: 85.0, category_name: "Otros Antojitos", barcode: "2000000000135", active: true },
  { name: "Lonche Mixto", price: 85.0, category_name: "Otros Antojitos", barcode: "2000000000136", active: true },

  // Especiales de Carne
  { name: "Carne Asada / Fajitas Sirloin", price: 160.0, category_name: "Especiales de Carne", barcode: "2000000000137", active: true },
];

async function run() {
  console.log("Limpiando datos de prueba...");

  // Eliminar todo en orden de dependencias para evitar violaciones de foreign key
  await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("dining_tables").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Insertando categorías...");
  const { data: insertedCategories, error: catError } = await supabase
    .from("categories")
    .insert(categories)
    .select();

  if (catError) {
    console.error("Error categories:", catError);
    return;
  }

  const categoryMap = {};
  insertedCategories.forEach((c) => {
    categoryMap[c.name] = c.id;
  });

  console.log("Insertando mesas...");
  await supabase.from("dining_tables").insert(diningTables);

  console.log("Preparando y insertando productos...");
  const products = productsRaw.map((p) => {
    return {
      name: p.name,
      price: p.price,
      barcode: p.barcode,
      active: p.active,
      category_id: categoryMap[p.category_name],
    };
  });

  const { error: prodError } = await supabase.from("products").insert(products);

  if (prodError) {
    console.error("Error products:", prodError);
    return;
  }

  console.log("¡Semilla plantada! El nuevo menú se insertó con éxito.");
}

run();
