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
  icon = input.required<string>();
  iconSrc = input<string>('');
  title = input.required<string>();
  subtitle = input<string>("");
  actions = input<SectionHeaderAction[]>([]);

  actionClick = output<string>();

  onActionClick(actionId: string): void {
    this.actionClick.emit(actionId);
  }
}
