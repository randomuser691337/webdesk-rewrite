export var name = "Online Services";
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
        win.closeWin();
        win = undefined;
    }
}

export async function close() {
    codeToKillTask();
}