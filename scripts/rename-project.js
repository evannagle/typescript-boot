import fs from 'fs/promises';
import path from 'path';
import prompts from 'prompts';

const __projectDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const myPackage = JSON.parse(await fs.readFile(path.resolve(__projectDir, 'package.json'), 'utf8'));

const oldName = myPackage.name;
const ignoreFolders = ['node_modules', '.git', '.next', 'coverage', 'dist'];

async function walk(dir, oldName, newName, rewriteFileNameStatus, rewriteFileContentsStatus) {
    for await (const file of await fs.readdir(dir)) {
        const pathToFile = path.join(dir, file);

        const isDirectory = (await fs.stat(pathToFile)).isDirectory();
        if (isDirectory && ignoreFolders.includes(file)) continue;

        if (isDirectory) {
            await walk(pathToFile, oldName, newName, rewriteFileNameStatus, rewriteFileContentsStatus);
        } else {
            await maybeChangeFileContents(pathToFile, oldName, newName, rewriteFileNameStatus);
            await maybeRenameFile(pathToFile, oldName, newName, rewriteFileNameStatus);
        }
    }
}

async function askToReplace(prompt) {
    const response = await prompts({
        type: 'select',
        name: 'value',
        message: prompt,
        choices: [
            { title: 'Yes', value: 'yes' },
            { title: 'No', value: 'no' },
            { title: 'Yes to all', value: 'all' },
            { title: 'No to all', value: 'none' },
        ],
    });
    return response.value;
}

async function maybeChangeFileContents(dir, oldName, newName, rewriteFileContentsStatus) {
    const data = await fs.readFile(dir, 'utf8');

    if (!data.includes(oldName)) return;

    const shouldReplace = rewriteFileContentsStatus === 'all' ||
        (rewriteFileContentsStatus === 'ask' &&
            await askToReplace(`Replace ${oldName} with ${newName} in ${dir.replace(__projectDir, '')}?`) === 'yes');

    if (shouldReplace) {
        const result = data.replace(new RegExp(oldName, 'g'), newName);
        await fs.writeFile(dir, result);
        console.log(` - Replaced ${oldName} with ${newName} in ${dir}`);
    }
}

async function maybeRenameFile(dir, oldName, newName, rewriteFileNameStatus) {
    const newDir = dir.replace(oldName, newName);

    if (dir === newDir) return;

    try {
        await fs.access(newDir);
        console.log(`- ${newDir} already exists`);
        return;
    } catch { /* Destination doesn't exist - proceed */ }

    const shouldRename = rewriteFileNameStatus === 'all' ||
        (rewriteFileNameStatus === 'ask' &&
            await askToReplace(`Rename ${dir.replace(__projectDir, '')} to ${newDir.replace(__projectDir, '')}?`) === 'yes');

    if (shouldRename) {
        await fs.rename(dir, newDir);
        console.log(`- Renamed ${dir} to ${newDir}`);
    }
}

// ---- Main Script Execution ---- 
(async () => {
    const { value: newName } = await prompts({
        type: 'text',
        name: 'value',
        message: `What would you like to rename ${oldName} to?`
    });

    let rewriteFileNameStatus = 'ask';
    let rewriteFileContentsStatus = 'ask';

    try {
        await walk(__projectDir, oldName, newName, rewriteFileNameStatus, rewriteFileContentsStatus);
    } catch (error) {
        console.error("An error occurred during the project walk:", error);
    }
})();
