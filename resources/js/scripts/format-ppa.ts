import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const INPUT_FILE = 'ppa.json';
const OUTPUT_FILE = 'ppa.php.json';

type NodeType = 'Program' | 'Project' | 'Activity' | 'Sub-Activity';

interface Item {
    id: number;
    parent_id: number | null;
    name: string;
    type: NodeType;
}

function getType(value: string): NodeType | null {
    if (/^[A-Z]\.\s/.test(value)) {
        return 'Program';
    }

    if (/^\d+\.\d+\.\d+\.\s/.test(value)) {
        return 'Sub-Activity';
    }

    if (/^\d+\.\d+\.\s/.test(value)) {
        return 'Activity';
    }

    if (/^\d+\.\s/.test(value)) {
        return 'Project';
    }

    return null;
}

function cleanName(value: string): string {
    return value
        .replace(/^[A-Z]\.\s*/, '')
        .replace(/^\d+(?:\.\d+)*\.\s*/, '')
        .trim();
}

function escapePhpString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function toPhpArray(data: Item[]): string {
    const rows = data.map(
        (item) => `    [
        'id' => ${item.id},
        'parent_id' => ${item.parent_id === null ? 'null' : item.parent_id},
        'name' => '${escapePhpString(item.name)}',
        'type' => '${item.type}',
    ]`,
    );

    return `[\n${rows.join(',\n')}\n];`;
}

async function main() {
    const inputPath = path.join(import.meta.dirname, INPUT_FILE);

    const data: string[] = JSON.parse(await readFile(inputPath, 'utf8'));

    const result: Item[] = [];

    let id = 1;

    let currentProgramId: number | null = null;
    let currentProjectId: number | null = null;
    let currentActivityId: number | null = null;

    for (const item of data) {
        const type = getType(item);

        if (!type) {
            continue;
        }

        let parentId: number | null = null;

        switch (type) {
            case 'Program':
                currentProgramId = id;
                currentProjectId = null;
                currentActivityId = null;
                break;

            case 'Project':
                parentId = currentProgramId;
                currentProjectId = id;
                currentActivityId = null;
                break;

            case 'Activity':
                parentId = currentProjectId;
                currentActivityId = id;
                break;

            case 'Sub-Activity':
                parentId = currentActivityId;
                break;
        }

        result.push({
            id,
            parent_id: parentId,
            name: cleanName(item),
            type,
        });

        id++;
    }

    const outputPath = path.join(import.meta.dirname, OUTPUT_FILE);

    await writeFile(outputPath, toPhpArray(result), 'utf8');

    console.log(`Saved ${result.length} items to ${OUTPUT_FILE}`);
}

main().catch(console.error);
