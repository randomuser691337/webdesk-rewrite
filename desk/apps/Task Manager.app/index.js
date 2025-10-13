export var name = "Task Manager";
var win;
var focusedModule = null;
var core2;
export async function launch(UI, fs, core, unused, module) {
    core2 = core;
    win = UI.window(name, module);
    const tasks = UI.create('div', win.content);
    win.win.style.width = "300px";
    win.win.style.height = "300px";
    document.body.addEventListener('click', function () {
        focusedModule = null;
    });

    core.tasks.forEach(module => {
        const selectBtn = UI.button(tasks, module.name, 'list-item');
        selectBtn.dataset.task = module.id;
        selectBtn.addEventListener('click', function () {
            setTimeout(function () {
                focusedModule = module;
                focusedModule.button = selectBtn;
            }, 100);
        });
    });

    function addButton(module) {
        const selectBtn = UI.button(tasks, module.name, 'list-item');
        selectBtn.dataset.task = module.id;
        selectBtn.addEventListener('click', function () {
            focusedModule = module;
            focusedModule.button = selectBtn;
        });
    }

    function removeButton(id) {
        console.log(id);
        const btn = tasks.querySelector(`[data-task="${id}"]`);
        if (btn) UI.remove(btn);
    }

    core.onTaskStart.push({ id: id, callback: addButton });
    core.onTaskClosed.push({ id: id, callback: removeButton });
    const actionBar = UI.create('div', win.win, 'window-footer window-draggable');
    const info = UI.button(actionBar, "Info", 'ui-med-btn');
    info.addEventListener('click', function () {
        if (!focusedModule) return UI.snack('No task selected', 2000);
        const div = UI.create('div', document.body, 'cm');
        UI.text(div, focusedModule.name, 'bold');
        UI.text(div, 'Task ID: ' + focusedModule.id);
        if (focusedModule.task.close && typeof focusedModule.task.close === 'function') {
            UI.text(div, 'Task Manager should be able to close this task');
        } else {
            UI.text(div, `Task Manager can't close this task`);
        }
        const close = UI.button(div, 'Close', 'ui-med-btn');
        close.addEventListener('click', function () {
            UI.remove(div);
        });
    });
    const kill = UI.button(actionBar, "Close Task", 'ui-med-btn');
    kill.addEventListener('click', async function () {
        if (!focusedModule) return UI.snack('No task selected', 2000);
        if (focusedModule.task.close && typeof focusedModule.task.close === 'function') {
            const response = await focusedModule.task.close();
            if (response === false) {
                
            }
            focusedModule = null;
        } else {
            UI.snack(`Task Manager can't close this task`, 2500);
        }
    });
}

export async function close() {
    core2.removeModule(id);
    focusedModule = null;
    document.body.removeEventListener('click', function () {
        focusedModule = undefined;
    });
    win.closeWin();
    win = undefined;
}