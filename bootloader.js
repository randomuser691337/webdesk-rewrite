// newer version optimized by Claude AI

import { unzipSync } from "https://cdn.jsdelivr.net/npm/fflate@0.7.4/esm/browser.js";

let statusDiv = UI.create('div', document.body);

async function noCrypt() {
    await fs.write('/system/DONOTDELETE.salt', 'false');
}

async function extractZipToOPFS(zipFile) {
    const cp = UI.text(statusDiv, "Copying files...");
    const buffer = new Uint8Array(await zipFile.arrayBuffer());
    const files = unzipSync(buffer);

    for (const name in files) {
        if (name.endsWith('/') || name.endsWith('.DS_Store') || (files[name].length === 0 && !name.includes('.'))) continue;

        try {
            cp.textContent = 'Copying: ' + name;
            const filetype = /(png|jpg|jpeg|gif|webp|bmp|tiff|mp3|wav|flac|aac|ogg|m4a|mp4|webm|avi|mov|mkv|pdf|docx?|xlsx?|pptx?|zip|rar|7z|tar|gz|woff2?|ttf|otf)$/i.test(name) ? "blob" : "text";
            const content = filetype === "blob" ? files[name] : new TextDecoder().decode(files[name]);

            await fs.write('/' + name, content, filetype);

            if (name.startsWith('apps/') && name.endsWith('index.js')) {
                const appName = name.split('/')[1].replace('.app', '');
                await fs.write('/system/apps/Desktop.app/Items/' + appName, '/' + name, filetype);
            }
        } catch (error) {
            cp.textContent = 'Error: ' + name + ' - ' + error;
            await new Promise(resolve => {
                const btn = UI.create('button', statusDiv);
                btn.textContent = 'Skip';
                btn.onclick = resolve;
            });
        }
    }

    UI.text(statusDiv, 'Starting WebDesk...');
    await set.write('version', core.latestVersion);
    core.loadJS('/system/init.js');
    UI.remove(statusDiv);
}

async function update() {
    statusDiv.textContent = 'WebDesk 0.3.3 // dbh_ra9';
    const response = await fetch('desk.zip', { cache: 'no-store' });
    const reader = response.body.getReader();
    const chunks = [];
    const total = parseInt(response.headers.get('content-length') || 0, 10);
    let loaded = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total) statusDiv.textContent = 'Download: ' + Math.floor((loaded / total) * 100) + '%';
    }

    await extractZipToOPFS(new Blob(chunks));
}

await noCrypt();

const passDiv = UI.create('div', document.body);
document.body.style.backgroundColor = "#000";
passDiv.style.cssText = "position: fixed; transform: translate(-50%, -50%); left: 50%; top: 50%; width: 300px; background-color: #fff !important; text-align: center; padding: 12px; border-radius: 7px; max-width: 75%; font-family: Arial;";
const test = await fs.read('/system/DONOTDELETE.salt');
if (test === "false") {
    passDiv.innerHTML = "";
    statusDiv = passDiv;
    if (await set.read('forceup') === "true" || core.latestVersion !== await set.read('version')) {
        await update();
    } else {
        UI.remove(statusDiv);
        core.loadJS('/system/init.js');
    }
} else if (test) {
    UI.text(passDiv, 'Enter password').style = `padding: 0px; margin: 14px; font-size: 20px;`;
} else {
    UI.text(passDiv, 'Welcome to WebDesk!').style = `padding: 0px; margin: 14px; font-size: 20px;`;
    UI.text(passDiv, `Enter a 10-character password or above to encrypt all data.`);
}
const input = UI.create('input', passDiv);
input.placeholder = "Password";
input.type = "password";
const btn = UI.create('button', passDiv);

if (test) {
    btn.textContent = "Unlock";
    const btn2 = UI.create('button', passDiv);
    btn2.textContent = "I forgot (Erase)";
    btn2.onclick = async () => {
        passDiv.innerHTML = `<p>This will erase all of your data, are you sure?</p><p>This can't be undone.</p>`;
        const erase = UI.create('button', passDiv);
        erase.textContent = "Erase";
        erase.onclick = async () => {
            fs.erase();
        }

        const no = UI.create('button', passDiv);
        no.textContent = "Cancel";
        no.onclick = async () => {
            window.location.reload()
        }
    };
} else {
    btn.textContent = "Encrypt";
    const btn2 = UI.create('button', passDiv);
    btn2.textContent = "Don't encrypt";
    btn2.onclick = async () => {
        noCrypt();
        window.location.reload();
    };
}

input.focus();

btn.onclick = async () => {
    if (await fs.passcode(input.value) === true) {
        statusDiv = UI.create('div', document.body);
        UI.remove(passDiv);
        if (await set.read('forceup') === "true" || core.latestVersion !== await set.read('version')) {
            await update();
        } else {
            core.loadJS('/system/init.js');
            UI.remove(statusDiv);
        }
    } else {
        input.value = '';
        input.placeholder = 'Wrong passcode';
        input.focus();
    }
};