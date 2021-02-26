import { Constants } from './constants.models';

export class SocialLoginRequest {
    platform: string;
    token: string;
    os: string;
    role: string;
    constructor(token: string, platform: string, os: string) {
        this.token = token;
        this.platform = platform;
        this.os = os;
        this.role = Constants.ROLE_VENDOR;
    }
}