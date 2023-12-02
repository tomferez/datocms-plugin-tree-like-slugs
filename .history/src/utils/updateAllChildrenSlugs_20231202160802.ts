import { buildClient } from "@datocms/cma-client-browser";

export type Slug = { [key: string]: string };
type Path = { [key: string]: string };
export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    parentID: string,
    updatedSlug: Slug
) {
    const client = buildClient({
        apiToken,
    });

    const records = await client.items.list({
        filter: {
            type: modelID,
            fields: {
                parent: {
                    eq: parentID,
                },
            },
        },
    });

    const pathFieldKey = "published_path";

    if (records.length) {
        records.forEach(async (record) => {
            const pathObject = record[pathFieldKey] as Path;

            const pathArray = Object.keys(pathObject).map((key) => {
                return { lang: key, path: pathObject[key] };
            });

            pathArray.forEach((path) => {
                const destructuredOldPath = path.path.split("/");
                const slug = updatedSlug[path.lang];
                const updatedPath =
                    slug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1];
                return { ...path, path: updatedPath };
            });

            const updatedPath = await client.items.update(record.id, {
                [pathFieldKey]: updatedPath,
            });

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                updatedSlug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1]
            );
        });
    }
}
