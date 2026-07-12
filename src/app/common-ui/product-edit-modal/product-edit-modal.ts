import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductWithIngredients } from '../../data/interfaces/product.interface';
import { ProductService } from '../../data/services/product.service';
import { IngredientService, Ingredient } from '../../data/services/ingredient.service';

@Component({
  selector: 'app-product-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-edit-modal.html',
  styleUrls: ['./product-edit-modal.scss']
})
export class ProductEditModalComponent implements OnChanges {
  @Input() product: Product | null = null;
  @Input() visible = false;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form!: FormGroup;
  categories = ['Хлеб', 'Выпечка', 'Кондитерские изделия', 'Слойки', 'Напитки'];
  units = ['шт', 'кг', 'л'];
  
  allIngredients: Ingredient[] = [];
  fullProduct: ProductWithIngredients | null = null;
  loadingIngredients = false;
  loadingProduct = false;
  private loadedProductId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private ingredientService: IngredientService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.product?.id) {
      if (this.loadedProductId !== this.product.id) {
        this.loadProductData();
      } else {
        this.loadingProduct = false;
        this.cdr.detectChanges();
      }
    }
    if (changes['visible'] && !this.visible) {
      this.loadingProduct = false;
      this.cdr.detectChanges();
    }
  }

  private loadProductData(): void {
    if (!this.product?.id) return;
    this.loadingProduct = true;
    this.loadedProductId = this.product.id;
    this.fullProduct = null;
    this.cdr.detectChanges();

    this.productService.getById(this.product.id).subscribe({
      next: (res) => {
        console.log('✅ Данные продукта загружены:', res);
        if (res.success && res.data) {
          this.fullProduct = res.data;
          this.loadIngredientsList();
          this.initForm();
        } else {
          console.error('Ошибка: ответ не содержит данных', res);
          this.loadingProduct = false;
        }
      },
      error: (err) => {
        console.error('❌ Ошибка загрузки продукта', err);
        this.loadingProduct = false;
        this.loadedProductId = null;
        alert('Не удалось загрузить данные продукта');
      }
    });
  }

  private loadIngredientsList(): void {
    if (this.allIngredients.length === 0) {
      this.loadingIngredients = true;
      this.ingredientService.getAll().subscribe({
        next: (data) => {
          this.allIngredients = data;
          this.loadingIngredients = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка загрузки списка ингредиентов', err);
          this.loadingIngredients = false;
        }
      });
    }
  }

  private initForm(): void {
    if (!this.fullProduct) return;
    this.form = this.fb.group({
      article: [this.fullProduct.article, Validators.required],
      name: [this.fullProduct.name, Validators.required],
      category: [this.fullProduct.category, Validators.required],
      price: [this.fullProduct.price, [Validators.required, Validators.min(1)]],
      unit: [this.fullProduct.unit, Validators.required],
      description: [this.fullProduct.description || ''],
      prep_time: [this.fullProduct.prep_time || ''],
      calories: [this.fullProduct.calories || ''],
      image: [this.fullProduct.image || ''],
      ingredients: this.fb.array([])
    });
    this.initIngredientsFormArray();
    this.loadingProduct = false;
    this.cdr.detectChanges();
  }

  private initIngredientsFormArray(): void {
    const ingredientsArray = this.form.get('ingredients') as FormArray;
    ingredientsArray.clear();
    if (this.fullProduct?.ingredients?.length) {
      this.fullProduct.ingredients.forEach(ing => {
        const group = this.fb.group({
          ingredient_id: [ing.id, Validators.required],
          quantity: [ing.pivot.quantity, [Validators.required, Validators.min(0.1)]],
          unit: [{ value: ing.unit, disabled: true }]
        });
        ingredientsArray.push(group);
      });
    }
  }

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  addIngredient(): void {
    const group = this.fb.group({
      ingredient_id: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.1)]],
      unit: [{ value: '', disabled: true }]
    });
    this.ingredients.push(group);
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  onIngredientChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ingredientId = Number(select.value);
    const ingredient = this.allIngredients.find(i => i.id === ingredientId);
    const group = this.ingredients.at(index) as FormGroup;
    if (ingredient) {
      group.get('unit')?.setValue(ingredient.unit);
    } else {
      group.get('unit')?.setValue('');
    }
  }

  onSubmit(): void {
    if (this.form.valid && !this.loading) {
      const formValue = this.form.value;
      const payload = {
        ...formValue,
        ingredients: formValue.ingredients.map((ing: any) => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }))
      };
      this.save.emit(payload);
    }
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }
}