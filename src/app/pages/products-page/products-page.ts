import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { ProductModalComponent } from '../../common-ui/product-modal/product-modal';
import { ProductEditModalComponent } from '../../common-ui/product-edit-modal/product-edit-modal';
interface ExtendedProduct extends Product {
  image_url?: string;
}

@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.html',
  styleUrls: ['./products-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductModalComponent, ProductEditModalComponent]
})
export class ProductsPage implements OnInit {
  products: ExtendedProduct[] = [];
  loading = true;

  searchQuery = '';
  selectedCategory = '';
  selectedProduct: ExtendedProduct | null = null;
  showModal = false;

  editProduct: ExtendedProduct | null = null;
  showEditModal = false;
  isUpdatingProduct = false;

  categories = ['Хлеб', 'Выпечка', 'Кондитерские изделия', 'Слойки', 'Напитки'];
  skeletonCards = Array(8).fill(0);

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки продуктов:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterProducts(): void {
    this.cdr.detectChanges();
  }

  openProductModal(product: ExtendedProduct) {
    this.selectedProduct = product;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
    this.cdr.detectChanges();
  }

  deleteProduct(id: number): void {
    if (!confirm('Удалить этот продукт?')) return;
    this.productService.delete(id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => {
        alert('Не удалось удалить продукт');
        this.loadProducts();
      }
    });
  }

  openEditModal(product: ExtendedProduct): void {
    this.editProduct = product;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editProduct = null;
    this.cdr.detectChanges();
  }

  updateProduct(payload: any): void {
    if (!this.editProduct) return;
    this.isUpdatingProduct = true;
    this.productService.update(this.editProduct.id!, payload)
      .pipe(finalize(() => {
        this.isUpdatingProduct = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          const updated = res.data || res;
          const index = this.products.findIndex(p => p.id === this.editProduct!.id);
          if (index !== -1 && updated) {
            this.products[index] = updated;
          }
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Ошибка обновления продукта', err);
          alert('Не удалось обновить продукт');
        }
      });
  }

  get filteredProducts(): ExtendedProduct[] {
    return this.products.filter(p => {
      const matchSearch = !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchCategory = !this.selectedCategory || p.category === this.selectedCategory;
      
      return matchSearch && matchCategory;
    });
  }

  get inStockCount(): number {
    return this.products.filter(p => p.in_stock).length;
  }

  get outOfStockCount(): number {
    return this.products.filter(p => !p.in_stock).length;
  }

  get averagePrice(): number {
    if (this.products.length === 0) return 0;
    const sum = this.products.reduce((acc, p) => acc + p.price, 0);
    return sum / this.products.length;
  }

  selectCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
  }
}