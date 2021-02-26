export class Category {
    id: number;
    parent_id: number;
    title: string;
    slug: string;
    meta: any;
    mediaurls: { images: Array<any> };

    image: string;
    selected: boolean;

    static getAllDefault(): Category {
        let toReturn = new Category();
        toReturn.title = "All";
        toReturn.id = 0;
        toReturn.slug = "all";
        return toReturn;
    }
}