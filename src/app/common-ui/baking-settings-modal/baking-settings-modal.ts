import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-baking-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './baking-settings-modal.html',
  styleUrls: ['./baking-settings-modal.scss']
})
export class BakingSettingsModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() productName = '';
  @Input() defaultTemperature = 200;
  @Input() defaultTimeMinutes = 30;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ temperature: number; timeMinutes: number }>();

  temperature = 200;
  timeMinutes = 30;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.temperature = this.defaultTemperature;
      this.timeMinutes = this.defaultTimeMinutes;
    }
  }

  onConfirm(): void {
    this.confirm.emit({ temperature: this.temperature, timeMinutes: this.timeMinutes });
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }
}