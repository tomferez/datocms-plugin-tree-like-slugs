import { buildClient } from "@datocms/cma-client-browser";

export type Slug = { [key: string]: string };
type Path = { [key: string]: string };
export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    parentID: string,
    updatedSlug: Slug
) {
    console.log("UPDATED SLUG INITIAL", updatedSlug);

    const client = buildClient({
        apiToken,
    });

    const currentRecord = await client.items.list({
        filter: {
            type: modelID,
            fields: {
                parent: {
                    eq: parentID,
                },
            },
        },
    });

    const childrenRecords = await client.items.list({
        filter: {
            type: modelID,
            fields: {
                parent: {
                    eq: parentID,
                },
            },
        },
    });

    console.log(" RECORDS", childrenRecords);

    const pathFieldKey = "published_path";

    if (childrenRecords.length) {
        childrenRecords.forEach(async (record) => {
            const pathObject = record[pathFieldKey] as Path;

            console.log("PATH OBJECT", pathObject);

            const pathArray = Object.keys(pathObject).map((key) => {
                return { lang: key, path: pathObject[key] };
            });

            console.log("PATH ARRAY BEFORE", pathArray);

            pathArray.forEach((path) => {
                const destructuredOldPath = path.path.split("/");
                const slug = updatedSlug[path.lang];
                const updatedPath =
                    slug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1];
                return { ...path, path: updatedPath };
            });

            console.log("PATH ARRAY AFTER", pathArray);

            const updatedPathObject = Object.fromEntries(
                pathArray.map((p) => [p.lang, p.path])
            );

            console.log("UPDATED PATH OBJECT", updatedPathObject);

            await client.items.update(record.id, updatedPathObject);

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                updatedPathObject
            );
        });
    }
}
