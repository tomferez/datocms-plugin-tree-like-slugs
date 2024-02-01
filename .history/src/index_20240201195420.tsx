import {
    IntentCtx,
    Item,
    OnBootPropertiesAndMethods,
    RenderFieldExtensionCtx,
    connect,
} from "datocms-plugin-sdk";
import { render } from "./utils/render";
import ConfigScreen from "./entrypoints/ConfigScreen";
import "datocms-react-ui/styles.css";
import SlugExtension from "./entrypoints/SlugExtension";
import updateAllChildrenPaths, { Slug } from "./utils/updateAllChildrenSlugs";

const updateFields = (
    payload: Item[],
    fields: Array<string>,
    ctx: OnBootPropertiesAndMethods
) =>
    new Promise(() => {
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
                return true;
            }

            console.log("ITEM PAYLOAD DATA", item);

            updateAllChildrenPaths(
                ctx.currentUserAccessToken as string,
                item.relationships!.item_type!.data.id,
                (item as any).id,
                item.attributes![updatedSlugFieldKey] as Slug
            );
        }
    }).then(() => true);

connect({
    renderConfigScreen(ctx) {
        return render(<ConfigScreen ctx={ctx} />);
    },
    manualFieldExtensions(ctx: IntentCtx) {
        return [
            {
                id: "treeLikeSlugs",
                name: "Tree-like slugs",
                type: "addon",
                fieldTypes: ["slug"],
            },
        ];
    },
    renderFieldExtension(
        fieldExtensionId: string,
        ctx: RenderFieldExtensionCtx
    ) {
        switch (fieldExtensionId) {
            case "treeLikeSlugs":
                return render(<SlugExtension ctx={ctx} />);
        }
    },
    async onBeforeItemsPublish(createOrUpdateItemPayload, ctx) {
        if (ctx.plugin.attributes.parameters.onPublish) {
            return true;
        }

        let fieldUsingThisPlugin: Array<string> = [];

        (await ctx.loadFieldsUsingPlugin()).forEach((field) => {
            fieldUsingThisPlugin.push(field.attributes.api_key);
        });

        if (!fieldUsingThisPlugin) {
            return true;
        }

        return await updateFields(
            createOrUpdateItemPayload,
            fieldUsingThisPlugin,
            ctx
        );
    },
});