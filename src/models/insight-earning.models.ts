export class EarningInsight {
    total_earnings: number;
    earnings_chart_data: Array<{ period: string, total: string }>;

    constructor() {
        this.total_earnings = 0;
        this.earnings_chart_data = [{ period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }];
    }
}