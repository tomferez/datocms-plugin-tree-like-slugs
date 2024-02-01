import { Item, OnBootPropertiesAndMethods } from "datocms-plugin-sdk";
import updateAllChildrenPaths, { Slug } from "./updateAllChildrenPaths";

export const updateFields = async (
    payload: Item[],
    fields: Array<string>,
    ctx: OnBootPropertiesAndMethods
) =>
    new Promise(async () => {
        for (const item of payload) {
            const updatedFields = Object.keys(item.attributes as object);

            let updatedSlugFieldKey;

            fields.forEach((field) => {
                if (updatedFields.includes(field)) {
                    updatedSlugFieldKey = field;
                    return;
                }
            });

            if (!updatedSlugFieldKey) {
                return Promise.resolve();
            }

            console.log("ITEM PAYLOAD DATA", item);

            await updateAllChildrenPaths(
                ctx.currentUserAccessToken as string,
                item.relationships!.item_type!.data.id,
                (item as any).id,
                item.attributes![updatedSlugFieldKey] as Slug
            ).then(() => Promise.resolve());
        }
    }).then(() => true);
