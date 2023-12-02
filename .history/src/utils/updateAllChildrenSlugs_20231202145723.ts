import { buildClient } from "@datocms/cma-client-browser";

export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    parentID: string,
    // pathFieldKey: string,
    updatedSlug: string
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

    if (records.length) {
        records.forEach(async (record) => {
            const destructuredOldPath = (record[pathFieldKey] as string).split(
                "/"
            );
            await client.items.update(record.id, {
                [pathFieldKey]:
                    updatedSlug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1],
            });

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                pathFieldKey,
                updatedSlug +
                    "/" +
                    destructuredOldPath[destructuredOldPath.length - 1]
            );
        });
    }
}
