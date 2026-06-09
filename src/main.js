import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/legacy-bridge.css';

import { initRouter } from './js/router.js';
import { initAuth } from './js/auth.js';
import { initProjects } from './js/projects.js';
import { initConditions } from './js/conditions.js';
import { initNotifications } from './js/notifications.js';
import { initSettings } from './js/settings.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Modules
  initRouter();
  initAuth();
  initProjects();
  initConditions();
  initNotifications();
  initSettings();
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.log('SW Registration Failed', err));
    });
  }
  
  console.log('SITE-MASTER v3 Initialized');
});
