import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IngredientService } from '../../data/services/ingredient.service';

@Component({
  selector: 'app-add-ingredient-page',
  templateUrl: './add-ingredient-page.html',
  styleUrls: ['./add-ingredient-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule]
})
export class AddIngredientPage {
  form: FormGroup;
  submitted = false;
  success = false;
  errorMessage = '';
  isLoading = false;

  categories = ['Мука', 'Жиры', 'Сыпучие', 'Дрожжи', 'Яйца', 'Специи', 'Фрукты', 'Овощи', 'Молочные', 'Прочее'];

  constructor(
    private fb: FormBuilder,
    private ingredientService: IngredientService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      unit: ['кг', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      min_stock: [0, [Validators.required, Validators.min(0)]],        // ← важно
      price_per_unit: [null, [Validators.required, Validators.min(0.01)]], // ← важно
      last_delivery: [new Date().toISOString().split('T')[0]],         // ← важно
      notes: ['']
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      console.log('Форма невалидна', this.form.value);
      return;
    }

    this.isLoading = true;

    this.ingredientService.create(this.form.value).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/warehouse']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Не удалось сохранить ингредиент';
        console.error(err);
      }
    });
  }
}