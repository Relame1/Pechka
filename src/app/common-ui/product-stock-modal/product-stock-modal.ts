import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../data/interfaces/product.interface';

@Component({
  selector: 'app-product-stock-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-stock-modal.html',
  styleUrls: ['./product-stock-modal.scss']
})
export class ProductStockModalComponent implements OnChanges {
  @Input() product: Product | null = null;
  @Input() visible = false;
  @Input() loading = false;          // ← добавлено
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<number>();

  newStockValue = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.newStockValue = this.product.stock ?? 0;
    }
  }

  onSave(): void {
    if (this.product && this.newStockValue >= 0 && !this.loading) {
      this.save.emit(this.newStockValue);
    }
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }
}