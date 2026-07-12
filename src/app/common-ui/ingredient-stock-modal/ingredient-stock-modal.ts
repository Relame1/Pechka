import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Ingredient } from '../../data/services/ingredient.service';

@Component({
  selector: 'app-ingredient-stock-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingredient-stock-modal.html',
  styleUrls: ['./ingredient-stock-modal.scss']
})
export class IngredientStockModalComponent implements OnChanges {
  @Input() ingredient: Ingredient | null = null;
  @Input() visible = false;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Ingredient>>();

  form!: FormGroup;
  categories = ['Мука', 'Жиры', 'Сыпучие', 'Дрожжи', 'Яйца', 'Специи', 'Фрукты', 'Овощи', 'Молочные', 'Прочее'];
  units = ['кг', 'г', 'л', 'шт', 'уп'];

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ingredient'] && this.ingredient) {
      this.initForm();
    }
    if (changes['visible'] && this.visible && this.form) {
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  private initForm(): void {
    if (!this.ingredient) return;
    this.form = this.fb.group({
      name: [this.ingredient.name, Validators.required],
      category: [this.ingredient.category, Validators.required],
      unit: [this.ingredient.unit, Validators.required],
      stock: [this.ingredient.stock, [Validators.required, Validators.min(0)]],
      min_stock: [this.ingredient.min_stock, [Validators.required, Validators.min(0)]],
      price_per_unit: [this.ingredient.price_per_unit, [Validators.required, Validators.min(0.01)]],
      last_delivery: [this.ingredient.last_delivery || ''],
      notes: [this.ingredient.notes || '']
    });
  }

  onSubmit(): void {
    console.log('onSubmit() called, form.valid =', this.form.valid, 'loading =', this.loading);
    if (this.form.valid && !this.loading) {
      const formValue = this.form.value;
      console.log('Emitting save with data:', formValue);
      this.save.emit(formValue);
    } else {
      console.warn('Form invalid or loading in progress');
    }
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }
}