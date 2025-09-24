console.log(`<i> WebDesk File System ready! Read the docs at the top of fs.js if you need help`);

// Written (almost ENTIRELY) with ChatGPT! (fs.js, not so much, that's my own design)

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

const fs = {
    async read(path, uid) {
        try {
            if (path.startsWith("/tmp/")) {
                const data = tmp.has(path) ? tmp.get(path) : null;
                self.postMessage({ optype: "read", uID: uid, data });
                return;
            }

            const fileHandle = await walkPath(path, { file: true });
            const file = await fileHandle.getFile();

            const textTypes = [
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
            ];

            const isText = file.type.startsWith("text") || file.type === "" || textTypes.includes(file.type);
            const data = isText ? await file.text() : file;

            self.postMessage({ optype: "read", uID: uid, data });
        } catch (err) {
            console.error("read failed with " + path + ": ", err);
            self.postMessage({ optype: "read", uID: uid, data: null });
        }
    },

    async write(path, uid, content, filetype) {
        try {
            if (filetype === "blob") {
                const blob = content instanceof Blob ? content : new Blob([content]);
                const fileHandle = await walkPath(path, { create: true, file: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                const string = typeof content === "string" ? content : content.toString();
                const fileHandle = await walkPath(path, { create: true, file: true });
                const writable = await fileHandle.createWritable();
                await writable.write(string);
                await writable.close();
            }
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
            if (path.endsWith('/')) path = path.slice(0, -1);

            if (path.startsWith("/tmp/")) {
                let found = false;
                for (const key of tmp.keys()) {
                    if (key === path || key.startsWith(path + '/')) {
                        tmp.delete(key);
                        found = true;
                    }
                }
                if (!found) throw new Error("Nothing found to delete");
                self.postMessage({ optype: "erase", uID: uid, data: true });
                return;
            }

            const parts = path.split("/").filter(Boolean);
            const filename = parts.pop();
            const parentDir = await walkPath(parts.join("/"), { create: false });
            await parentDir.removeEntry(filename, { recursive: true });
            self.postMessage({ optype: "erase", uID: uid, data: true });

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

onmessage = (e) => {
    const { optype, uID, data, data2, filetype } = e.data;
    if (optype === "read") fs.read(data, uID);
    if (optype === "write") fs.write(data, uID, data2, filetype);
    if (optype === "erase") fs.erase(data, uID);
    if (optype === "ls") fs.ls(data, uID);
    if (optype === "rm") fs.del(data, uID, data2);
    if (optype === "mkdir") fs.mkdir(data, uID);
};

self.postMessage({ optype: "ready" });