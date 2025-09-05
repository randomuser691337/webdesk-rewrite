export var name = "Migration Assistant";
var win;
var setupflexcontainer;
var core2;
var imageUrl;
var codeToKillTask = function () {
    console.log(`<i> there's NOTHING!!!!!!!!!!!!!!!!!!!!!!!`);
}

export async function launch(UI, fs, core, undefined, module) {
    core2 = core;
    codeToKillTask = function () {
        core2.removeModule(id);
        UI.remove(win.win);
        win = undefined;
    }
    win = UI.window('Migration Assistant');
    UI.text(win.content, 'Migration Assistant will close all apps.', 'bold');
    UI.text(win.content, 'Save your work before continuing.');
    const btn = UI.button(win.content, 'Continue', 'ui-med-btn');
    btn.addEventListener('click', async () => {
        UI.remove(win.win);
        await migratePane(UI, fs, core);
    });
}

export async function migratePane(UI, fs, core) {
    if (await set.read('lowend') !== "true") {
        const blob = await fs.read('/system/lib/wallpaper.jpg');
        if (blob instanceof Blob) {
            imageUrl = URL.createObjectURL(blob);
            document.body.style.backgroundImage = `url('${imageUrl}')`;
        } else {
            console.log(`<!> /system/lib/wallpaper.jpg is not an image decodable by WebDesk's UI.`);
        }
    }

    codeToKillTask = function () {
        core2.removeModule(id);
        UI.remove(setupflexcontainer);
        setupflexcontainer = undefined;
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
    }

    setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
    const setup = UI.create('div', setupflexcontainer, 'setup-window');
    UI.text(setup, "Migration Assistant", 'big-text');
    const alrSetup = await set.read('setupdone');
    if (alrSetup === "true") {
        const btn = UI.button(setup, "Exit", "ui-main-btn");
        btn.addEventListener('click', () => {
            close();
        });
    }

    const btn = UI.button(setup, "Next", "ui-main-btn");
    btn.addEventListener('click', () => {
        migratePane();
    });
}

export async function close() {
    codeToKillTask();
}