import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngredientService, Ingredient } from '../../data/services/ingredient.service';

interface SelectedIngredient {
  ingredient: Ingredient;
  quantity: number;
  selected: boolean;
}

@Component({
  selector: 'app-bulk-add-ingredients-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-add-ingredients-modal.html',
  styleUrls: ['./bulk-add-ingredients-modal.scss']
})
export class BulkAddIngredientsModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  allIngredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = [];
  selectedIngredients: SelectedIngredient[] = [];
  
  searchQuery: string = '';
  categoryFilter: string = 'all';
  categories: string[] = [];
  
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  
  selectAll: boolean = false;
  
  constructor(
    private ingredientService: IngredientService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible === true) {
      this.loadIngredients();
    }
  }
  
  loadIngredients(): void {
    console.log('loadIngredients started');
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.ingredientService.getAll().subscribe({
      next: (data) => {
        console.log('Ingredients loaded:', data.length);
        this.allIngredients = data;
        this.categories = [...new Set(data.map(i => i.category).filter(c => c))];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('isLoading set to false');
      },
      error: (err) => {
        console.error('Error loading ingredients:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  applyFilters(): void {
    console.log('applyFilters called, allIngredients length:', this.allIngredients.length);
    
    if (this.allIngredients.length === 0) {
      console.log('No ingredients yet');
      return;
    }
    
    let result = [...this.allIngredients];
    
    if (this.categoryFilter !== 'all') {
      result = result.filter(i => i.category === this.categoryFilter);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
      );
    }
    
    this.filteredIngredients = result;
    this.initSelectedIngredients();
    this.cdr.detectChanges();
    console.log('Filtered ingredients:', this.filteredIngredients.length);
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  initSelectedIngredients(): void {
    this.selectedIngredients = this.filteredIngredients.map(ing => ({
      ingredient: ing,
      quantity: 0,
      selected: false
    }));
    this.updateSelectAll();
  }
  
  updateSelectAll(): void {
    this.selectAll = this.selectedIngredients.length > 0 && this.selectedIngredients.every(si => si.selected);
  }
  
  toggleSelectAll(): void {
    this.selectedIngredients.forEach(si => si.selected = this.selectAll);
  }
  
  onSelectionChange(): void {
    this.updateSelectAll();
  }
  
  getSelectedCount(): number {
    return this.selectedIngredients.filter(si => si.selected && si.quantity > 0).length;
  }
  
  getTotalQuantity(): number {
    return this.selectedIngredients.reduce((sum, si) => sum + (si.selected ? si.quantity : 0), 0);
  }
  
  getNewStock(item: SelectedIngredient): number {
    if (!item.selected || !item.quantity) return item.ingredient.stock;
    return (Number(item.ingredient.stock) || 0) + (Number(item.quantity) || 0);
  }
  
  submit(): void {
    const toUpdate = this.selectedIngredients.filter(si => si.selected && si.quantity > 0);
    
    if (toUpdate.length === 0) {
      alert('Выберите хотя бы один ингредиент и укажите количество');
      return;
    }
    
    this.isSubmitting = true;
    this.cdr.detectChanges();
    
    const promises = toUpdate.map(si => {
      const currentStock = Number(si.ingredient.stock) || 0;
      const addQuantity = Number(si.quantity) || 0;
      const newStock = currentStock + addQuantity;
      
      const updateData = {
        name: si.ingredient.name,
        category: si.ingredient.category,
        unit: si.ingredient.unit,
        stock: newStock,
        min_stock: si.ingredient.min_stock,
        price_per_unit: si.ingredient.price_per_unit,
        last_delivery: new Date().toISOString().split('T')[0],
        notes: si.ingredient.notes
      };
      
      return this.ingredientService.update(si.ingredient.id!, updateData).toPromise();
    });
    
    Promise.all(promises)
      .then((results) => {
        this.isSubmitting = false;
        this.added.emit();
        this.onClose();
        this.cdr.detectChanges();
        alert(`Успешно добавлено! Обновлено ${toUpdate.length} ингредиентов.`);
      })
      .catch(err => {
        console.error('Ошибка при добавлении', err);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        alert('Произошла ошибка при добавлении. Попробуйте позже.');
      });
  }
  
  onClose(): void {
    if (!this.isSubmitting) {
      this.close.emit();
    }
  }
  
  resetFilters(): void {
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.applyFilters();
  }
}