import {
    IntentCtx,
    RenderFieldExtensionCtx,
    connect,
} from "datocms-plugin-sdk";
import { render } from "./utils/render";
import ConfigScreen from "./entrypoints/ConfigScreen";
import "datocms-react-ui/styles.css";
import SlugExtension from "./entrypoints/SlugExtension";
import { updateFields } from "./utils/updateFields";

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
        ).then(() => true);
    },
});
