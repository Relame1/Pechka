import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-footer.html',
  styleUrls: ['./client-footer.scss']
})
export class ClientFooterComponent {}