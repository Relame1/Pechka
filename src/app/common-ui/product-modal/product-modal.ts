import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductWithIngredients } from '../../data/interfaces/product.interface';
import { ProductService } from '../../data/services/product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-modal.html',
  styleUrls: ['./product-modal.scss']
})
export class ProductModalComponent implements OnChanges {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Product>();

  fullProduct: ProductWithIngredients | null = null;
  loadingIngredients = false;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔔 ngOnChanges вызван', changes);
    if (changes['product'] && this.product?.id) {
      console.log(`📦 Загружаем ингредиенты для продукта ID: ${this.product.id}`);
      this.loadIngredients();
    } else if (changes['product'] && this.product && !this.product.id) {
      console.warn('⚠️ Продукт передан, но не имеет ID:', this.product);
    } else {
      console.log('ℹ️ Продукт не задан или не изменился, загрузка не требуется');
    }
  }
  cleanNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    if (isNaN(num)) return 0;
    const cleaned = parseFloat(num.toFixed(10).replace(/\.?0+$/, ''));
    return isNaN(cleaned) ? 0 : cleaned;
  }
  formatIngredientValue(value: any): string {
    const cleaned = this.cleanNumber(value);
    return cleaned.toString();
  }

  loadIngredients(): void {
    if (!this.product?.id) {
      console.error('❌ Не удалось загрузить ингредиенты: нет ID продукта');
      return;
    }
    
    this.loadingIngredients = true;
    this.fullProduct = null;
    this.cdr.detectChanges();

    console.log(`🔄 Отправка запроса GET /products/${this.product.id}`);
    this.productService.getById(this.product.id).subscribe({
      next: (response) => {
        console.log('✅ Получен ответ от сервера:', response);
        if (response.success && response.data) {
          this.fullProduct = response.data;
          if (this.fullProduct && this.fullProduct.ingredients) {
            this.fullProduct.ingredients = this.fullProduct.ingredients.map(ing => ({
              ...ing,
              pivot: {
                ...ing.pivot,
                quantity: this.cleanNumber(ing.pivot.quantity)
              }
            }));
          }
        } else {
          console.error('❌ Сервер вернул ошибку или данные отсутствуют:', response);
        }
        this.loadingIngredients = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('❌ Ошибка при загрузке состава:', err);
        this.loadingIngredients = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    console.log('🔚 Закрытие модального окна');
    this.fullProduct = null;
    this.close.emit();
  }

  onEdit(): void {
    if (this.product) {
      console.log('✏️ Нажата кнопка "Изменить" для продукта', this.product.id);
      this.edit.emit(this.product);
      this.closeModal();
    }
  }
}