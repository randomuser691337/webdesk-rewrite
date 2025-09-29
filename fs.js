/*  <//> WebDesk File System  
    <//> dbh_ra9 - Jun 9, 2025

    // FS Functions //

    - fs.read(path)
        > Returns a Promise that resolves with the file contents.
        - Text files return a string.
        - Image files return a Blob.

    - fs.write(path, data, filetype)
        > Writes data to the OPFS file system.
        - path: string, e.g. "/notes/file.txt"
        - data: string or Blob, depending on filetype
        - filetype: optional, defaults to "text"
            Valid types:
            - "text"  > stored as a UTF-8 string
            - "blob" > stored as a Blob

    - fs.erase(path)
        > Erases WebDesk.
        - Not sure why you would use this, but it's here.

    // Examples //

    fs.read("/notes/hello.txt").then(console.log);
    fs.write("/wallpapers/bg.png", blob, "blob");
    fs.del("/notes/hello.txt").then(() => console.log("Deleted."));
*/

const worker = new Worker('./wfs.js');
var tmp = new Map();

function gen(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var currentops = []

fs = {
    read: function (path) {
        if (path.startsWith("/tmp/")) {
            const data = tmp.has(path) ? tmp.get(path) : null;
            return Promise.resolve(data);
        } else {
            const uID = gen(0, 9999);
            return new Promise((resolve, reject) => {
                currentops.push({ uID, resolve, reject });
                worker.postMessage({ optype: "read", uID, data: path });
            });
        }
    },
    write: function (path, data, filetype = "text") {
        if (path.startsWith("/tmp/")) {
            tmp.set(path, data);
            return Promise.resolve(true);
        } else {
            const uID = gen(0, 9999);
            return new Promise((resolve, reject) => {
                currentops.push({ uID, resolve, reject });
                worker.postMessage({ optype: "write", uID, data: path, data2: data, filetype: filetype });
            });
        }
    },
    ls: function (path) {
        if (path === "/tmp" || path.startsWith("/tmp/")) {
            const entriesMap = new Map();

            for (const key of tmp.keys()) {
                if (!key.startsWith(path + "/")) continue;
                const relative = key.slice(path.length + 1);
                const nextPart = relative.split("/")[0];

                if (!entriesMap.has(nextPart)) {
                    const isFile = !relative.includes("/") || relative.split("/").length === 1;
                    entriesMap.set(nextPart, {
                        name: nextPart,
                        kind: isFile ? "file" : "directory",
                        path: `${path}/${nextPart}`
                    });
                }
            }

            self.postMessage({
                optype: "ls",
                uID: uid,
                data: Array.from(entriesMap.values())
            });
            return;
        } else {
            const uID = gen(0, 9999);
            return new Promise((resolve, reject) => {
                currentops.push({ uID, resolve, reject });
                worker.postMessage({ optype: "ls", uID, data: path });
            });
        }
    },
    rm: function (path, recursive = false) {
        if (path.startsWith("/tmp/")) {
            tmp.delete(path);
            return Promise.resolve(true);
        }
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            worker.postMessage({ optype: "rm", uID, data: path, data2: recursive });
        });
    },
    mkdir: function (path) {
        if (path.startsWith("/tmp/")) {
            return Promise.resolve(true);
        }
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            worker.postMessage({ optype: "mkdir", uID, data: path });
        });
    },
    erase: async function () {
        const uID = gen(0, 9999);
        const check = await new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            worker.postMessage({ optype: "erase", uID });
        });

        console.log(check);

        if (check === true) {
            window.location.reload();
        }
    }
};

worker.addEventListener("message", (msg) => {
    // console.log(msg.data);
    if (msg.data.optype === "ready") {
        boot();
    }
    currentops.filter(op => {
        if (op.uID === msg.data.uID) {
            op.resolve(msg.data.data);
            return false;
        }
        return true;
    });
});

set = {
    async ensureConfigLoaded() {
        if (!sys.config) {
            try {
                const raw = await fs.read("/user/info/config.json");
                if (!raw) {
                    sys.config = {};
                    return;
                }
                sys.config = JSON.parse(raw);
                console.log(sys.config);
            } catch (e) {
                sys.config = {};
            }
        }
    },
    async write(key, value) {
        try {
            await this.ensureConfigLoaded();
            sys.config[key] = value;
            await fs.write("/user/info/config.json", JSON.stringify(sys.config));
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    async del(key) {
        try {
            await this.ensureConfigLoaded();
            delete sys.config[key];
            await fs.write("/user/info/config.json", JSON.stringify(sys.config));
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    async read(key) {
        await this.ensureConfigLoaded();
        return sys.config[key];
    }
};