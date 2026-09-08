import { Component, input, output } from "@angular/core";

export interface SectionHeaderAction {
  id: string;
  icon: string;
  label: string;
}

@Component({
  selector: "app-section-header",
  standalone: true,
  templateUrl: "./section-header.component.html",
  styleUrl: "./section-header.component.scss",
})
export class SectionHeaderComponent {
  icon = input<string>("");
  iconSrc = input<string>("");

  iconClickable = input<boolean>(false);
  iconLabel = input<string>("");

  title = input.required<string>();
  subtitle = input<string>("");

  actions = input<SectionHeaderAction[]>([]);

  iconClick = output<void>();
  actionClick = output<string>();

  onIconClick(): void {
    if (!this.iconClickable()) {
      return;
    }

    this.iconClick.emit();
  }

  onActionClick(actionId: string): void {
    this.actionClick.emit(actionId);
  }
}
