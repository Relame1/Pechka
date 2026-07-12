import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';

interface CircleElement {
  cx: number;
  cy: number;
  r: number;
}

interface EllipseElement {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage implements AfterViewInit, OnDestroy {
  @ViewChild('charactersSvg', { static: false }) charactersSvg!: ElementRef<SVGSVGElement>;

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  isLoginMode: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password_confirmation: new FormControl('', [Validators.required]),
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    setTimeout(() => this.initInputListeners(), 0);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      this.onLogin();
    } else {
      this.onRegister();
    }
  }

  loginWithYandex(): void {
    window.location.href = 'http://127.0.0.1:8000/api/auth/yandex';
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username!, password!).subscribe({
      next: (res) => {
        this.isLoading = false;
        const role = res.user.role;
        
        if (role === 'admin') {
          this.router.navigate(['/employees']);
        } else if (role === 'manager') {
          this.router.navigate(['/dashboard']);
        } else if (role === 'baker') {
          this.router.navigate(['/production2']);
        } else {
          this.router.navigate(['/client']);
        }
      },
      error: (err) => {
        if (err.error?.errors?.username?.[0]?.includes('Подтвердите email')) {
          this.errorMessage = err.error.errors.username[0];
          this.isLoading = false;
          return;
        }
        
        this.http.post('http://127.0.0.1:8000/api/employee-login', { login: username, password })
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.isLoading = false;
                const role = res.user.role;
                
                localStorage.setItem('user', JSON.stringify(res.user));
                localStorage.setItem('token', res.token);
                this.authService['currentUserSignal'].set(res.user);
                
                if (role === 'admin') {
                  this.router.navigate(['/employees']);
                } else if (role === 'manager') {
                  this.router.navigate(['/dashboard']);
                } else if (role === 'baker') {
                  this.router.navigate(['/production2']);
                } else {
                  this.router.navigate(['/client']);
                }
              }
            },
            error: (err2) => {
              this.isLoading = false;
              this.errorMessage = err2.error?.message || err.error?.message || 'Неверный логин или пароль';
            }
          });
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;

    this.http.post('http://127.0.0.1:8000/api/register', {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.authService.setRegisteredEmail(res.email);
          this.router.navigate(['/verify-email'], { queryParams: { email: res.email } });
        } else {
          this.successMessage = res.message;
          setTimeout(() => {
            this.isLoginMode = true;
            this.successMessage = '';
            this.registerForm.reset();
          }, 2000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.errors) {
          const errors = err.error.errors;
          if (errors.email) {
            this.errorMessage = errors.email[0];
          } else if (errors.name) {
            this.errorMessage = errors.name[0];
          } else if (errors.password) {
            this.errorMessage = errors.password[0];
          } else {
            this.errorMessage = 'Ошибка при регистрации. Попробуйте позже.';
          }
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Ошибка при регистрации. Попробуйте позже.';
        }
      }
    });
  }
  private grissiniGroup!: SVGGElement;
  private grissiniBodyPath!: SVGPathElement;
  private grissiniBodyDecorations: Array<{ element: SVGGraphicsElement; cy: number; originalTransform: string }> = [];
  private grissiniFaceGroup!: SVGGElement;
  private grissiniLeftPupil!: SVGCircleElement;
  private grissiniRightPupil!: SVGCircleElement;
  private grissiniLeftWhite!: SVGEllipseElement;
  private grissiniRightWhite!: SVGEllipseElement;

  private grissiniTargetX = 0;
  private grissiniTargetY = 0;
  private grissiniCurrentX = 0;
  private grissiniCurrentY = 0;

  private grissiniBlinkTimer: ReturnType<typeof setTimeout> | null = null;
  private isGrissiniBlinking = false;
  private grissiniBlinkProgress = 0;

  private grissiniFocusFaceShiftX = 0;
  private grissiniFocusFaceShiftTargetX = 0;

  private grissiniBodyShiftX = 0;
  private grissiniBodyShiftTargetX = 0;
  private grissiniBodyTilt = 0;
  private grissiniBodyTiltTarget = 0;
  private grissiniBodyBend = 0;
  private grissiniBodyBendTarget = 0;

  private grissiniLookToPizzaX = 0;
  private grissiniLookToPizzaTargetX = 0;
  private grissiniLookToPizzaY = 0;
  private grissiniLookToPizzaTargetY = 0;

  private grissiniFocusGestureTimer: ReturnType<typeof setTimeout> | null = null;
  private grissiniFocusReturnTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly grissiniBodyOriginalD = 'M188 75C193.523 75 198 79.4772 198 85V194H155V85C155 79.4772 159.477 75 165 75H188Z';
  private readonly grissiniStraightTiltPivotY = 132;
  private readonly grissiniSecondBendPivotY = 132;
  private readonly grissiniSecondBendTarget = -32.0;

  private readonly grissiniMaxPupilOffsetX = 2.5;
  private readonly grissiniMaxPupilOffsetY = 2.55;
  private readonly grissiniMaxFaceShiftX = 8;

  private grissiniAnimationFrame: number | null = null;

  private origGrissiniLeftPupil: CircleElement = { cx: 168.5, cy: 85.5, r: 1.5 };
  private origGrissiniRightPupil: CircleElement = { cx: 184.5, cy: 85.5, r: 1.5 };
  private origGrissiniLeftWhite: EllipseElement = { cx: 168.5, cy: 85.5, rx: 4.5, ry: 4.5 };
  private origGrissiniRightWhite: EllipseElement = { cx: 184.5, cy: 85.5, rx: 4.5, ry: 4.5 };
  private boundMouseMove: (e: MouseEvent) => void;
  private boundInputFocusIn: (e: FocusEvent) => void;
  private boundInputFocusOut: (e: FocusEvent) => void;
  private boundDirectInputFocus: (e: FocusEvent) => void;
  private boundDirectInputBlur: (e: FocusEvent) => void;
  private inputBlurTimer: ReturnType<typeof setTimeout> | null = null;
  private isAnyFormInputFocused = false;
  private animationFrame: number | null = null;

  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;

  private smoothLeftEyeOffset = 0;
  private smoothRightEyeOffset = 0;
  private smoothMouthTilt = 0;

  private originalLeftEye: EllipseElement = { cx: 87.5, cy: 164.5, rx: 2.5, ry: 2.5 };
  private originalRightEye: EllipseElement = { cx: 112.5, cy: 164.5, rx: 2.5, ry: 2.5 };

  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private isBlinking = false;
  private blinkProgress = 0;

  private isNodding = false;
  private nodProgress = 0;
  private nodPhase = 0;
  private readonly maxNods = 5;
  private nodAnimationId: number | null = null;
  private nodStartTime = 0;
  private nodSpeed = 0;

  private isSurprised = false;
  private mouthElement: SVGPathElement | null = null;
  private mouthTransitionProgress = 0;
  private mouthAnimationId: number | null = null;
  
  private focusFaceShiftX = 0;
  private focusFaceShiftTargetX = 0;
  
  private readonly normalMouthD = 'M108 170C108 171.326 107.421 172.598 106.389 173.536C105.358 174.473 103.959 175 102.5 175C101.041 175 99.6424 174.473 98.6109 173.536C97.5795 172.598 97 171.326 97 170L102.5 170H108Z';
  private readonly surprisedMouthD = 'M102.5 168.5C104.5 168.5 106 170 106 171.5C106 173 104.5 174.5 102.5 174.5C100.5 174.5 99 173 99 171.5C99 170 100.5 168.5 102.5 168.5Z';
  private pizzaAnimationFrame: number | null = null;
  private pizzaTargetX = 0;
  private pizzaTargetY = 0;
  private pizzaCurrentX = 0;
  private pizzaCurrentY = 0;

  private pizzaFaceGroup!: SVGGElement;
  private pizzaLeftPupil!: SVGCircleElement;
  private pizzaRightPupil!: SVGCircleElement;
  private pizzaLeftWhite!: SVGEllipseElement;
  private pizzaRightWhite!: SVGEllipseElement;
  private pizzaMouth!: SVGPathElement;
  private pizzaBodyGroup!: SVGGElement;

  private origLeftPupil: CircleElement = { cx: 144, cy: 49, r: 1 };
  private origRightPupil: CircleElement = { cx: 165, cy: 49, r: 1 };
  private origLeftWhite: EllipseElement = { cx: 140, cy: 52, rx: 3, ry: 3 };
  private origRightWhite: EllipseElement = { cx: 161, cy: 52, rx: 3, ry: 3 };

  private pizzaBlinkTimer: ReturnType<typeof setTimeout> | null = null;
  private isPizzaBlinking = false;
  private pizzaBlinkProgress = 0;

  private pizzaFocusFaceShiftX = 0;
  private pizzaFocusFaceShiftTargetX = 0;

  private pizzaBodyTilt = 0;
  private pizzaExtraTiltActive = false;
  private pizzaExtraTilt = 0;
  private pizzaExtraTiltTimer: ReturnType<typeof setTimeout> | null = null;

  private pizzaLookDownAmount = 0;
  private pizzaLookDownTarget = 0;
  private pizzaFaceShiftDown = 0;
  private pizzaFaceShiftDownTarget = 0;

  private pizzaLookDownTimer: ReturnType<typeof setTimeout> | null = null;
  
  private readonly originalPizzaMouthD = 'M134 54C135.833 56.0325 140 59.5893 145 54';
  private readonly pizzaVerticalMouthD = 'M139.5 52 L139.5 58';

  private readonly maxPupilOffsetX = 1.7;
  private readonly maxPupilOffsetY = 2.0;

  constructor() {
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundInputFocusIn = this.onDocumentFocusIn.bind(this);
    this.boundInputFocusOut = this.onDocumentFocusOut.bind(this);
    this.boundDirectInputFocus = this.onDirectInputFocus.bind(this);
    this.boundDirectInputBlur = this.onDirectInputBlur.bind(this);
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMochiAnimation(), 100);
    setTimeout(() => this.initGrissiniAnimation(), 110);
    setTimeout(() => this.initInputListeners(), 200);
    setTimeout(() => this.initPizzaAnimation(), 120);
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('focusin', this.boundInputFocusIn);
    document.removeEventListener('focusout', this.boundInputFocusOut);
    this.detachDirectInputListeners();
    if (this.inputBlurTimer) clearTimeout(this.inputBlurTimer);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.pizzaAnimationFrame) cancelAnimationFrame(this.pizzaAnimationFrame);
    if (this.grissiniAnimationFrame) cancelAnimationFrame(this.grissiniAnimationFrame);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.nodAnimationId) cancelAnimationFrame(this.nodAnimationId);
    if (this.mouthAnimationId) cancelAnimationFrame(this.mouthAnimationId);
    if (this.pizzaBlinkTimer) clearTimeout(this.pizzaBlinkTimer);
    if (this.pizzaExtraTiltTimer) clearTimeout(this.pizzaExtraTiltTimer);
    if (this.pizzaLookDownTimer) clearTimeout(this.pizzaLookDownTimer);
    if (this.grissiniBlinkTimer) clearTimeout(this.grissiniBlinkTimer);
    this.clearGrissiniFocusGestureTimers();
  }

  private initInputListeners() {
    document.removeEventListener('focusin', this.boundInputFocusIn);
    document.removeEventListener('focusout', this.boundInputFocusOut);
    document.addEventListener('focusin', this.boundInputFocusIn);
    document.addEventListener('focusout', this.boundInputFocusOut);
    this.attachDirectInputListeners();

    if (this.isFormInputElement(document.activeElement)) {
      this.onInputFocus();
    }
  }

  private attachDirectInputListeners(): void {
    document.querySelectorAll<HTMLElement>('.form-input').forEach(input => {
      input.removeEventListener('focus', this.boundDirectInputFocus);
      input.removeEventListener('blur', this.boundDirectInputBlur);
      input.addEventListener('focus', this.boundDirectInputFocus);
      input.addEventListener('blur', this.boundDirectInputBlur);
    });
  }

  private detachDirectInputListeners(): void {
    document.querySelectorAll<HTMLElement>('.form-input').forEach(input => {
      input.removeEventListener('focus', this.boundDirectInputFocus);
      input.removeEventListener('blur', this.boundDirectInputBlur);
    });
  }

  private isFormInputElement(target: EventTarget | null): target is HTMLElement {
    return target instanceof HTMLElement && target.classList.contains('form-input');
  }

  private onDocumentFocusIn(event: FocusEvent): void {
    if (!this.isFormInputElement(event.target)) return;

    if (this.inputBlurTimer) {
      clearTimeout(this.inputBlurTimer);
      this.inputBlurTimer = null;
    }

    this.onInputFocus();
  }

  private onDocumentFocusOut(event: FocusEvent): void {
    if (!this.isFormInputElement(event.target)) return;

    this.queueInputBlurCheck();
  }

  private onDirectInputFocus(event: FocusEvent): void {
    if (!this.isFormInputElement(event.target)) return;

    if (this.inputBlurTimer) {
      clearTimeout(this.inputBlurTimer);
      this.inputBlurTimer = null;
    }

    this.onInputFocus();
  }

  private onDirectInputBlur(event: FocusEvent): void {
    if (!this.isFormInputElement(event.target)) return;

    this.queueInputBlurCheck();
  }

  private queueInputBlurCheck(): void {
    if (this.inputBlurTimer) clearTimeout(this.inputBlurTimer);
    this.inputBlurTimer = setTimeout(() => {
      this.inputBlurTimer = null;
      if (!this.isFormInputElement(document.activeElement)) {
        this.onInputBlur();
      }
    }, 0);
  }

  private syncFormInputFocusState(): void {
    const inputIsActive = this.isFormInputElement(document.activeElement);

    if (inputIsActive && !this.isAnyFormInputFocused) {
      this.onInputFocus();
      return;
    }

    if (!inputIsActive && this.isAnyFormInputFocused && !this.inputBlurTimer) {
      this.onInputBlur();
    }
  }

  private onInputFocus() {
    this.isAnyFormInputFocused = true;

    if (!this.isNodding) {
      this.isSurprised = true;
      this.animateMouth(true);
      this.nodSpeed = 0;
      
      if (this.currentX > 0.3) this.focusFaceShiftTargetX = 18;
      else if (this.currentX > 0) this.focusFaceShiftTargetX = 10;
      else if (this.currentX < -0.3) this.focusFaceShiftTargetX = -12;
      else if (this.currentX < 0) this.focusFaceShiftTargetX = -6;
      else this.focusFaceShiftTargetX = 0;
      
      this.startNodding();
    }

    this.startGrissiniFieldFocusGesture();

    this.pizzaFocusFaceShiftTargetX = 18;
    if (this.pizzaMouth) {
      this.pizzaMouth.setAttribute('d', this.pizzaVerticalMouthD);
    }

    this.pizzaLookDownAmount = 0;
    this.pizzaLookDownTarget = 0;
    this.pizzaFaceShiftDown = 0;
    this.pizzaFaceShiftDownTarget = 0;
    if (this.pizzaLookDownTimer) {
      clearTimeout(this.pizzaLookDownTimer);
      this.pizzaLookDownTimer = null;
    }

    if (this.pizzaExtraTiltTimer) clearTimeout(this.pizzaExtraTiltTimer);
    this.pizzaExtraTiltTimer = setTimeout(() => {
      this.pizzaExtraTiltActive = true;
      this.pizzaLookDownTarget = 2.0;
      this.pizzaFaceShiftDownTarget = 8;

      if (this.pizzaLookDownTimer) clearTimeout(this.pizzaLookDownTimer);
      this.pizzaLookDownTimer = setTimeout(() => {
        this.pizzaLookDownTarget = 0;
        this.pizzaFaceShiftDownTarget = 0;
        this.pizzaExtraTiltActive = false;
      }, 1000);
    }, 1000);
  }

  private onInputBlur() {
    this.isAnyFormInputFocused = false;
    this.isSurprised = false;
    this.animateMouth(false);
    this.focusFaceShiftTargetX = 0;
    this.resetGrissiniFieldFocusGesture();

    this.pizzaFocusFaceShiftTargetX = 0;
    if (this.pizzaMouth) {
      this.pizzaMouth.setAttribute('d', this.originalPizzaMouthD);
    }

    if (this.pizzaExtraTiltTimer) {
      clearTimeout(this.pizzaExtraTiltTimer);
      this.pizzaExtraTiltTimer = null;
    }
    if (this.pizzaLookDownTimer) {
      clearTimeout(this.pizzaLookDownTimer);
      this.pizzaLookDownTimer = null;
    }
    this.pizzaExtraTiltActive = false;
    this.pizzaExtraTilt = 0;
    this.pizzaLookDownAmount = 0;
    this.pizzaLookDownTarget = 0;
    this.pizzaFaceShiftDown = 0;
    this.pizzaFaceShiftDownTarget = 0;
  }

  private animateMouth(toSurprised: boolean) {
    if (this.mouthAnimationId) cancelAnimationFrame(this.mouthAnimationId);
    
    const duration = 200;
    const startTime = performance.now();
    const startProgress = this.mouthTransitionProgress;
    const targetProgress = toSurprised ? 1 : 0;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.mouthTransitionProgress = startProgress + (targetProgress - startProgress) * eased;
      
      if (t < 1) {
        this.mouthAnimationId = requestAnimationFrame(animate);
      } else {
        this.mouthTransitionProgress = targetProgress;
        this.mouthAnimationId = null;
      }
    };
    
    this.mouthAnimationId = requestAnimationFrame(animate);
  }

  private startNodding() {
    if (this.isNodding) return;
    
    this.isNodding = true;
    this.nodProgress = 0;
    this.nodPhase = 0;
    this.nodStartTime = performance.now();
    this.nodSpeed = 0;
    
    const prepareDuration = 400;
    const nodBaseDuration = 300;
    const returnDuration = 500;
    
    const animateNod = (currentTime: number) => {
      const elapsed = currentTime - this.nodStartTime;
      
      if (this.nodPhase === 0) {
        if (elapsed < prepareDuration) {
          const t = elapsed / prepareDuration;
          this.nodProgress = t * t * 0.3;
          this.nodSpeed = t * t * 0.5;
        } else {
          this.nodPhase = 1;
          this.nodStartTime = currentTime;
          this.nodSpeed = 1;
        }
      }
      
      if (this.nodPhase === 1) {
        const nodElapsed = currentTime - this.nodStartTime;
        const totalNodDuration = nodBaseDuration * this.maxNods;
        
        if (nodElapsed >= totalNodDuration) {
          this.nodPhase = 2;
          this.nodStartTime = currentTime;
          this.nodProgress = 0.3;
          this.nodSpeed = 1;
        } else {
          const progressInPhase = nodElapsed / totalNodDuration;
          const speedMultiplier = Math.sin(progressInPhase * Math.PI);
          
          const nodCycle = (nodElapsed % nodBaseDuration) / nodBaseDuration;
          const cycleProgress = Math.sin(nodCycle * Math.PI * 2) * 0.7;
          
          this.nodProgress = 0.3 + cycleProgress * speedMultiplier;
          this.nodSpeed = speedMultiplier;
        }
      }
      
      if (this.nodPhase === 2) {
        const returnElapsed = currentTime - this.nodStartTime;
        
        if (returnElapsed >= returnDuration) {
          this.isNodding = false;
          this.nodProgress = 0;
          this.nodPhase = 0;
          this.nodSpeed = 0;
          this.nodAnimationId = null;
          return;
        }
        
        const t = returnElapsed / returnDuration;
        this.nodProgress = 0.3 * (1 - t * t);
        this.nodSpeed = (1 - t) * (1 - t);
      }
      
      this.nodAnimationId = requestAnimationFrame(animateNod);
    };
    
    this.nodAnimationId = requestAnimationFrame(animateNod);
  }
  private clearGrissiniFocusGestureTimers(): void {
    if (this.grissiniFocusGestureTimer) {
      clearTimeout(this.grissiniFocusGestureTimer);
      this.grissiniFocusGestureTimer = null;
    }

    if (this.grissiniFocusReturnTimer) {
      clearTimeout(this.grissiniFocusReturnTimer);
      this.grissiniFocusReturnTimer = null;
    }
  }

  private startGrissiniFieldFocusGesture(): void {
    this.clearGrissiniFocusGestureTimers();
    this.grissiniBodyShiftTargetX = 0;
    this.grissiniBodyTiltTarget = 20.0;
    this.grissiniBodyBendTarget = 0;
    this.grissiniFocusFaceShiftTargetX = 5.0;
    this.grissiniLookToPizzaTargetX = 0.55;
    this.grissiniLookToPizzaTargetY = 0.06;
    this.grissiniFocusGestureTimer = setTimeout(() => {
      this.grissiniBodyShiftTargetX = 0;
      this.grissiniBodyTiltTarget = 20.0;
      this.grissiniBodyBendTarget = this.grissiniSecondBendTarget;
      this.grissiniFocusFaceShiftTargetX = 0;
      this.grissiniLookToPizzaTargetX = 0;
      this.grissiniLookToPizzaTargetY = -1.2;
    }, 1040);
    this.grissiniFocusReturnTimer = setTimeout(() => {
      this.grissiniBodyShiftTargetX = 0;
      this.grissiniBodyTiltTarget = 20.0;
      this.grissiniBodyBendTarget = 0;
      this.grissiniFocusFaceShiftTargetX = 5.0;
      this.grissiniLookToPizzaTargetX = 0.55;
      this.grissiniLookToPizzaTargetY = 0.06;
    }, 2100);
  }

  private resetGrissiniFieldFocusGesture(): void {
    this.clearGrissiniFocusGestureTimers();

    this.grissiniBodyShiftTargetX = 0;
    this.grissiniBodyTiltTarget = 0;
    this.grissiniBodyBendTarget = 0;
    this.grissiniFocusFaceShiftTargetX = 0;
    this.grissiniLookToPizzaTargetX = 0;
    this.grissiniLookToPizzaTargetY = 0;
  }

  private getGrissiniStraightTiltShiftAtY(y: number, tiltShift?: number): number {
    const fullTiltShift = tiltShift ?? (this.grissiniBodyShiftX + this.grissiniBodyTilt);
    const bottomY = this.grissiniStraightTiltPivotY;
    const topY = 75;

    if (y >= bottomY) return 0;
    if (y <= topY) return fullTiltShift;

    const raw = (bottomY - y) / (bottomY - topY);
    const t = Math.max(0, Math.min(1, raw));

    return fullTiltShift * t;
  }

  private getGrissiniCurvedBendShiftAtY(y: number, bendShift?: number): number {
    const fullBendShift = bendShift ?? this.grissiniBodyBend;
    const fixedPartY = this.grissiniSecondBendPivotY;
    const topY = 75;

    if (y >= fixedPartY) return 0;

    const raw = (fixedPartY - y) / (fixedPartY - topY);
    const t = Math.max(0, Math.min(1, raw));
    const eased = t * t * (3 - 2 * t);

    return fullBendShift * eased;
  }

  private getGrissiniBodyShiftAtY(y: number, tiltShift?: number, bendShift?: number): number {
    return this.getGrissiniStraightTiltShiftAtY(y, tiltShift) +
      this.getGrissiniCurvedBendShiftAtY(y, bendShift);
  }

  private buildGrissiniStraightBodyPath(tiltShift: number): string {
    const pivotY = this.grissiniStraightTiltPivotY;
    const top = this.getGrissiniStraightTiltShiftAtY(75, tiltShift);
    const shoulder = this.getGrissiniStraightTiltShiftAtY(85, tiltShift);
    const pivot = this.getGrissiniStraightTiltShiftAtY(pivotY, tiltShift);

    const n = (value: number) => value.toFixed(2);

    return [
      `M${n(188 + top)} 75`,
      `C${n(193.523 + top)} 75 ${n(198 + shoulder)} 79.4772 ${n(198 + shoulder)} 85`,
      `L${n(198 + pivot)} ${pivotY}`,
      'V194',
      'H155',
      `V${pivotY}`,
      `L${n(155 + shoulder)} 85`,
      `C${n(155 + shoulder)} 79.4772 ${n(159.477 + top)} 75 ${n(165 + top)} 75`,
      `H${n(188 + top)}`,
      'Z'
    ].join(' ');
  }

  private buildGrissiniBentBodyPath(tiltShift: number, bendShift: number): string {
    const pivotY = this.grissiniSecondBendPivotY;
    const top = this.getGrissiniBodyShiftAtY(75, tiltShift, bendShift);
    const shoulder = this.getGrissiniBodyShiftAtY(85, tiltShift, bendShift);
    const upper = this.getGrissiniBodyShiftAtY(104, tiltShift, bendShift);
    const middle = this.getGrissiniBodyShiftAtY(118, tiltShift, bendShift);
    const pivot = this.getGrissiniBodyShiftAtY(pivotY, tiltShift, bendShift);

    const n = (value: number) => value.toFixed(2);

    return [
      `M${n(188 + top)} 75`,
      `C${n(193.523 + top)} 75 ${n(198 + shoulder)} 79.4772 ${n(198 + shoulder)} 85`,
      `C${n(198 + upper)} 104 ${n(198 + middle)} 118 ${n(198 + pivot)} ${pivotY}`,
      'V194',
      'H155',
      `V${pivotY}`,
      `C${n(155 + middle)} 118 ${n(155 + upper)} 104 ${n(155 + shoulder)} 85`,
      `C${n(155 + shoulder)} 79.4772 ${n(159.477 + top)} 75 ${n(165 + top)} 75`,
      `H${n(188 + top)}`,
      'Z'
    ].join(' ');
  }

  private updateGrissiniBodyPose(): void {
    if (!this.grissiniGroup || !this.grissiniBodyPath) return;

    this.grissiniBodyShiftX += (this.grissiniBodyShiftTargetX - this.grissiniBodyShiftX) * 0.08;
    this.grissiniBodyTilt += (this.grissiniBodyTiltTarget - this.grissiniBodyTilt) * 0.065;
    this.grissiniBodyBend += (this.grissiniBodyBendTarget - this.grissiniBodyBend) * 0.055;

    if (Math.abs(this.grissiniBodyShiftTargetX - this.grissiniBodyShiftX) < 0.01) {
      this.grissiniBodyShiftX = this.grissiniBodyShiftTargetX;
    }
    if (Math.abs(this.grissiniBodyTiltTarget - this.grissiniBodyTilt) < 0.01) {
      this.grissiniBodyTilt = this.grissiniBodyTiltTarget;
    }
    if (Math.abs(this.grissiniBodyBendTarget - this.grissiniBodyBend) < 0.01) {
      this.grissiniBodyBend = this.grissiniBodyBendTarget;
    }

    const tiltShift = this.grissiniBodyShiftX + this.grissiniBodyTilt;
    const bendShift = this.grissiniBodyBend;
    const isNeutral = Math.abs(tiltShift) < 0.01 && Math.abs(bendShift) < 0.01;
    this.grissiniGroup.setAttribute('transform', 'translate(0, 0)');

    if (isNeutral) {
      this.grissiniBodyPath.setAttribute('d', this.grissiniBodyOriginalD);
    } else if (Math.abs(bendShift) < 0.01) {
      this.grissiniBodyPath.setAttribute('d', this.buildGrissiniStraightBodyPath(tiltShift));
    } else {
      this.grissiniBodyPath.setAttribute('d', this.buildGrissiniBentBodyPath(tiltShift, bendShift));
    }

    this.grissiniBodyDecorations.forEach(decoration => {
      const decorationShiftX = isNeutral ? 0 : this.getGrissiniBodyShiftAtY(decoration.cy, tiltShift, bendShift);
      const transform = `translate(${decorationShiftX.toFixed(2)}, 0) ${decoration.originalTransform}`.trim();
      decoration.element.setAttribute('transform', transform);
    });
  }

  private expandGrissiniSvgVisibleArea(svg: SVGSVGElement): void {
    svg.setAttribute('overflow', 'visible');
    svg.style.overflow = 'visible';

    const visibleGrissiniParts = [
      svg.querySelector('#grissini') as SVGElement | null,
      svg.querySelector('#grissini_body') as SVGElement | null,
      svg.querySelector('#Subtract_3') as SVGElement | null
    ];

    visibleGrissiniParts.forEach(part => {
      if (!part) return;
      part.setAttribute('overflow', 'visible');
      part.style.overflow = 'visible';
    });
    const grissiniFilter = svg.querySelector('#filter1_i_1002_2') as SVGFilterElement | null;
    if (grissiniFilter) {
      grissiniFilter.setAttribute('x', '110');
      grissiniFilter.setAttribute('y', '40');
      grissiniFilter.setAttribute('width', '150');
      grissiniFilter.setAttribute('height', '190');
      grissiniFilter.setAttribute('filterUnits', 'userSpaceOnUse');
    }
  }

  private getOrCreateGrissiniEyeEllipse(
    svg: SVGSVGElement,
    eyeId: string,
    defaultCx: number,
    defaultCy: number,
    defaultRadius: number
  ): SVGEllipseElement | null {
    const eye = svg.querySelector(`#${eyeId}`) as SVGCircleElement | SVGEllipseElement | null;
    if (!eye) return null;

    if (eye.tagName.toLowerCase() === 'ellipse') {
      return eye as SVGEllipseElement;
    }

    const circle = eye as SVGCircleElement;
    const cx = parseFloat(circle.getAttribute('cx') || String(defaultCx));
    const cy = parseFloat(circle.getAttribute('cy') || String(defaultCy));
    const radius = parseFloat(circle.getAttribute('r') || String(defaultRadius));
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');

    Array.from(circle.attributes).forEach(attr => {
      if (attr.name !== 'r') {
        ellipse.setAttribute(attr.name, attr.value);
      }
    });

    ellipse.setAttribute('id', eyeId);
    ellipse.setAttribute('cx', cx.toString());
    ellipse.setAttribute('cy', cy.toString());
    ellipse.setAttribute('rx', radius.toString());
    ellipse.setAttribute('ry', radius.toString());

    circle.replaceWith(ellipse);
    return ellipse;
  }

  private initGrissiniAnimation() {
    const svg = this.charactersSvg?.nativeElement;
    if (!svg) return;

    this.expandGrissiniSvgVisibleArea(svg);

    const grissiniLeftWhite = this.getOrCreateGrissiniEyeEllipse(svg, 'grissini_left_eye_white', 168.5, 85.5, 4.5);
    const grissiniRightWhite = this.getOrCreateGrissiniEyeEllipse(svg, 'grissini_right_eye_white', 184.5, 85.5, 4.5);

    this.grissiniGroup = svg.querySelector('#grissini') as SVGGElement;
    this.grissiniBodyPath = (
      svg.querySelector('#Subtract_3 path') ||
      svg.querySelector('#grissini_body path')
    ) as SVGPathElement;
    this.grissiniBodyDecorations = Array.from(
      svg.querySelectorAll<SVGEllipseElement>('#grissini_body > ellipse')
    ).map((element: SVGEllipseElement) => ({
      element,
      cy: parseFloat(element.getAttribute('cy') || '0'),
      originalTransform: element.getAttribute('transform') || ''
    }));
    this.grissiniLeftPupil = svg.querySelector('#grissini_left_pupil') as SVGCircleElement;
    this.grissiniRightPupil = svg.querySelector('#grissini_right_pupil') as SVGCircleElement;
    this.grissiniFaceGroup = svg.querySelector('#grissini_face') as SVGGElement;

    if (!this.grissiniGroup || !this.grissiniBodyPath || !grissiniLeftWhite || !grissiniRightWhite || !this.grissiniFaceGroup) {
      console.warn('Grissini elements not found');
      return;
    }

    this.grissiniLeftWhite = grissiniLeftWhite;
    this.grissiniRightWhite = grissiniRightWhite;
    this.grissiniGroup.setAttribute('transform', 'translate(0, 0)');
    this.grissiniBodyPath.setAttribute('d', this.grissiniBodyOriginalD);
    this.origGrissiniLeftWhite = {
      cx: parseFloat(this.grissiniLeftWhite.getAttribute('cx') || '168.5'),
      cy: parseFloat(this.grissiniLeftWhite.getAttribute('cy') || '85.5'),
      rx: parseFloat(this.grissiniLeftWhite.getAttribute('rx') || '4.5'),
      ry: parseFloat(this.grissiniLeftWhite.getAttribute('ry') || '4.5')
    };
    this.origGrissiniRightWhite = {
      cx: parseFloat(this.grissiniRightWhite.getAttribute('cx') || '184.5'),
      cy: parseFloat(this.grissiniRightWhite.getAttribute('cy') || '85.5'),
      rx: parseFloat(this.grissiniRightWhite.getAttribute('rx') || '4.5'),
      ry: parseFloat(this.grissiniRightWhite.getAttribute('ry') || '4.5')
    };

    if (this.grissiniLeftPupil) {
      this.origGrissiniLeftPupil = {
        cx: parseFloat(this.grissiniLeftPupil.getAttribute('cx') || '168.5'),
        cy: parseFloat(this.grissiniLeftPupil.getAttribute('cy') || '85.5'),
        r: parseFloat(this.grissiniLeftPupil.getAttribute('r') || '1.5')
      };
    }
    if (this.grissiniRightPupil) {
      this.origGrissiniRightPupil = {
        cx: parseFloat(this.grissiniRightPupil.getAttribute('cx') || '184.5'),
        cy: parseFloat(this.grissiniRightPupil.getAttribute('cy') || '85.5'),
        r: parseFloat(this.grissiniRightPupil.getAttribute('r') || '1.5')
      };
    }
    const animateGrissini = () => {
      this.syncFormInputFocusState();
      this.updateGrissiniLook();
      this.grissiniAnimationFrame = requestAnimationFrame(animateGrissini);
    };
    this.grissiniAnimationFrame = requestAnimationFrame(animateGrissini);
    this.scheduleGrissiniBlink();
  }

  private scheduleGrissiniBlink() {
    if (this.grissiniBlinkTimer) clearTimeout(this.grissiniBlinkTimer);
    const nextBlink = 550 + Math.random() * 1100;
    this.grissiniBlinkTimer = setTimeout(() => this.startGrissiniBlink(), nextBlink);
  }

  private startGrissiniBlink() {
    if (this.isGrissiniBlinking) return;
    
    this.isGrissiniBlinking = true;
    this.grissiniBlinkProgress = 0;
    
    const closingDuration = 45;
    const closedDuration = 25;
    const openingDuration = 110;
    const totalDuration = closingDuration + closedDuration + openingDuration;
    const startTime = performance.now();
    
    const animateBlink = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (elapsed < closingDuration) {
        this.grissiniBlinkProgress = elapsed / closingDuration;
      } else if (elapsed < closingDuration + closedDuration) {
        this.grissiniBlinkProgress = 1;
      } else if (elapsed < totalDuration) {
        this.grissiniBlinkProgress = 1 - (elapsed - closingDuration - closedDuration) / openingDuration;
      } else {
        this.grissiniBlinkProgress = 0;
        this.isGrissiniBlinking = false;
        this.scheduleGrissiniBlink();
        return;
      }
      
      requestAnimationFrame(animateBlink);
    };
    
    requestAnimationFrame(animateBlink);
  }

  private updateGrissiniLook() {
    if (!this.grissiniFaceGroup) return;

    this.updateGrissiniBodyPose();
    this.grissiniFocusFaceShiftX += (this.grissiniFocusFaceShiftTargetX - this.grissiniFocusFaceShiftX) * 0.1;
    this.grissiniLookToPizzaX += (this.grissiniLookToPizzaTargetX - this.grissiniLookToPizzaX) * 0.11;
    this.grissiniLookToPizzaY += (this.grissiniLookToPizzaTargetY - this.grissiniLookToPizzaY) * 0.11;
    const smooth = 0.22;
    this.grissiniCurrentX += (this.grissiniTargetX - this.grissiniCurrentX) * smooth;
    this.grissiniCurrentY += (this.grissiniTargetY - this.grissiniCurrentY) * smooth;

    const lookUpLock = Math.max(0, Math.min(1, Math.abs(this.grissiniLookToPizzaY)));
    const mouseLookWeight = 1 - lookUpLock;
    const lookX = Math.max(-1, Math.min(1, this.grissiniCurrentX * mouseLookWeight + this.grissiniLookToPizzaX));
    const lookY = Math.max(-1, Math.min(1, this.grissiniCurrentY * mouseLookWeight + this.grissiniLookToPizzaY));
    const tiltShift = this.grissiniBodyShiftX + this.grissiniBodyTilt;
    const bendShift = this.grissiniBodyBend;
    const topShift = tiltShift + bendShift;
    const bodyFaceShiftX = this.getGrissiniBodyShiftAtY(85.5, tiltShift, bendShift);
    const faceMouseX = this.grissiniCurrentX * mouseLookWeight;
    const faceMouseY = this.grissiniCurrentY * mouseLookWeight;
    const lookUpFaceShiftY = this.grissiniLookToPizzaY * 2.0;
    const faceShiftX = faceMouseX * this.grissiniMaxFaceShiftX + this.grissiniFocusFaceShiftX + bodyFaceShiftX;
    const faceShiftY = faceMouseY * 4 + lookUpFaceShiftY;
    const faceTilt = topShift * 0.22;
    const clampedFaceShiftX = Math.max(-30, Math.min(24, faceShiftX));

    this.grissiniFaceGroup.setAttribute(
      'transform',
      `translate(${clampedFaceShiftX.toFixed(2)}, ${faceShiftY.toFixed(2)}) rotate(${faceTilt.toFixed(2)} 176.5 85.5)`
    );
    if (this.grissiniLeftPupil && this.grissiniRightPupil) {
      let offsetX = lookX * this.grissiniMaxPupilOffsetX;
      let offsetY = lookY * this.grissiniMaxPupilOffsetY;

      offsetX = Math.max(-this.grissiniMaxPupilOffsetX, Math.min(this.grissiniMaxPupilOffsetX, offsetX));
      offsetY = Math.max(-this.grissiniMaxPupilOffsetY, Math.min(this.grissiniMaxPupilOffsetY, offsetY));

      this.grissiniLeftPupil.setAttribute('cx', (this.origGrissiniLeftPupil.cx + offsetX).toFixed(2));
      this.grissiniLeftPupil.setAttribute('cy', (this.origGrissiniLeftPupil.cy + offsetY).toFixed(2));
      this.grissiniRightPupil.setAttribute('cx', (this.origGrissiniRightPupil.cx + offsetX).toFixed(2));
      this.grissiniRightPupil.setAttribute('cy', (this.origGrissiniRightPupil.cy + offsetY).toFixed(2));
    }
    const blinkScale = 1 - this.grissiniBlinkProgress * 0.94;
    const newRy = this.origGrissiniLeftWhite.ry * blinkScale;
    const isPupilHiddenByBlink = this.isGrissiniBlinking;
    
    if (this.grissiniLeftWhite && this.grissiniRightWhite) {
      this.grissiniLeftWhite.setAttribute('ry', newRy.toFixed(3));
      this.grissiniRightWhite.setAttribute('ry', newRy.toFixed(3));
    }

    if (this.grissiniLeftPupil && this.grissiniRightPupil) {
      const pupilOpacity = isPupilHiddenByBlink ? '0' : '1';
      this.grissiniLeftPupil.setAttribute('opacity', pupilOpacity);
      this.grissiniRightPupil.setAttribute('opacity', pupilOpacity);
    }
  }
  private initMochiAnimation() {
    const svg = this.charactersSvg?.nativeElement;
    if (!svg) return;

    const bodyPath = svg.querySelector('#mochi_body path') as SVGPathElement;
    const faceGroup = svg.querySelector('#mochi_face') as SVGGElement;
    const leftEye = svg.querySelector('#mochi_left_eye') as SVGEllipseElement;
    const rightEye = svg.querySelector('#mochi_right_eye') as SVGEllipseElement;
    const mouth = svg.querySelector('#mochi_mouth') as SVGPathElement;

    if (!bodyPath || !faceGroup || !leftEye || !rightEye || !mouth) return;

    this.mouthElement = mouth;

    this.originalLeftEye = {
      cx: parseFloat(leftEye.getAttribute('cx') || '87.5'),
      cy: parseFloat(leftEye.getAttribute('cy') || '164.5'),
      rx: parseFloat(leftEye.getAttribute('rx') || '2.5'),
      ry: parseFloat(leftEye.getAttribute('ry') || '2.5')
    };
    this.originalRightEye = {
      cx: parseFloat(rightEye.getAttribute('cx') || '112.5'),
      cy: parseFloat(rightEye.getAttribute('cy') || '164.5'),
      rx: parseFloat(rightEye.getAttribute('rx') || '2.5'),
      ry: parseFloat(rightEye.getAttribute('ry') || '2.5')
    };

    this.scheduleBlink();

    const animate = () => {
      this.updateMochiStretch(bodyPath, faceGroup, leftEye, rightEye, mouth);
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
    document.addEventListener('mousemove', this.boundMouseMove);
  }

  private scheduleBlink() {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    const nextBlink = 500 + Math.random() * 1000;
    this.blinkTimer = setTimeout(() => this.startBlink(), nextBlink);
  }

  private startBlink() {
    if (this.isBlinking) return;
    
    this.isBlinking = true;
    this.blinkProgress = 0;
    
    const closingDuration = 50;
    const closedDuration = 30;
    const openingDuration = 120;
    const totalDuration = closingDuration + closedDuration + openingDuration;
    const startTime = performance.now();
    
    const animateBlink = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (elapsed < closingDuration) {
        this.blinkProgress = elapsed / closingDuration;
      } else if (elapsed < closingDuration + closedDuration) {
        this.blinkProgress = 1;
      } else if (elapsed < totalDuration) {
        this.blinkProgress = 1 - (elapsed - closingDuration - closedDuration) / openingDuration;
      } else {
        this.blinkProgress = 0;
        this.isBlinking = false;
        this.scheduleBlink();
        return;
      }
      
      requestAnimationFrame(animateBlink);
    };
    
    requestAnimationFrame(animateBlink);
  }

  private updateMochiStretch(
    bodyPath: SVGPathElement,
    faceGroup: SVGGElement,
    leftEye: SVGEllipseElement,
    rightEye: SVGEllipseElement,
    mouth: SVGPathElement
  ) {
    const smoothFactor = 0.18;
    this.currentX += (this.targetX - this.currentX) * smoothFactor;
    this.currentY += (this.targetY - this.currentY) * smoothFactor;

    this.focusFaceShiftX += (this.focusFaceShiftTargetX - this.focusFaceShiftX) * 0.03;

    const maxBodyStretch = 28;
    const stretchX = this.currentX * maxBodyStretch;
    const stretchY = this.currentY * maxBodyStretch * 0.5;

    const jiggleWave = Math.sin(this.nodProgress * Math.PI * 2) * 0.3;
    const nodStretch = this.nodProgress * 5 + jiggleWave * 3;
    
    const bottomY = 193.5;
    const heightRange = bottomY - 128;

    const shift = (x: number, y: number): [number, number] => {
      if (y >= bottomY) return [x, y];
      const k = Math.min(1, (bottomY - y) / heightRange);
      const jiggle = jiggleWave * k * 2;
      return [
        x + stretchX * k + jiggle * 0.5,
        y + (stretchY + nodStretch) * k + jiggle * 0.3
      ];
    };

    const m  = shift(150, 193.5);
    const c1 = shift(150, 176.128);
    const c2 = shift(143.099, 159.468);
    const c3 = shift(130.815, 147.185);
    const c4 = shift(118.532, 134.901);
    const c5 = shift(101.872, 128);
    const c6 = shift(84.5, 128);
    const c7 = shift(67.1283, 128);
    const c8 = shift(50.4681, 134.901);
    const c9 = shift(38.1845, 147.184);
    const c10 = shift(25.9009, 159.468);
    const c11 = shift(19, 176.128);
    const c12 = shift(19, 193.5);
    const l   = shift(84.5, 193.5);

    const newPath = `M${m[0]} ${m[1]} C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${c3[0]} ${c3[1]} C${c4[0]} ${c4[1]}, ${c5[0]} ${c5[1]}, ${c6[0]} ${c6[1]} C${c7[0]} ${c7[1]}, ${c8[0]} ${c8[1]}, ${c9[0]} ${c9[1]} C${c10[0]} ${c10[1]}, ${c11[0]} ${c11[1]}, ${c12[0]} ${c12[1]} L${l[0]} ${l[1]} H150 Z`;
    bodyPath.setAttribute('d', newPath);

    const eyeLevelY = 164.5;
    const kEye = (bottomY - eyeLevelY) / heightRange;
    const bodyShiftAtEyesX = stretchX * kEye;
    const bodyShiftAtEyesY = (stretchY + nodStretch) * kEye;

    let extraShiftX: number;
    if (this.currentX > 0) {
      extraShiftX = Math.min(this.currentX * 2, 6);
    } else {
      extraShiftX = this.currentX * 14;
    }

    const faceShiftX = bodyShiftAtEyesX + extraShiftX + this.focusFaceShiftX;
    const faceShiftY = bodyShiftAtEyesY + this.currentY * 2;
    const nodShiftY = this.nodProgress * 4;

    const maxFaceShiftX = 15;
    const clampedFaceShiftX = Math.min(faceShiftX, maxFaceShiftX);

    let faceTilt = 0;
    if (this.currentY < -0.1) {
      faceTilt = -this.currentX * 3;
    }
    if (this.isNodding && this.nodProgress > 0.3) {
      const nodTilt = (this.nodProgress - 0.3) * 5 * this.nodSpeed;
      if (this.currentX > 0.1) {
        faceTilt -= nodTilt;
      } else if (this.currentX < -0.1) {
        faceTilt += nodTilt;
      }
    }
    faceGroup.setAttribute(
      'transform',
      `translate(${clampedFaceShiftX.toFixed(2)}, ${(faceShiftY + nodShiftY).toFixed(2)}) rotate(${faceTilt.toFixed(2)}, ${102.5 + clampedFaceShiftX}, ${164.5 + faceShiftY + nodShiftY})`
    );

    const blinkScale = 1 - this.blinkProgress * 0.95;

    let targetLeftOffset = 0;
    let targetRightOffset = 0;
    
    if (this.currentY < -0.1) {
      if (this.currentX < -0.1) {
        targetLeftOffset = -5 * Math.abs(this.currentX) * Math.abs(this.currentY);
      } else if (this.currentX > 0.1) {
        targetRightOffset = -5 * Math.abs(this.currentX) * Math.abs(this.currentY);
      }
    }
    if (this.isNodding) {
      const eyeWave = (this.nodProgress - 0.15) * 12;
      targetLeftOffset += eyeWave;
      targetRightOffset += eyeWave;
    }
    
    this.smoothLeftEyeOffset += (targetLeftOffset - this.smoothLeftEyeOffset) * 0.2;
    this.smoothRightEyeOffset += (targetRightOffset - this.smoothRightEyeOffset) * 0.2;
    
    const finalLeftOffset = Math.max(-8, Math.min(8, this.smoothLeftEyeOffset));
    const finalRightOffset = Math.max(-8, Math.min(8, this.smoothRightEyeOffset));
    
    const baseY = this.originalLeftEye.cy + faceShiftY + nodShiftY;
    
    leftEye.setAttribute('cx', (this.originalLeftEye.cx + clampedFaceShiftX).toFixed(2));
    leftEye.setAttribute('cy', (baseY + finalLeftOffset).toFixed(2));
    leftEye.setAttribute('ry', (this.originalLeftEye.ry * blinkScale).toFixed(2));
    
    rightEye.setAttribute('cx', (this.originalRightEye.cx + clampedFaceShiftX).toFixed(2));
    rightEye.setAttribute('cy', (baseY + finalRightOffset).toFixed(2));
    rightEye.setAttribute('ry', (this.originalRightEye.ry * blinkScale).toFixed(2));

    const targetMouthTilt = -this.currentX * 12;
    this.smoothMouthTilt += (targetMouthTilt - this.smoothMouthTilt) * 0.2;
    const finalMouthTilt = Math.max(-15, Math.min(15, this.smoothMouthTilt));
    
    mouth.setAttribute(
      'transform',
      `translate(${clampedFaceShiftX.toFixed(2)}, ${(faceShiftY + nodShiftY).toFixed(2)}) rotate(${finalMouthTilt.toFixed(2)}, 102.5, 170)`
    );

    if (this.mouthElement) {
      const mouthPath = this.mouthTransitionProgress > 0.5 ? this.surprisedMouthD : this.normalMouthD;
      this.mouthElement.setAttribute('d', mouthPath);
    }
  }
  private initPizzaAnimation() {
    const svg = this.charactersSvg?.nativeElement;
    if (!svg) return;

    this.pizzaFaceGroup = svg.querySelector('#pizza_face') as SVGGElement;
    this.pizzaLeftPupil = svg.querySelector('#pizza_left_pupil') as SVGCircleElement;
    this.pizzaRightPupil = svg.querySelector('#pizza_right_pupil') as SVGCircleElement;
    this.pizzaLeftWhite = svg.querySelector('#pizza_left_eye_white') as SVGEllipseElement;
    this.pizzaRightWhite = svg.querySelector('#pizza_right_eye_white') as SVGEllipseElement;
    this.pizzaMouth = svg.querySelector('#pizza_mouth') as SVGPathElement;
    this.pizzaBodyGroup = svg.querySelector('#pizza_body') as SVGGElement;

    if (!this.pizzaFaceGroup || !this.pizzaLeftPupil || !this.pizzaRightPupil ||
        !this.pizzaLeftWhite || !this.pizzaRightWhite || !this.pizzaMouth || !this.pizzaBodyGroup) {
      console.warn('Pizza elements not found');
      return;
    }

    this.origLeftPupil = {
      cx: parseFloat(this.pizzaLeftPupil.getAttribute('cx') || '144'),
      cy: parseFloat(this.pizzaLeftPupil.getAttribute('cy') || '49'),
      r: parseFloat(this.pizzaLeftPupil.getAttribute('r') || '1')
    };
    this.origRightPupil = {
      cx: parseFloat(this.pizzaRightPupil.getAttribute('cx') || '165'),
      cy: parseFloat(this.pizzaRightPupil.getAttribute('cy') || '49'),
      r: parseFloat(this.pizzaRightPupil.getAttribute('r') || '1')
    };
    this.origLeftWhite = {
      cx: parseFloat(this.pizzaLeftWhite.getAttribute('cx') || '140'),
      cy: parseFloat(this.pizzaLeftWhite.getAttribute('cy') || '52'),
      rx: parseFloat(this.pizzaLeftWhite.getAttribute('rx') || '3'),
      ry: parseFloat(this.pizzaLeftWhite.getAttribute('ry') || '3')
    };
    this.origRightWhite = {
      cx: parseFloat(this.pizzaRightWhite.getAttribute('cx') || '161'),
      cy: parseFloat(this.pizzaRightWhite.getAttribute('cy') || '52'),
      rx: parseFloat(this.pizzaRightWhite.getAttribute('rx') || '3'),
      ry: parseFloat(this.pizzaRightWhite.getAttribute('ry') || '3')
    };

    this.pizzaFaceGroup.setAttribute('transform', 'translate(0, 0)');
    this.pizzaBodyGroup.setAttribute('transform', '');

    const animatePizza = () => {
      this.updatePizzaLook();
      this.pizzaAnimationFrame = requestAnimationFrame(animatePizza);
    };
    this.pizzaAnimationFrame = requestAnimationFrame(animatePizza);

    this.schedulePizzaBlink();
  }

  private schedulePizzaBlink() {
    if (this.pizzaBlinkTimer) clearTimeout(this.pizzaBlinkTimer);
    const nextBlink = 550 + Math.random() * 1100;
    this.pizzaBlinkTimer = setTimeout(() => this.startPizzaBlink(), nextBlink);
  }

  private startPizzaBlink() {
    if (this.isPizzaBlinking) return;
    
    this.isPizzaBlinking = true;
    this.pizzaBlinkProgress = 0;
    
    const closingDuration = 45;
    const closedDuration = 25;
    const openingDuration = 110;
    const totalDuration = closingDuration + closedDuration + openingDuration;
    const startTime = performance.now();
    
    const animateBlink = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (elapsed < closingDuration) this.pizzaBlinkProgress = elapsed / closingDuration;
      else if (elapsed < closingDuration + closedDuration) this.pizzaBlinkProgress = 1;
      else if (elapsed < totalDuration) this.pizzaBlinkProgress = 1 - (elapsed - closingDuration - closedDuration) / openingDuration;
      else {
        this.pizzaBlinkProgress = 0;
        this.isPizzaBlinking = false;
        this.schedulePizzaBlink();
        return;
      }
      requestAnimationFrame(animateBlink);
    };
    
    requestAnimationFrame(animateBlink);
  }

  private updatePizzaLook() {
    if (!this.pizzaFaceGroup || !this.pizzaBodyGroup) return;

    this.pizzaFocusFaceShiftX +=
      (this.pizzaFocusFaceShiftTargetX - this.pizzaFocusFaceShiftX) * 0.1;

    const baseTilt = this.pizzaFocusFaceShiftTargetX > 0 ? 12 : 0;
    const extraTiltTarget = this.pizzaExtraTiltActive ? 10 : 0;

    this.pizzaBodyTilt += (baseTilt - this.pizzaBodyTilt) * 0.06;
    this.pizzaExtraTilt += (extraTiltTarget - this.pizzaExtraTilt) * 0.06;
    const finalTilt = this.pizzaBodyTilt + this.pizzaExtraTilt;

    this.pizzaBodyGroup.setAttribute(
      'transform',
      `rotate(${finalTilt.toFixed(2)} 150 100)`
    );

    const smooth = 0.22;
    this.pizzaCurrentX += (this.pizzaTargetX - this.pizzaCurrentX) * smooth;
    this.pizzaCurrentY += (this.pizzaTargetY - this.pizzaCurrentY) * smooth;

    this.pizzaLookDownAmount += (this.pizzaLookDownTarget - this.pizzaLookDownAmount) * 0.15;
    this.pizzaFaceShiftDown += (this.pizzaFaceShiftDownTarget - this.pizzaFaceShiftDown) * 0.15;

    const faceShiftX = this.pizzaCurrentX * 13 + this.pizzaFocusFaceShiftX;
    const faceShiftY = this.pizzaCurrentY * 9 + this.pizzaFaceShiftDown;
    this.pizzaFaceGroup.setAttribute(
      'transform',
      `translate(${faceShiftX.toFixed(2)}, ${faceShiftY.toFixed(2)})`
    );

    let offsetX = this.pizzaCurrentX * this.maxPupilOffsetX;
    let offsetY = this.pizzaCurrentY * this.maxPupilOffsetY + this.pizzaLookDownAmount;

    offsetX = Math.max(-this.maxPupilOffsetX, Math.min(this.maxPupilOffsetX, offsetX));
    offsetY = Math.max(-this.maxPupilOffsetY, Math.min(this.maxPupilOffsetY, offsetY));

    this.pizzaLeftPupil.setAttribute('cx', (this.origLeftPupil.cx + offsetX).toFixed(2));
    this.pizzaLeftPupil.setAttribute('cy', (this.origLeftPupil.cy + offsetY).toFixed(2));
    this.pizzaRightPupil.setAttribute('cx', (this.origRightPupil.cx + offsetX).toFixed(2));
    this.pizzaRightPupil.setAttribute('cy', (this.origRightPupil.cy + offsetY).toFixed(2));

    const blinkScale = 1 - this.pizzaBlinkProgress * 0.94;
    
    this.pizzaLeftWhite.setAttribute('ry', (this.origLeftWhite.ry * blinkScale).toFixed(3));
    this.pizzaRightWhite.setAttribute('ry', (this.origRightWhite.ry * blinkScale).toFixed(3));
  }

  private onMouseMove(e: MouseEvent) {
    const svg = this.charactersSvg?.nativeElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mochiHeadX = 102.5;
    const mochiHeadY = 172;
    const mochiScreenX = rect.left + (mochiHeadX / 274) * rect.width;
    const mochiScreenY = rect.top + (mochiHeadY / 218) * rect.height;
    let dx = e.clientX - mochiScreenX;
    let dy = e.clientY - mochiScreenY;
    let dist = Math.hypot(dx, dy);
    let strength = Math.min(1, dist / 250);
    if (dist > 0) {
      this.targetX = (dx / dist) * strength;
      this.targetY = (dy / dist) * strength;
    } else {
      this.targetX = 0;
      this.targetY = 0;
    }
    const pizzaCenterX = 150;
    const pizzaCenterY = 67;
    const pizzaScreenX = rect.left + (pizzaCenterX / 274) * rect.width;
    const pizzaScreenY = rect.top + (pizzaCenterY / 218) * rect.height;
    dx = e.clientX - pizzaScreenX;
    dy = e.clientY - pizzaScreenY;
    dist = Math.hypot(dx, dy);
    strength = Math.min(1, dist / 230);
    if (dist > 0) {
      this.pizzaTargetX = (dx / dist) * strength;
      this.pizzaTargetY = (dy / dist) * strength;
    } else {
      this.pizzaTargetX = 0;
      this.pizzaTargetY = 0;
    }
    const grissiniHeadX = 176;
    const grissiniHeadY = 90;
    const grissiniScreenX = rect.left + (grissiniHeadX / 274) * rect.width;
    const grissiniScreenY = rect.top + (grissiniHeadY / 218) * rect.height;
    dx = e.clientX - grissiniScreenX;
    dy = e.clientY - grissiniScreenY;
    dist = Math.hypot(dx, dy);
    strength = Math.min(1, dist / 200);
    if (dist > 0) {
      this.grissiniTargetX = (dx / dist) * strength;
      this.grissiniTargetY = (dy / dist) * strength;
    } else {
      this.grissiniTargetX = 0;
      this.grissiniTargetY = 0;
    }
  }
}