import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Order, OrderItem } from '../../data/interfaces/order.interface';
import { OrderService } from '../../data/services/order.service';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';

@Component({
  selector: 'app-order-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-edit-modal.html',
  styleUrls: ['./order-edit-modal.scss']
})
export class OrderEditModalComponent implements OnChanges {
  @Input() order: Order | null = null;
  @Input() visible = false;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form!: FormGroup;
  products: Product[] = [];
  loadingProducts = false;
  orderTotal = 0;

  get items(): FormArray {
    return this.form?.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.order) {
      this.loadFullOrder();
      this.loadProducts();
    }
  }

  loadFullOrder(): void {
    if (!this.order) return;
    this.orderService.getById(this.order.id).subscribe({
      next: (fullOrder) => {
        this.initForm(fullOrder);
        this.updateOrderTotal();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка загрузки заказа', err)
    });
  }

  loadProducts(): void {
    if (this.products.length === 0) {
      this.loadingProducts = true;
      this.productService.getAll().subscribe({
        next: (data) => {
          this.products = data.map(p => ({ ...p, price: Number(p.price) }));
          this.loadingProducts = false;
          if (this.form) {
            this.refreshAllItemPrices();
            this.updateOrderTotal();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loadingProducts = false;
        }
      });
    } else if (this.form) {
      this.refreshAllItemPrices();
      this.updateOrderTotal();
    }
  }

  initForm(order: Order): void {
    this.form = this.fb.group({
      customer_name: [order.customer_name, Validators.required],
      customer_phone: [order.customer_phone || ''],
      address: [order.address || ''],
      delivery_type: [order.delivery_type, Validators.required],
      due_at: [order.due_at?.slice(0, 16) || '', Validators.required],
      comment: [order.comment || ''],
      items: this.fb.array([])
    });

    const itemsArray = this.items;
    itemsArray.clear();
    if (order.items && order.items.length) {
      order.items.forEach(item => {
        itemsArray.push(this.createItemFormGroup(item));
      });
    }
    if (this.products.length > 0) {
      this.refreshAllItemPrices();
    }
  }

  createItemFormGroup(item?: OrderItem): FormGroup {
    const group = this.fb.group({
      product_id: [item?.product_id || null, Validators.required],
      product_name: [item?.product_name || ''],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0.5)]],
      price: [item?.price || 0, [Validators.required, Validators.min(0)]],
      total: [item?.total || 0]
    });
    group.get('product_id')?.valueChanges.subscribe(() => {
      this.updateItemPrice(group);
    });
    group.get('quantity')?.valueChanges.subscribe(() => {
      this.recalculateItemTotal(group);
    });
    group.get('price')?.valueChanges.subscribe(() => {
      this.recalculateItemTotal(group);
    });

    return group;
  }
  refreshAllItemPrices(): void {
    if (!this.items) return;
    this.items.controls.forEach(ctrl => {
      this.updateItemPrice(ctrl as FormGroup);
    });
  }

  updateItemPrice(group: FormGroup): void {
    const productId = group.get('product_id')?.value;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      const price = product.price;
      group.patchValue({ price, product_name: product.name }, { emitEvent: false });
    } else {
      group.patchValue({ price: 0, product_name: '' }, { emitEvent: false });
    }
    this.recalculateItemTotal(group);
  }

  recalculateItemTotal(group: FormGroup): void {
    const price = Number(group.get('price')?.value) || 0;
    const quantity = Number(group.get('quantity')?.value) || 0;
    const total = price * quantity;
    group.patchValue({ total }, { emitEvent: false });
    this.updateOrderTotal();
  }

  updateOrderTotal(): void {
    let total = 0;
    if (this.items) {
      this.items.controls.forEach(ctrl => {
        total += Number(ctrl.get('total')?.value) || 0;
      });
    }
    this.orderTotal = total;
    this.cdr.detectChanges();
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
    this.updateOrderTotal();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.updateOrderTotal();
  }

  onSubmit(): void {
    if (this.form.valid && !this.loading) {
      const formValue = this.form.value;
      const orderData = {
        ...formValue,
        items: formValue.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        amount: this.orderTotal
      };
      this.save.emit(orderData);
    }
  }

  onClose(): void {
    if (!this.loading) {
      this.close.emit();
    }
  }
}