import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../data/services/product.service';
import { IngredientService, Ingredient } from '../../data/services/ingredient.service';

@Component({
  selector: 'app-add-product-page',
  templateUrl: './add-product-page.html',
  styleUrls: ['./add-product-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule]
})
export class AddProductPage implements OnInit {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  
  form: FormGroup;
  submitted = false;
  success = false;
  errorMessage = '';
  isLoading = false;

  categories = ['Хлеб', 'Выпечка', 'Кондитерские изделия', 'Слойки', 'Напитки'];
  allIngredients: Ingredient[] = [];
  loadingIngredients = false;
  
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private ingredientService: IngredientService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      article: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}-\d{4}$/)]],
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      unit: ['шт'],
      in_stock: [true],
      description: ['', Validators.maxLength(500)],
      prep_time: [null, [Validators.min(1)]],
      calories: [null, [Validators.min(0)]],
      ingredients: this.fb.array([]),
      image: [null]
    });
  }

  ngOnInit(): void {
    this.loadIngredients();
  }

  loadIngredients(): void {
    this.loadingIngredients = true;
    this.ingredientService.getAll().subscribe({
      next: (data) => {
        this.allIngredients = data;
        this.loadingIngredients = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки ингредиентов', err);
        this.loadingIngredients = false;
      }
    });
  }

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  addIngredient(): void {
    const ingredientGroup = this.fb.group({
      ingredient_id: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.1)]],
      unit: [{ value: '', disabled: true }]
    });
    this.ingredients.push(ingredientGroup);
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  onIngredientChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ingredientId = Number(select.value);
    const ingredient = this.allIngredients.find(i => i.id === ingredientId);
    const ingredientGroup = this.ingredients.at(index) as FormGroup;
    if (ingredient) {
      ingredientGroup.get('unit')?.setValue(ingredient.unit);
    } else {
      ingredientGroup.get('unit')?.setValue('');
    }
    this.cdr.detectChanges();
  }

  triggerFileInput(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedImage = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.imageInput.nativeElement.value = '';
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      console.log('Форма невалидна:', this.form.value);
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(`Поле ${key} невалидно:`, control.errors);
        }
      });
      return;
    }

    const formData = new FormData();
    
    formData.append('article', this.form.get('article')?.value);
    formData.append('name', this.form.get('name')?.value);
    formData.append('category', this.form.get('category')?.value);
    formData.append('price', this.form.get('price')?.value);
    formData.append('unit', this.form.get('unit')?.value);
    formData.append('in_stock', this.form.get('in_stock')?.value ? '1' : '0');
    formData.append('description', this.form.get('description')?.value || '');
    formData.append('prep_time', this.form.get('prep_time')?.value || '');
    formData.append('calories', this.form.get('calories')?.value || '');
    
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }
    
    const ingredientsValue = this.form.get('ingredients')?.value;
    if (ingredientsValue && ingredientsValue.length > 0) {
      ingredientsValue.forEach((ing: any, index: number) => {
        if (ing.ingredient_id && ing.quantity) {
          formData.append(`ingredients[${index}][ingredient_id]`, ing.ingredient_id);
          formData.append(`ingredients[${index}][quantity]`, ing.quantity);
        }
      });
    }

    this.isLoading = true;
    
    this.productService.create(formData).subscribe({
      next: (response) => {
        console.log('✅ Продукт добавлен:', response);
        this.success = true;
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Ошибка добавления:', err);
        
        if (err.error?.errors) {
          const errors = err.error.errors;
          const firstError = Object.values(errors)[0] as string[];
          this.errorMessage = firstError?.[0] || 'Ошибка валидации';
        } else {
          this.errorMessage = err.error?.message || 'Не удалось сохранить продукт';
        }
        this.cdr.detectChanges();
      }
    });
  }
}