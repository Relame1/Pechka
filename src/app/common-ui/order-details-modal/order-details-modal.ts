import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../data/interfaces/order.interface';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-details-modal.html',
  styleUrls: ['./order-details-modal.scss']
})
export class OrderDetailsModalComponent implements OnChanges {
  @Input() order: Order | null = null;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Order>();
  @Output() complete = new EventEmitter<Order>();
  @Output() delete = new EventEmitter<Order>();

  normalizedItems: { product_name: string; quantity: number; priceNum: number; totalNum: number }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.normalizeItems();
      console.log('Order in modal:', this.order);
      console.log('Normalized items:', this.normalizedItems);
    }
  }

  private normalizeItems(): void {
    if (!this.order?.items) {
      this.normalizedItems = [];
      return;
    }
    this.normalizedItems = this.order.items.map(item => ({
      product_name: item.product_name,
      quantity: Number(item.quantity) || 0,
      priceNum: Number(item.price) || 0,
      totalNum: Number(item.total) || 0
    }));
  }

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.order) this.edit.emit(this.order);
  }

  onComplete(): void {
    if (this.order) {
      this.complete.emit(this.order);
    }
  }

  onDelete(): void {
    if (this.order) {
      this.delete.emit(this.order);
    }
  }
}