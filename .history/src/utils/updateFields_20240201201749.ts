import { Item, OnBootPropertiesAndMethods } from "datocms-plugin-sdk";
import updateAllChildrenPaths, { Slug } from "./updateAllChildrenPaths";

export const updateFields = async (
    payload: Item[],
    fields: Array<string>,
    ctx: OnBootPropertiesAndMethods
) => {
    return new Promise<boolean>(() => {
        for (const item of payload) {
            const updatedFields = Object.keys(item.attributes as object);

            let updatedSlugFieldKey;

            fields.forEach((field) => {
                if (updatedFields.includes(field)) {
                    updatedSlugFieldKey = field;
                }
            });

            if (!updatedSlugFieldKey) {
                return Promise.resolve(true);
            }

            console.log("ITEM PAYLOAD DATA", item);

            updateAllChildrenPaths(
                ctx.currentUserAccessToken as string,
                item.relationships!.item_type!.data.id,
                (item as any).id,
                item.attributes![updatedSlugFieldKey] as Slug
            );

            return Promise.resolve(true);
        }
    });
};
