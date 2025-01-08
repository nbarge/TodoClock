import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Main function that starts the Angular application.
 */
function main() {
  // Bootstrap the application with the AppComponent and appConfig.
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}

// Call the main function to start the application.
main();