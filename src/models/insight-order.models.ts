export class OrderInsight {
    orders_count: number;
    distance_travelled: number;
    earnings: number;
    orders_chart_data: Array<{ period: string, total: string }>;

    constructor() {
        this.orders_count = 0;
        this.distance_travelled = 0;
        this.earnings = 0;
        this.orders_chart_data = [{ period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }];
    }
}