import { Constants } from './constants.models';
import { AuthResponse } from './auth-response.models';
import { User } from './user.models';
import { MyAddress } from './address.models';
import { MyMeta } from './meta.models';
import { MyNotification } from './notification.models';
import { Profile } from './profile.models';
import { BankDetail } from './bank-detail.models';
import * as moment from 'moment';

export class Helper {
    static formatDuration(durationInSeconds: number): string {
        if (!durationInSeconds) durationInSeconds = 0;
        return moment.utc(durationInSeconds * 1000).format('mm:ss');
    }
    static formatDistance(distance: number, distanceMetric: string): string {
        if (!distance) distance = 0;
        let divider: number = (distanceMetric == "km") ? 1000 : 1609.34;
        return Number(distance / divider).toFixed(2);
    }
    static formatPhone(phone: string): string {
        let toReturn = phone.replace(/\s/g, '');
        while (toReturn.startsWith("0")) toReturn = toReturn.substring(1);
        return toReturn;
    }
    static getBankDetail(): BankDetail {
        return JSON.parse(window.localStorage.getItem(Constants.KEY_BANK_DETAIL));
    }
    static setBankDetail(bd: BankDetail) {
        window.localStorage.setItem(Constants.KEY_BANK_DETAIL, JSON.stringify(bd));
    }
    static setProfile(profile: Profile) {
        window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(profile));
    }

    static getProfile(): Profile {
        return JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
    }

    static setLocationDefault(location: MyAddress) {
        window.localStorage.setItem(Constants.KEY_LOCATION_DEFAULT, JSON.stringify(location));
    }

    static getLocationDefault(): MyAddress {
        return JSON.parse(window.localStorage.getItem(Constants.KEY_LOCATION_DEFAULT));
    }

    static setSettings(settings: Array<MyMeta>) {
        window.localStorage.setItem(Constants.KEY_SETTINGS, JSON.stringify(settings));
    }
    static getSettings(): Array<MyMeta> {
        return JSON.parse(window.localStorage.getItem(Constants.KEY_SETTINGS));
    }
    static setLoggedInUser(user: User) {
        window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(user));
    }
    static setDefaultThemeMode(status){
        window.localStorage.setItem(Constants.KEY_DARK_MODE, status);
    }
    static getThemeMode(){
       return window.localStorage.getItem(Constants.KEY_DARK_MODE);
    }
    static setLoggedInUserResponse(authRes: AuthResponse) {
        window.localStorage.removeItem(Constants.KEY_USER);
        window.localStorage.removeItem(Constants.KEY_PROFILE);
        window.localStorage.removeItem(Constants.KEY_TOKEN);
        window.localStorage.removeItem(Constants.KEY_ADDRESS);
        window.localStorage.removeItem(Constants.KEY_ADDRESSES);
        window.localStorage.removeItem(Constants.KEY_NOTIFICATIONS);

        if (authRes && authRes.user && authRes.token) {
            window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(authRes.user));
            window.localStorage.setItem(Constants.KEY_TOKEN, authRes.token);
        }
    }
    static getToken() {
        return window.localStorage.getItem(Constants.KEY_TOKEN);
    }
    static getChatChild(userId: string, myId: string) {
        //example: userId="9" and myId="5" -->> chat child = "5-9"
        let values = [userId, myId];
        values.sort((one, two) => (one > two ? -1 : 1));
        return values[0] + "-" + values[1];
    }
    static getLoggedInUser() {
        return JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    }

    // static getAddressSelected(): MyAddress {
    //     return JSON.parse(window.localStorage.getItem(Constants.KEY_ADDRESS));
    // }
    static getLocale(): string {
        let sl = window.localStorage.getItem(Constants.KEY_LOCALE);
        return sl && sl.length ? sl : "en";
    }
    static getLanguageDefault(): string {
        return window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    }
    static setLanguageDefault(language: string) {
        window.localStorage.setItem(Constants.KEY_DEFAULT_LANGUAGE, language);
    }
    static setLocale(lc) {
        window.localStorage.setItem(Constants.KEY_LOCALE, lc);
    }
    static setAddressSelected(location: MyAddress) {
        window.localStorage.setItem(Constants.KEY_ADDRESS, JSON.stringify(location));
    }
    static getSetting(settingKey: string) {
        let settings: Array<MyMeta> = this.getSettings();
        let toReturn: string;
        if (settings) {
            for (let s of settings) {
                if (s.key == settingKey) {
                    toReturn = s.value;
                    break;
                }
            }
        }
        if (!toReturn) toReturn = "";
        return toReturn;
    }
    static getSettingsValue(settingKeys: Array<string>) {
        let settings: Array<MyMeta> = this.getSettings();
        let toReturn = new Array<string>();
        if (settings) {
            for (let settingKey of settingKeys) {
                for (let s of settings) {
                    if (s.key == settingKey) {
                        toReturn.push(s.value);
                        break;
                    }
                }
            }
        }
        return toReturn;
    }
    static saveNotification(notiTitle: string, notiBody: string, notiTime: string) {
        let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
        if (!notifications) notifications = new Array<MyNotification>();
        notifications.push(new MyNotification(notiTitle, notiBody, notiTime));
        window.localStorage.setItem(Constants.KEY_NOTIFICATIONS, JSON.stringify(notifications));
    }
    static formatMillisDateTime(millis: number, locale: string): string {
        return moment(millis).locale(locale).format("ddd, MMM D, HH:mm");
    }
    static formatTimestampDateTime(timestamp: string, locale: string): string {
        return moment(timestamp).locale(locale).format("ddd, MMM D, HH:mm");
    }
    static formatMillisDate(millis: number, locale: string): string {
        return moment(millis).locale(locale).format("Do MMM YYYY");
    }
    static formatTimestampDate(timestamp: string, locale: string): string {
        return moment(timestamp).locale(locale).format("Do MMM YYYY");
    }
    static formatMillisTime(millis: number, locale: string): string {
        return moment(millis).locale(locale).format("HH:mm");
    }
    static formatTimestampTime(timestamp: string, locale: string): string {
        return moment(timestamp).locale(locale).format("HH:mm");
    }
}