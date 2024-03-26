import fs from 'fs'
import path from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __projectDir = path.resolve(__dirname, '../')
const myPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))
let rewriteFileNameStatus = 'ask'
let rewriteFileContentsStatus = 'ask'

// get the name package name
const oldName = myPackage.name

// ask the user for the new name
const nameResponse = await prompts({
    type: 'text',
    name: 'value',
    message: `What would you like to rename ${oldName} to?`
})

const newName = nameResponse.value
const ignore_folders = ['node_modules', '.git', '.next', 'coverage', 'dist']

async function walk(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const pathToFile = path.join(dir, file)

        if (fs.statSync(pathToFile).isDirectory()) {
            if (ignore_folders.includes(file)) {
                continue
            }
            await walk(pathToFile)
        } else {
            await maybeChangeFileContents(pathToFile, oldName, newName)
            await maybeRenameFile(pathToFile, oldName, newName)
        }
    }
}


async function askToReplace(prompt) {
    console.log()
    return await prompts({
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
}

async function maybeChangeFileContents(dir, oldName, newName) {
    const data = fs.readFileSync(dir, 'utf8')

    // if the file does not contain the name, return
    // If rewriteFileContentsStatus is none, return
    if (!data.includes(oldName) || rewriteFileContentsStatus === 'none') {
        return
    }

    // if rewriteFileContentsStatus is ask, ask the user if they want to replace the name
    if (rewriteFileContentsStatus === 'ask') {
        // get shorthand for dir
        const shortDir = dir.replace(__projectDir, '')

        const response = await askToReplace(`Would you like to replace ${oldName} with ${newName} in ${shortDir}?`)

        if (response.value === 'no') {
            return
        } else if (response.value === 'none') {
            rewriteFileContentsStatus = 'none'
            return
        } else if (response.value === 'all') {
            rewriteFileContentsStatus = 'all'
        }
    }

    // replace the name with the new name
    const result = data.replace(new RegExp(oldName, 'g'), newName)

    // write the new data to the file
    // fs.writeFileSync(dir, result)
    console.log(`  - Replaced ${oldName} with ${newName} in ${dir}`)
}

async function maybeRenameFile(dir, oldName, newName) {
    const newDir = dir.replace(oldName, newName)

    if (dir === newDir || rewriteFileNameStatus === 'none') {
        return
    }

    if (fs.existsSync(newDir)) {
        console.log(`  - ${newDir} already exists`)
        return
    }

    // if rewriteFileNameStatus is ask, ask the user if they want to replace the name
    if (rewriteFileNameStatus === 'ask') {
        const shortDir = dir.replace(__projectDir, '')
        const shortNewDir = newDir.replace(__projectDir, '')

        const response = await askToReplace(`Would you like to rename ${shortDir} to ${shortName}?`)

        if (response.value === 'no') {
            return
        } else if (response.value === 'none') {
            rewriteFileNameStatus = 'none'
            return
        } else if (response.value === 'all') {
            rewriteFileNameStatus = 'all'
        }
    }

    // fs.renameSync(dir, newDir)
    console.log(`  - Renamed ${dir} to ${newDir}`)
}


walk(__projectDir)