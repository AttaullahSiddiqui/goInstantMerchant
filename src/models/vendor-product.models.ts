import { Profile } from './profile.models';


export class ProductVendor {
    id: number;
    price: number;
    sale_price: number;
    sale_price_from: number;
    sale_price_to: number;
    stock_quantity: number;
    stock_low_threshold: number;
    product_id: number;
    vendor_id: number;
    vendor: Profile;

    priceToShow: string;
    sale_priceToShow: string;
}