
import { unzipSync } from "https://cdn.jsdelivr.net/npm/fflate@0.7.4/esm/browser.js";
async function extractZipToOPFS(zipFile) {
    const div = UI.create('div', document.body);
    console.log('FORCE UPDATE ENABLED. TURN OFF BEFORE PRODUCTION');
    const response = await fetch('./desk.zip');
    const buffer = new Uint8Array(await response.arrayBuffer());
    const files = unzipSync(buffer);

    for (const name in files) {
        const fileData = files[name];
        console.log(fileData);

        // Skip directories (either ends with '/' or is zero-length and has no extension)
        if (name.endsWith('/') || (fileData.length === 0 && !name.includes('.'))) continue;
        const filetype = name.match(/\.(png|jpg|jpeg|gif)$/i) ? "blob" : "text";
        let content;
        if (filetype === "blob") {
            content = fileData;
        } else {
            content = new TextDecoder().decode(fileData);
        }
        console.log(name, fileData);
        await fs.write('/' + name, content, filetype);
        console.log(fileData);
        if (name.startsWith('apps/') && name.endsWith('index.js')) {
            const parts = name.split('/');
            let lastdir = parts[parts.length - 2];
            lastdir = lastdir.replace('.app', '');
            await fs.write('/system/apps/Desktop.app/Items/' + lastdir, '/' + name, filetype);
        }
    }

    console.log("ZIP extracted to OPFS. Handing control to init.js.");
    core.loadJS('/system/init.js');
}

(async () => {
    async function update() {
        try {
            const response = await fetch('./desk.zip', { cache: "no-store" });
            if (!response.ok) throw new Error('Failed to fetch desk.zip');
            const zipBlob = await response.blob();
            await extractZipToOPFS(zipBlob);
        } catch (err) {
            console.error('Error extracting desk.zip:', err);
        }
    }
    const FORCEUPDATE = true;
    if (FORCEUPDATE === false) {
        console.log('<i> FORCEUPDATE flag false, checking for updates');
    } else {
        console.log('<i> FORCEUPDATE enabled, DISABLE BEFORE PRODUCTION');
        update();
    }
})();