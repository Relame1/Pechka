
export interface Product {
  id?: number;
  article: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  in_stock: boolean;
  stock: number;
  description?: string;
  prep_time?: number;
  calories?: number;
  image?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductIngredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  pivot: {
    quantity: number;
    unit: string;
  };
}

export interface ProductWithIngredients extends Product {
  ingredients: ProductIngredient[];
}