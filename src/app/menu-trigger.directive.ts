import {
  Directive,
  Input,
  ElementRef,
  OnInit,
  HostListener,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  AfterViewInit
} from "@angular/core";
import {
  Overlay,
  OverlayConfig,
  FlexibleConnectedPositionStrategy,
  ConnectionPositionPair,
  OverlayRef
} from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import { POSITION_MAP } from "./connection-position-pair";
import { merge, Subscription, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { ESCAPE, hasModifierKey } from "@angular/cdk/keycodes";

enum MenuState {
  closed = "closed",
  opened = "opened"
}

@Directive({
  selector: "[appMenuTrigger]"
})
export class MenuTriggerDirective implements OnInit, OnDestroy, AfterViewInit {
  @Input() appMenuTrigger: TemplateRef<any>;
  @Input() menuPosition: string = "rightTop";
  @Input() triggerBy: "click" | "hover" | null = "click";

  private portal: TemplatePortal;
  private positions: ConnectionPositionPair[] = [
    POSITION_MAP.right,
    POSITION_MAP.left
  ];
  private overlayRef: OverlayRef;
  private menuState = MenuState.closed;
  private subscription = Subscription.EMPTY;
  private readonly hover$ = new Subject<boolean>();
  private readonly click$ = new Subject<boolean>();

  constructor(
    private el: ElementRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    console.log(this.el);
  }

  ngAfterViewInit(): void {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent) {
    if (!this.appMenuTrigger) {
      return;
    } else {
      this.click$.next(true);
    }
  }

  @HostListener("mouseenter", ["$event"])
  onMouseEnter() {
    this.hover$.next(true);
  }

  @HostListener("mouseleave", ["$event"])
  onMouseLeave() {
    this.hover$.next(false);
  }

  public openMenu() {
    if (this.menuState === MenuState.opened) return;
    const overlayConfig = this.getOverlayConfig();
    this.setOverlayPosition(
      overlayConfig.positionStrategy as FlexibleConnectedPositionStrategy
    );
    const overlayRef = this.overlay.create(overlayConfig);
    overlayRef.attach(this.getPortal());
    this.subscribeOverlayEvent(overlayRef);
    this.overlayRef = overlayRef;
    this.menuState = MenuState.opened;
  }

  public closeMenu() {
    if (this.overlayRef && this.menuState === MenuState.opened) {
      this.overlayRef.detach();
      this.menuState = MenuState.closed;
    }
  }

  private initialize() {
    const handle$ = this.triggerBy === "hover" ? this.hover$ : this.click$;
    handle$.subscribe(value => {
      if (value) {
        this.openMenu();
      } else {
        this.closeMenu();
      }
    });
  }

  private getOverlayConfig(): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.el);
    return new OverlayConfig({
      positionStrategy,
      minWidth: "200px",
      hasBackdrop: true,
      backdropClass: "w-menu-backdrop",
      panelClass: "w-menu-panel",
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
  }

  private setOverlayPosition(
    positionStrategy: FlexibleConnectedPositionStrategy
  ) {
    positionStrategy.withPositions([...this.positions]);
  }

  private getPortal(): TemplatePortal {
    if (!this.portal || this.portal.templateRef !== this.appMenuTrigger) {
      this.portal = new TemplatePortal<any>(
        this.appMenuTrigger,
        this.viewContainerRef
      );
    }
    return this.portal;
  }

  private subscribeOverlayEvent(overlayRef: OverlayRef) {
    this.subscription.unsubscribe();
    this.subscription = merge(
      overlayRef.backdropClick(),
      overlayRef.detachments(),
      overlayRef
        .keydownEvents()
        .pipe(
          filter(event => event.keyCode === ESCAPE && !hasModifierKey(event))
        )
    ).subscribe(() => {
      this.closeMenu();
    });
  }
}
