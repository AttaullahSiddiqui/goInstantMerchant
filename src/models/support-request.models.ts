export class SupportRequest {
    name: string;
    email: string;
    message: string;
    mobile_number: string;

    constructor(name: string, email: string, mobile_number: string) {
        this.name = name;
        this.email = email;
        this.mobile_number = mobile_number;
        this.message = "";
    }
}