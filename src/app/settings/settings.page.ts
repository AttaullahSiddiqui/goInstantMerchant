import { Component, OnInit, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app.config';
import { Constants } from 'src/models/constants.models';
import { MyEventsService } from '../services/events/my-events.service';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  defaultLanguageCode;
  languages: Array<{ code: string, name: string }>;
  darkModeStatus: string | boolean;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private myEvent: MyEventsService) {
    this.darkModeStatus = Helper.getThemeMode();
    this.languages = this.config.availableLanguages;
    this.defaultLanguageCode = config.availableLanguages[0].code;
    let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    if (defaultLang) this.defaultLanguageCode = defaultLang;
  }

  ngOnInit() {
  }

  onLanguageClick(language) {
    this.defaultLanguageCode = language.code;
  }

  languageConfirm() {
    this.myEvent.setLanguageData(this.defaultLanguageCode);
    window.localStorage.setItem(Constants.KEY_DEFAULT_LANGUAGE, this.defaultLanguageCode);
  }
  onDarkMode(event) {
    if (event.detail.checked) {
      document.body.setAttribute('class', 'dark-theme');
    }
    else {
      document.body.setAttribute('class', 'light-theme');
    }
    Helper.setDefaultThemeMode(this.darkModeStatus);
  }

}
