import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IngredientService, Ingredient } from '../../data/services/ingredient.service';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { ProductStockModalComponent } from '../../common-ui/product-stock-modal/product-stock-modal';
import { IngredientStockModalComponent } from '../../common-ui/ingredient-stock-modal/ingredient-stock-modal';
import { BulkAddIngredientsModalComponent } from '../../common-ui/bulk-add-ingredients-modal/bulk-add-ingredients-modal';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-warehouse-page',
  templateUrl: './warehouse-page.html',
  styleUrls: ['./warehouse-page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule, 
    ProductStockModalComponent, 
    IngredientStockModalComponent,
    BulkAddIngredientsModalComponent
  ]
})
export class WarehousePage implements OnInit {
  ingredients: Ingredient[] = [];
  products: Product[] = [];
  loading = true;

  viewMode: 'ingredients' | 'products' = 'ingredients';
  stockFilter: 'all' | 'low' | 'out' = 'all';
  ingredientCategoryFilter: string = 'all';
  ingredientCategories: string[] = [];
  productCategoryFilter: string = 'all';
  productStockFilter: 'all' | 'in_stock' | 'out_of_stock' = 'all';
  productCategories: string[] = [];
  selectedProduct: Product | null = null;
  showStockModal = false;
  isUpdatingStock = false;
  selectedIngredient: Ingredient | null = null;
  showIngredientStockModal = false;
  isUpdatingIngredient = false;
  showBulkAddModal = false;

  constructor(
    private ingredientService: IngredientService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadIngredients();
    this.loadProducts();
  }

  loadIngredients(): void {
    this.ingredientService.getAll().subscribe({
      next: (data) => {
        this.ingredients = data;
        this.ingredientCategories = [...new Set(data.map(i => i.category).filter(c => c))];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ingredients = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.productCategories = [...new Set(data.map(p => p.category).filter(c => c))];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.products = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteIngredient(id: number): void {
    if (!confirm('Вы действительно хотите удалить этот ингредиент?')) return;
    this.ingredientService.delete(id).subscribe({
      next: () => this.loadIngredients(),
      error: (err) => console.error('Ошибка удаления ингредиента:', err)
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Вы действительно хотите удалить этот продукт?')) return;
    this.productService.delete(id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error('Ошибка удаления продукта:', err)
    });
  }

  setViewMode(mode: 'ingredients' | 'products'): void {
    this.viewMode = mode;
    if (mode === 'ingredients') {
      this.stockFilter = 'all';
      this.ingredientCategoryFilter = 'all';
    } else {
      this.productCategoryFilter = 'all';
      this.productStockFilter = 'all';
    }
  }

  get filteredIngredients(): Ingredient[] {
    let result = this.ingredients;
    if (this.ingredientCategoryFilter !== 'all') {
      result = result.filter(i => i.category === this.ingredientCategoryFilter);
    }
    if (this.stockFilter === 'low') {
      result = result.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.min_stock));
    } else if (this.stockFilter === 'out') {
      result = result.filter(i => Number(i.stock) === 0);
    }
    return result;
  }

  get filteredProducts(): Product[] {
    let result = this.products;
    if (this.productCategoryFilter !== 'all') {
      result = result.filter(p => p.category === this.productCategoryFilter);
    }
    if (this.productStockFilter === 'in_stock') {
      result = result.filter(p => Number(p.stock) > 0);
    } else if (this.productStockFilter === 'out_of_stock') {
      result = result.filter(p => Number(p.stock) === 0);
    }
    return result;
  }

  get ingredientsLowStockCount(): number {
    return this.ingredients.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.min_stock)).length;
  }

  get ingredientsOutOfStockCount(): number {
    return this.ingredients.filter(i => Number(i.stock) === 0).length;
  }

  get ingredientsTotalValue(): number {
    return this.ingredients.reduce((sum, i) => sum + (Number(i.stock) * (Number(i.price_per_unit) || 0)), 0);
  }

  get productsInStockCount(): number {
    return this.products.filter(p => Number(p.stock) > 0).length;
  }

  get productsOutOfStockCount(): number {
    return this.products.filter(p => Number(p.stock) === 0).length;
  }

  get productsTotalValue(): number {
    if (this.products.length === 0) return 0;
    return this.products.reduce((sum, p) => sum + (Number(p.stock) * Number(p.price)), 0);
  }

  getStockStatus(stock: number | string, minStock: number | string): string {
    const stockNum = Number(stock);
    const minStockNum = Number(minStock);
    if (stockNum === 0) return 'out';
    if (stockNum <= minStockNum) return 'low';
    return 'ok';
  }

  getStockLabel(status: string): string {
    switch (status) {
      case 'out': return 'Закончился';
      case 'low': return 'Мало';
      default: return 'В норме';
    }
  }

  getStockBarWidth(stock: number | string, minStock: number | string): number {
    const stockNum = Number(stock);
    const minStockNum = Number(minStock);
    if (minStockNum <= 0) return 100;
    return Math.min(100, Math.round((stockNum / minStockNum) * 100));
  }

  getProductStatusLabel(inStock: boolean): string {
    return inStock ? 'В наличии' : 'Нет в наличии';
  }
  openStockModal(product: Product): void {
    this.selectedProduct = product;
    this.showStockModal = true;
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.selectedProduct = null;
    this.cdr.detectChanges();
  }

  updateProductStock(newStock: number): void {
    if (!this.selectedProduct) return;
    this.isUpdatingStock = true;
    this.productService.updateStock(this.selectedProduct.id!, newStock)
      .pipe(finalize(() => {
        this.isUpdatingStock = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          const updatedProduct = res.data || res;
          const index = this.products.findIndex(p => p.id === this.selectedProduct!.id);
          if (index !== -1 && updatedProduct) {
            this.products[index] = updatedProduct;
          }
          this.closeStockModal();
        },
        error: (err) => {
          console.error('Ошибка обновления количества продукта', err);
          alert('Не удалось обновить количество. Попробуйте снова.');
        }
      });
  }
  openIngredientModal(ingredient: Ingredient): void {
    this.selectedIngredient = ingredient;
    this.showIngredientStockModal = true;
  }

  closeIngredientModal(): void {
    this.showIngredientStockModal = false;
    this.selectedIngredient = null;
    this.cdr.detectChanges();
  }

  updateIngredient(updatedData: Partial<Ingredient>): void {
    if (!this.selectedIngredient) return;
    this.isUpdatingIngredient = true;
    this.ingredientService.update(this.selectedIngredient.id!, updatedData)
      .pipe(finalize(() => {
        this.isUpdatingIngredient = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          try {
            const updatedIngredient = res.data || res;
            const index = this.ingredients.findIndex(i => i.id === this.selectedIngredient!.id);
            if (index !== -1 && updatedIngredient) {
              this.ingredients[index] = updatedIngredient;
            }
          } catch (err) {
            console.error('Ошибка при обновлении списка ингредиентов', err);
          } finally {
            this.closeIngredientModal();
          }
        },
        error: (err) => {
          console.error('Ошибка обновления ингредиента', err);
          alert('Не удалось обновить ингредиент. Попробуйте снова.');
        }
      });
  }
  openBulkAddModal(): void {
    this.showBulkAddModal = true;
  }

  closeBulkAddModal(): void {
    this.showBulkAddModal = false;
  }

  onIngredientsAdded(): void {
    this.loadIngredients();
    this.showBulkAddModal = false;
  }
}