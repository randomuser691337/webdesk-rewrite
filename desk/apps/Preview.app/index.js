export var name = "Preview";
var win;
var core2;

var codeToKillTask = function () {
    console.log(`<i> No windows opened yet, can't kill Preview yet`);
}

export async function launch(UI, fs, core, defaultlaunch, module) {
    core2 = core;
    async function open(data, isBlobContents, title = "Preview") {
        var contents;
        codeToKillTask = function () {
            core2.removeModule(id);
            UI.remove(win.win);
            win = undefined;
        }
        win = UI.window(title, module);
        win.content.style = "backdrop-filter: blur(0px); padding: 0px";
        win.win.style.width = "450px";

        const img = new Image();

        if (isBlobContents !== true) {
            fs.read(data).then(blob => {
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }).catch(err => {
                UI.text(win.main, `An error occured while loading this image.`);
                UI.text(win.main, `Developer details: ` + err);
                return;
            });
        } else {
            const url = URL.createObjectURL(contents);
            img.onload = () => {
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }

        img.style = "max-width: 100%";
        win.content.appendChild(img);
    }

    if (defaultlaunch === true) {
        const code = await fs.read('/apps/Files.app/index.js');
        const mod = await core.loadModule(code);
        const path = await mod.pickFile(UI, fs, core);
        codeToKillTask = function () {
            core2.removeModule(id);
            mod.close();
            win = undefined;
        }
        if (path) {
            await open(path, false, path);
        } else {
            console.warn('No file selected');
        }
    }

    return {
        open: open
    };
}

export async function close() {
    codeToKillTask();
}