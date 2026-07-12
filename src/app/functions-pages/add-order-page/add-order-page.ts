import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { OrderService } from '../../data/services/order.service';

@Component({
  selector: 'app-add-order-page',
  templateUrl: './add-order-page.html',
  styleUrls: ['./add-order-page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class AddOrderPage implements OnInit {
  form: FormGroup;
  products: Product[] = [];
  loadingProducts = false;
  submitted = false;
  success = false;
  errorMessage = '';
  orderTotal = 0;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.form = this.fb.group({
      customer_name: ['', Validators.required],
      customer_phone: ['', [Validators.pattern(/^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/)]],
      address: [''],
      delivery_type: ['Доставка', Validators.required],
      due_at: ['', Validators.required],
      comment: [''],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadProducts();
    this.addItem();

    this.form.get('delivery_type')?.valueChanges.subscribe(value => {
      const addressControl = this.form.get('address');
      if (value === 'Доставка') {
        addressControl?.setValidators(Validators.required);
      } else {
        addressControl?.clearValidators();
      }
      addressControl?.updateValueAndValidity();
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.loadingProducts = false;
      },
      error: (err) => {
        console.error(err);
        this.products = [
          { id: 1, article: 'HB-0001', name: 'Чиабатта', price: 150, unit: 'шт', in_stock: true, category: 'Хлеб' },
          { id: 2, article: 'HB-0002', name: 'Багет', price: 120, unit: 'шт', in_stock: true, category: 'Хлеб' },
          { id: 3, article: 'HB-0003', name: 'Круассан', price: 90, unit: 'шт', in_stock: true, category: 'Выпечка' }
        ] as Product[];
        this.loadingProducts = false;
      }
    });
  }

  /**
   * Применяет маску телефона +7(XXX)-XXX-XX-XX
   */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Удаляем всё кроме цифр
    if (value.startsWith('8')) {
      value = '7' + value.slice(1);
    }
    if (value.startsWith('9')) {
      value = '7' + value;
    }
    value = value.slice(0, 11);
    let formattedValue = '';
    
    if (value.length > 0) {
      formattedValue = '+' + value[0]; // +7
    }
    if (value.length > 1) {
      formattedValue += '(' + value.slice(1, 4); // (906)
    }
    if (value.length > 4) {
      formattedValue += ')-' + value.slice(4, 7); // )-173
    }
    if (value.length > 7) {
      formattedValue += '-' + value.slice(7, 9); // -70
    }
    if (value.length > 9) {
      formattedValue += '-' + value.slice(9, 11); // -33
    }
    input.value = formattedValue;
    this.form.get('customer_phone')?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Очищает телефон от маски перед отправкой на сервер
   */
  private cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  addItem(): void {
    const itemForm = this.fb.group({
      product_id: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.5)]],
      price: [0],
      total: [0]
    });
    this.items.push(itemForm);
    this.updateOrderTotal();
  }

  onProductChange(index: number, event: any): void {
    const productId = Number(event.target.value);
    const product = this.products.find(p => p.id === productId);
    const itemForm = this.items.at(index) as FormGroup;
    if (product) {
      itemForm.patchValue({ price: product.price });
    } else {
      itemForm.patchValue({ price: 0 });
    }
    this.recalculateTotalForItem(itemForm);
  }

  onQuantityChange(index: number, event: any): void {
    const itemForm = this.items.at(index) as FormGroup;
    this.recalculateTotalForItem(itemForm);
  }

  recalculateTotalForItem(itemForm: FormGroup): void {
    const price = itemForm.get('price')?.value || 0;
    const quantity = itemForm.get('quantity')?.value || 0;
    const total = price * quantity;
    itemForm.patchValue({ total }, { emitEvent: false });
    this.updateOrderTotal();
  }

  updateOrderTotal(): void {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += (this.items.at(i) as FormGroup).get('total')?.value || 0;
    }
    this.orderTotal = total;
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.updateOrderTotal();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      console.log('Форма невалидна', this.form.errors, this.form.value);
      return;
    }

    const orderItems = this.items.controls.map(ctrl => {
      const group = ctrl as FormGroup;
      const product = this.products.find(p => p.id === group.get('product_id')?.value);
      return {
        product_id: group.get('product_id')?.value,
        product_name: product?.name || '',
        quantity: group.get('quantity')?.value,
        price: group.get('price')?.value,
        total: group.get('total')?.value
      };
    });

    const orderData = {
      customer_name: this.form.get('customer_name')?.value,
      customer_phone: this.cleanPhone(this.form.get('customer_phone')?.value) || null,
      address: this.form.get('address')?.value,
      delivery_type: this.form.get('delivery_type')?.value,
      due_at: new Date(this.form.get('due_at')?.value).toISOString(),
      comment: this.form.get('comment')?.value,
      items: orderItems,
      amount: this.orderTotal,
      source: 'Сайт'
    };

    console.log('Отправка заказа:', orderData);

    this.orderService.create(orderData).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => this.router.navigate(['/orders']), 1500);
      },
      error: (err) => {
        console.error('Ошибка создания заказа', err);
        this.errorMessage = err.error?.message || 'Не удалось создать заказ';
      }
    });
  }
}