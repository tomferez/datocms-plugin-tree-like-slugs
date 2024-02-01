import { ApiError, Client, buildClient } from "@datocms/cma-client-browser";

export type Slug = { [key: string]: string };
type Path = { [key: string]: string };

const PATH_FIELD_KEY = "path";

async function updateRecordOptimistic(
    itemId: string,
    client: Client,
    payload: { [PATH_FIELD_KEY]: Path }
): Promise<void> {
    // first we get the record we want to update
    const record = await client.items.find(itemId);
    try {
        // now we increment the counter value, passing the current version
        // to enable optimistic-locking
        client.items.update(itemId, {
            [PATH_FIELD_KEY]: payload[PATH_FIELD_KEY],
            meta: { current_version: record.meta.current_version },
        });
    } catch (e) {
        // if we get a STALE_ITEM_VERSION error, this means that the
        // the record changed in-between the find and update operations, so we have
        // to fetch the latest version of the record and try again
        if (e instanceof ApiError && e.findError("STALE_ITEM_VERSION")) {
            return updateRecordOptimistic(itemId, client, payload);
        }
        throw e;
    }
}

function preparePaths(pathObject: Path, updatedSlug: Slug) {
    const pathArray = Object.keys(pathObject).map((key) => {
        return { lang: key, path: pathObject[key] };
    });

    pathArray.forEach((path) => {
        const destructuredOldPath = path.path
            .split("/")
            .filter((c) => c !== "")
            .slice(1);

        const slug = updatedSlug[path.lang];

        const updatedPath = `${slug ? `/${slug}` : ""}${
            destructuredOldPath.length
                ? `/${destructuredOldPath.join("/")}`
                : ""
        }`;

        path.path = updatedPath;
    });

    console.log("PATH ARRAY AFTER", pathArray);

    return Object.fromEntries(pathArray.map((p) => [p.lang, p.path]));
}

export default async function updateAllChildrenPaths(
    apiToken: string,
    modelID: string,
    recordID: string,
    updatedSlug: Slug,
    initial = true
) {
    console.log("UPDATED SLUG INITIAL", updatedSlug);

    const client = buildClient({
        apiToken,
    });

    if (initial) {
        const currentRecord = await client.items.find(recordID);

        console.log("CURRENT RECORD", currentRecord);

        const updatedPathObject = preparePaths(
            currentRecord[PATH_FIELD_KEY] as Path,
            updatedSlug
        );
        await updateRecordOptimistic(recordID, client, {
            [PATH_FIELD_KEY]: updatedPathObject,
        });
    }

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

    console.log("RECORDS", childrenRecords);

    if (childrenRecords.length) {
        childrenRecords.forEach(async (record) => {
            const updatedPathObject = preparePaths(
                record[PATH_FIELD_KEY] as Path,
                updatedSlug
            );

            console.log("UPDATED PATH OBJECT", updatedPathObject);

            await client.items.update(record.id, {
                [PATH_FIELD_KEY]: updatedPathObject,
            });

            await client.items.update(record.id, {
                [PATH_FIELD_KEY]: updatedPathObject,
            });

            updateAllChildrenPaths(
                apiToken,
                modelID,
                record.id,
                updatedPathObject,
                false
            );
        });
    }
}
