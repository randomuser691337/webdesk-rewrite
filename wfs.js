console.log(`<i> WebDesk File System ready! Read the docs at the top of fs.js if you need help`);

// wfs.js is almost entirely written by AI, but I wrote fs.js and came up with it's design/architecture

var encrypted = false;
let passcode = null;
let key = null;

async function walkPath(fullPath, { create = false, file = false } = {}) {
    const parts = fullPath.split("/").filter(Boolean);
    let dir = await navigator.storage.getDirectory();

    for (let i = 0; i < parts.length - (file ? 1 : 0); i++) {
        dir = await dir.getDirectoryHandle(parts[i], { create });
    }

    if (file) {
        return await dir.getFileHandle(parts.at(-1), { create });
    } else {
        return dir;
    }
}

// To be continued

// Derive a strong AES key from a password (PBKDF2)
async function deriveKey(password, salt) {
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(data, key, isText) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // TYPE BYTE: 1 = text, 2 = blob
    const typeByte = new Uint8Array([isText ? 1 : 2]);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    // Blob layout: [IV][TYPE][ENCRYPTED]
    return new Blob([iv, typeByte, new Uint8Array(encrypted)]);
}

async function decryptData(buffer, key) {
    const iv = new Uint8Array(buffer.slice(0, 12));
    const type = new Uint8Array(buffer.slice(12, 13))[0]; // 1 byte
    const ciphertext = buffer.slice(13);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );

    return { decrypted, type };
}

const fs = {
    async read(path, uid, { encrypt = false, key = null } = {}) {
        try {
            const fileHandle = await walkPath(path, { file: true });
            const file = await fileHandle.getFile();
            let result;
            console.log(path);
            if (encrypt === true) {
                const encryptedBuffer = await file.arrayBuffer();
                const { decrypted, type } = await decryptData(encryptedBuffer, key);

                if (type === 1) {
                    result = new TextDecoder().decode(new Uint8Array(decrypted));
                } else {
                    // lazy fix
                    if (path.endsWith('.svg') || path.endsWith('.svg/')) {
                        console.log(decrypted);
                        console.log('<i> SVG: ' + path)
                        result = new Blob([decrypted], {
                            type: 'image/svg+xml;charset=utf-8'
                        });
                        console.log(result);
                    } else {
                        result = new Blob([decrypted]);
                    }
                }
            }
            else {
                console.log("noencrypt");
                const isText =
                    file.type.startsWith("text") ||
                    file.type === "" ||
                    [
                        "application/json",
                        "application/javascript",
                        "application/xml",
                        "text/xml",
                        "application/xhtml+xml",
                        "application/ld+json",
                        "application/sql",
                        "application/x-httpd-php",
                        "application/x-yaml",
                        "text/yaml",
                    ].includes(file.type);

                if (isText) {
                    result = await file.text();
                } else {
                    result = file;
                }
            }

            self.postMessage({ optype: "read", uID: uid, data: result });
        } catch (err) {
            console.error("read failed with " + path + ": ", err);
            self.postMessage({ optype: "read", uID: uid, data: null });
        }
    },

    async write(path, uid, content, filetype, { encrypt = false, key = null } = {}) {
        try {
            let blobToWrite;

            if (encrypt === true) {
                let dataBuffer;
                let isText = false;

                if (typeof content === "string") {
                    dataBuffer = new TextEncoder().encode(content);
                    isText = true;
                }
                else if (content instanceof ArrayBuffer) {
                    dataBuffer = new Uint8Array(content);
                }
                else if (content instanceof Uint8Array) {
                    dataBuffer = content;
                }
                else if (content instanceof Blob) {
                    dataBuffer = new Uint8Array(await content.arrayBuffer());
                }
                else {
                    throw new Error("Unsupported content type for encryption");
                }

                blobToWrite = await encryptData(dataBuffer, key, isText);
            } else {
                console.log('noencrypt');
                if (filetype === "blob") {
                    blobToWrite = content instanceof Blob
                        ? content
                        : new Blob([content]);
                } else {
                    const string = typeof content === "string"
                        ? content
                        : content.toString();
                    blobToWrite = new Blob([string], { type: "text/plain" });
                }
            }

            const fileHandle = await walkPath(path, { create: true, file: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blobToWrite);
            await writable.close();

            self.postMessage({ optype: "write", uID: uid, data: true });
        } catch (err) {
            console.error("write failed with " + path + ": ", err);
            self.postMessage({ optype: "write", uID: uid, data: false });
        }
    },

    async del(path, uid, recursive = false) {
        try {
            const parts = path.split("/").filter(Boolean);
            if (parts.length === 0) throw new Error("Cannot delete root directory");

            const name = parts.pop();
            const parentDir = await walkPath(parts.join("/"), { create: false });

            await parentDir.removeEntry(name, { recursive });

            self.postMessage({ optype: "del", uID: uid, data: true });
        } catch (err) {
            console.error("del failed with " + path + ": ", err);
            self.postMessage({ optype: "del", uID: uid, data: false });
        }
    },

    async erase(path, uid) {
        try {
            // Generated by Google AI overview
            const rootHandle = await navigator.storage.getDirectory();
            await rootHandle.remove();
            self.postMessage({ optype: "del", uID: uid, data: true });
            return true;
        } catch (err) {
            console.error("erase failed:", err);
            self.postMessage({ optype: "erase", uID: uid, data: false });
        }
    },

    async mkdir(path, uid) {
        try {
            await walkPath(path, { create: true });
            self.postMessage({ optype: "mkdir", uID: uid, data: true });
        } catch (err) {
            console.error("mkdir failed:", err);
            self.postMessage({ optype: "mkdir", uID: uid, data: err });
        }
    },

    async ls(path, uid) {
        try {
            path = path || "/";
            if (path.endsWith("/")) path = path.slice(0, -1);

            const dirHandle = await walkPath(path || "/", { create: false });
            const entries = [];
            for await (const [name, handle] of dirHandle.entries()) {
                entries.push({ name, kind: handle.kind, path: `${path}/${name}` });
            }

            self.postMessage({ optype: "ls", uID: uid, data: entries });
        } catch (err) {
            console.error("ls failed:", err);
            self.postMessage({ optype: "ls", uID: uid, data: null });
        }
    },
};

async function readFileRaw(path) {
    try {
        const handle = await walkPath(path, { file: true });
        const file = await handle.getFile();
        return new Uint8Array(await file.arrayBuffer());
    } catch {
        return null;
    }
}

async function writeFileRaw(path, data) {
    const handle = await walkPath(path, { create: true, file: true });
    const writable = await handle.createWritable();
    await writable.write(new Blob([data]));
    await writable.close();
}

onmessage = async (e) => {
    const { optype, uID, data, data2, filetype } = e.data;

    if (optype === "pin") {
        console.log('<i> Setting up crypt environment.');

        passcode = data;

        let fsSalt = data2;

        key = await deriveKey(passcode, fsSalt);
        encrypted = true;

        console.log('<i> Crypt environment set up.');
        self.postMessage({ optype: "pin", uID, data: true });
        return;
    }

    if (optype === "read") {
        if (data2 === "encFORCE") {
            fs.read(data, uID, { encrypt: true, key: key });
        } else if (data2 === "encoffFORCE") {
            fs.read(data, uID, { encrypt: false, key: key });
        } else {
            fs.read(data, uID, { encrypt: encrypted, key: key });
        }
    };
    if (optype === "write") fs.write(data, uID, data2, filetype, { encrypt: encrypted, key: key });
    if (optype === "erase") fs.erase(data, uID);
    if (optype === "ls") fs.ls(data, uID);
    if (optype === "rm") fs.del(data, uID, data2);
    if (optype === "mkdir") fs.mkdir(data, uID);
};

self.postMessage({ optype: "ready" });