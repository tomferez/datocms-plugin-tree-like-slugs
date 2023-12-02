import { buildClient } from "@datocms/cma-client-browser";

export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    parentID: string,
    // pathFieldKey: string,
    updatedSlug: string,
    locale: string
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
            const pathObject = record[pathFieldKey] as {
                [key: string]: string;
            };

            const pathArray = Object.keys(pathObject).map((key) => {
                return { lang: key, path: pathObject[key] };
            });

            pathArray.forEach((path) => {});

            const destructuredOldPath = record[pathFieldKey].split("/");

            const updatedPath =
                updatedSlug +
                "/" +
                destructuredOldPath[destructuredOldPath.length - 1];

            await client.items.update(record.id, {
                [pathFieldKey]: updatedPath,
            });

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                // slugFieldKey,
                updatedSlug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1]
            );
        });
    }
}