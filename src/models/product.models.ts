import { Category } from './category.models';
import { ProductVendor } from './vendor-product.models';

export class Product {
    id: number;
    title: string;
    detail: string;
    meta: any;
    price: number;
    ratings: number;
    ratings_count: number;
    owner: string; //admin,vendor
    parent_id: number;
    attribute_term_id: number;
    mediaurls: { images: Array<any> };
    created_at: string;
    updated_at: string;
    categories: Array<Category>;
    vendor_products: Array<ProductVendor>;
    is_favourite: boolean;

    prescription_required: boolean;
    priceToShow: string;
    image_urls: Array<string>;
    stock_quantity_status: boolean;
}