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
            - "image" > stored as a Blob

    - fs.erase(path)
        > Erases WebDesk.
        - Not sure why you would use this, but it's here.

    // Examples //

    fs.read("/notes/hello.txt").then(console.log);
    fs.write("/wallpapers/bg.png", blob, "image");
    fs.del("/old/meme.txt").then(() => console.log("Deleted."));
*/

const fuckery = new Worker('./wfs.js');

function gen(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var currentops = []

var fs = {
    read: function (path) {
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            fuckery.postMessage({ optype: "read", uID, data: path });
        });
    },
    write: function (path, data, filetype = "text") {
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            fuckery.postMessage({ optype: "write", uID, data: path, data2: data, filetype: filetype });
        });
    },
    ls: function (path) {
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            fuckery.postMessage({ optype: "ls", uID, data: path });
        });
    },
    rm: function (path) {
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            fuckery.postMessage({ optype: "rm", uID, data: path });
        });
    },
    erase: function (path) {
        const uID = gen(0, 9999);
        return new Promise((resolve, reject) => {
            currentops.push({ uID, resolve, reject });
            fuckery.postMessage({ optype: "erase", uID, data: path });
        });
    }
};

fuckery.addEventListener("message", (msg) => {
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

var set = {
    async ensureConfigLoaded() {
        if (!sys.config) {
            try {
                const raw = await fs.read("/user/info/config.json");
                sys.config = JSON.parse(raw);
                console.log(sys.config);
            } catch (e) {
                sys.config = {};
            }
        }
    },
    async set(key, value) {
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