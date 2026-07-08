import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { adminGuard } from "./core/guards/admin.guard";
export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/register.component").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/shell/shell.component").then((m) => m.ShellComponent),
    children: [
      {
        path: "home",
        loadComponent: () =>
          import("./features/home/home.component").then((m) => m.HomeComponent),
      },
      {
        path: "formazione",
        loadComponent: () =>
          import("./features/lineup/lineup.component").then(
            (m) => m.LineupComponent,
          ),
      },
      {
        path: "classifica",
        loadComponent: () =>
          import("./features/leaderboard/leaderboard.component").then(
            (m) => m.LeaderboardComponent,
          ),
      },
      {
        path: "calendario",
        loadComponent: () =>
          import("./features/calendar/calendar.component").then(
            (component) => component.CalendarComponent,
          ),
      },
      {
        path: "squadre",
        loadComponent: () =>
          import("./features/squads/squads.component").then(
            (component) => component.SquadsComponent,
          ),
      },
      {
        path: "admin",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/admin/admin.component").then(
            (m) => m.AdminComponent,
          ),
      },
      { path: "", redirectTo: "home", pathMatch: "full" },
    ],
  },
  { path: "**", redirectTo: "" },
];
