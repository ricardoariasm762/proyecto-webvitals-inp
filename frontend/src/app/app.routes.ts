import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Event Loop & INP Telemetry Auditor'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
