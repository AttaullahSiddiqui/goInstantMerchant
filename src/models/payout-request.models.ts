import { Helper } from './helper.models';

export class PayoutRequest {
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    bank_code: string;
    amount: number;

    constructor() {
        let savedBankDetail = Helper.getBankDetail();
        if (savedBankDetail != null) {
            this.bank_name = savedBankDetail.bank_name;
            this.bank_account_name = savedBankDetail.bank_account_name;
            this.bank_account_number = savedBankDetail.bank_account_number;
        }
    }
}