import { buildClient } from "@datocms/cma-client-browser";

export type Slug = { [key: string]: string };
type Path = { [key: string]: string };

function preparePaths(pathObject: Path, updatedSlug: Slug) {
    const pathArray = Object.keys(pathObject).map((key) => {
        return { lang: key, path: pathObject[key] };
    });

    console.log("PATH ARRAY BEFORE", pathArray);

    pathArray.forEach((path) => {
        const destructuredOldPath = path.path.split("/").slice(1);
        const slug = updatedSlug[path.lang];

        console.log("PATH ARRAY UPDATED SLUG", slug);

        const updatedPath = `/${slug}${
            destructuredOldPath ? `/${destructuredOldPath}` : ""
        }`;

        console.log("PATH ARRAY UPDATED PATH", updatedPath);

        path.path = updatedPath;
    });

    console.log("PATH ARRAY AFTER", pathArray);

    return Object.fromEntries(pathArray.map((p) => [p.lang, p.path]));
}

export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    recordID: string,
    updatedSlug: Slug
) {
    console.log("UPDATED SLUG INITIAL", updatedSlug);

    const client = buildClient({
        apiToken,
    });

    const currentRecord = await client.items.find(recordID);

    const pathFieldKey = "published_path";

    const updatedPathObject = preparePaths(
        currentRecord[pathFieldKey] as Path,
        updatedSlug
    );

    await client.items.update(recordID, { [pathFieldKey]: updatedPathObject });

    console.log("CURRENT RECORD", currentRecord);

    const childrenRecords = await client.items.list({
        filter: {
            type: modelID,
            fields: {
                parent: {
                    eq: recordID,
                },
            },
        },
    });

    console.log(" RECORDS", childrenRecords);

    if (childrenRecords.length) {
        childrenRecords.forEach(async (record) => {
            const updatedPathObject = preparePaths(
                record[pathFieldKey] as Path,
                updatedSlug
            );

            console.log("UPDATED PATH OBJECT", updatedPathObject);

            await client.items.update(record.id, {
                [pathFieldKey]: updatedPathObject,
            });

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                updatedPathObject
            );
        });
    }
}