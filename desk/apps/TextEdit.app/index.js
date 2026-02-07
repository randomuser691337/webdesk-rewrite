export var name = "TextEdit";
var core2;
var codeToKillTask = function () {
    console.log(`<i> there's NOTHING!!!!!!!!!!!!!!!!!!!!!!!`);
}

var win;

export async function launch(UI, fs, core, defaultlaunch, module) {
    core2 = core;
    async function open(path) {
        const bootcode = await fs.read(path);
        win = UI.window('TextEdit - ' + path, module);
        codeToKillTask = function () {
            core2.removeModule(id);
            win.closeWin();
            win = undefined;
        }
        win.win.style.width = "600px";

        const p = UI.text(win.content, 'TextEdit');
        const textbox = UI.create("textarea", win.content);
        textbox.placeholder = "Write here...";
        textbox.style.width = "100%";
        textbox.style.height = "400px";

        const savebutton = UI.button(win.content, "Save");
        savebutton.onclick = async () => {
            const code = textbox.value;
            await fs.write(path, code, "text");
            p.textContent = 'Saved!';
            p.style.color = 'green';
            setTimeout(() => {
                p.textContent = 'TextEdit';
                p.style.color = '';
            }, 2000);
        };

        textbox.textContent = bootcode;

        if (textbox.value === "[object File]") {
            p.innerText = "This file doesn't seem to be a text file. It's meant to be opened with something else.";
        }

        win.updateWindow();
    }

    if (defaultlaunch) {
        const code = await fs.read('/apps/Files.app/index.js');
        const mod = await core.loadModule(code);
        const path = await mod.pickFile(UI, fs, core);
        codeToKillTask = function () {
            core2.removeModule(id);
            mod.close();
            win = undefined;
        }
        if (path) {
            await open(path);
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
