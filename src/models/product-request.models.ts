import { Product } from './product.models';

export class ProductRequest {
    title: string;
    detail: string;
    price: number;
    vendor_id: number;
    categories: Array<number>;
    image_urls: Array<string>;
    stock_quantity: string;
    meta: any;

    constructor() {
        this.categories = new Array();
        this.image_urls = new Array();
        this.stock_quantity = "-1";
        this.meta = { "food_type": "veg" };
        this.detail = 'empty_detail';
    }

    static fromProduct(product: Product): ProductRequest {
        let pr = new ProductRequest();
        pr.title = product.title;
        // pr.detail = product.detail;
        pr.price = product.price;
        pr.stock_quantity = product.stock_quantity_status ? "-1" : '0'
        if (product.meta && product.meta.food_type) { pr.meta.food_type = product.meta.food_type }
        // if (product.stock_quantity_status && product.vendor_products[0] && product.vendor_products[0].stock_quantity == 0) pr.stock_quantity = "0";
        for (let img of product.image_urls) if (img != "assets/images/plc_no_item.png") pr.image_urls.push(img);
        return pr;
    }
}
export class ProductQuantity {
    stock_quantity: string;
}