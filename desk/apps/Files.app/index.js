var codeToKillTask = function () {
    console.log(`<i> No windows were opened! I don't even have access to my own module! Fuck off!`);
    return false;
};
export var name = "Files";

export async function close() {
    const go = codeToKillTask();
    return go;
}
var core2;
var win;

export async function launch(UI, fs, core, unused, module) {
    core2 = core;
    win = UI.window('Files', module);
    codeToKillTask = function () {
        core2.removeModule(id);
        win.closeWin();
        win = undefined;
    };
    win.win.style.width = "600px";
    win.win.style.height = "400px";
    win.headertxt.innerHTML = "";
    win.content.style.padding = "0px";
    win.content.style.display = "flex";
    const sidebar = UI.create('div', win.content, 'window-split-sidebar');
    sidebar.appendChild(win.header);
    win.header.classList.add('window-header-clear');
    win.header.style.padding = "14px";
    win.header.style.paddingBottom = "4px";
    const sidebarcontent = UI.create('div', sidebar, 'content');
    sidebarcontent.style.paddingTop = "0px";
    UI.create('span', sidebarcontent, 'smalltxt').textContent = "Favorites";

    const buttonhome = UI.button(sidebarcontent, 'Home', 'list-item');
    buttonhome.onclick = () => {
        nav("/user/");
    };

    const container = UI.create('div', win.content, 'window-split-content');
    const crumbs = UI.create('div', container, 'window-draggable');
    const filelist = UI.create('div', container);
    filelist.style.paddingTop = "4px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    crumbs.style.position = "sticky";
    crumbs.style.top = "0";
    crumbs.style.zIndex = "1";
    filelist.style.paddingTop = "4px";
    filelist.style.overflowY = "auto";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.height = "100%";
    win.header.style.flex = "none";
    sidebarcontent.style.flex = "1";
    sidebarcontent.style.overflow = "auto";

    let dir;
    async function nav(path) {
        dir = await fs.ls(path);
        console.log(path);
        console.log(dir);
        filelist.innerHTML = "";
        crumbs.innerHTML = "";
        const buttonhome = UI.button(crumbs, '/', 'ui-small-btn');
        buttonhome.onclick = () => {
            nav("");
        };
        const trimmedPath = path.replace(/\/+$/, '');
        const parts = trimmedPath.split('/').filter(Boolean);

        let currentPath = '';
        const breadcrumbs = [];

        parts.forEach((part, index) => {
            currentPath += `/${part}`;
            const crumbPath = parts.slice(0, index + 1).join('/');

            const button = UI.button(crumbs, part, 'ui-small-btn');
            button.onclick = () => {
                if (crumbPath.endsWith('/')) {
                    nav(crumbPath);
                } else {
                    nav(crumbPath + "/");
                }
            };

            breadcrumbs.push(button);
        });
        dir.forEach(function (file) {
            let name;
            if (file.kind === "directory") {
                name = `📁 ` + file.name;
            } else {
                name = `📄 ` + file.name;
            }

            async function openfile() {
                if (file.kind === "directory" && (file.path.endsWith('.app') || file.path.endsWith('.app'))) {
                    const code = await fs.read(file.path + '/index.js');
                    const mod = await core.loadModule(code);
                    await mod.launch(UI, fs, core, true);
                } else if (file.kind === "directory") {
                    nav(file.path);
                } else {
                    if (file.path.endsWith('.png') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.gif')) {
                        const code = await fs.read('/apps/Preview.app/index.js');
                        const mod = await core.loadModule(code);
                        const preview = await mod.launch(UI, fs, core);
                        preview.open(file.path, false, file.path, undefined, mod);
                    } else {
                        const code = await fs.read('/apps/TextEdit.app/index.js');
                        const mod = await core.loadModule(code);
                        const textedit = await mod.launch(UI, fs, core, undefined, mod);
                        textedit.open(file.path);
                    }
                }
            }

            const button = UI.button(filelist, name, 'list-item');
            button.addEventListener('dblclick', async function () {
                await openfile();
            });

            let contextMenu;

            button.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                UI.remove(contextMenu);
                contextMenu = UI.rightClickMenu(event);

                const openButton = UI.button(contextMenu, 'Open', 'ui-small-btn wide');
                openButton.onclick = async () => {
                    if (file.kind === "directory") {
                        await nav(file.path);
                    } else {
                        await openfile();
                    }
                    contextMenu.remove();
                };

                const deleteButton = UI.button(contextMenu, 'Delete', 'ui-small-btn wide');
                deleteButton.onclick = async () => {
                    contextMenu.remove();
                    const div = UI.create('div', document.body, 'cm');
                    UI.text(div, `Delete ${file.name}?`, 'bold');
                    UI.text(div, 'Deleted files cannot be recovered.');
                    const yesBtn = UI.button(div, 'Delete', 'ui-small-btn');
                    yesBtn.onclick = async () => {
                        UI.remove(div);
                        if (file.kind === "directory") {
                            await fs.rm(file.path, true);
                        } else {
                            await fs.rm(file.path);
                        }
                        nav(currentPath);
                    };

                    const noBtn = UI.button(div, 'Cancel', 'ui-small-btn');
                    noBtn.onclick = () => {
                        UI.remove(div);
                    };
                };

                const renameButton = UI.button(contextMenu, 'Rename', 'ui-small-btn wide');
                renameButton.onclick = async () => {
                    contextMenu.remove();
                    const div = UI.create('div', document.body, 'cm');
                    UI.text(div, `Delete ${file.name}?`, 'bold');
                    UI.text(div, 'Deleted files cannot be recovered.');
                    const yesBtn = UI.button(div, 'Rename', 'ui-small-btn');
                    yesBtn.onclick = async () => {
                        UI.remove(div);
                        if (file.kind === "directory") {
                            await fs.rm(file.path, true);
                        } else {
                            await fs.rm(file.path);
                        }
                        nav(currentPath);
                    };

                    const noBtn = UI.button(div, 'Cancel', 'ui-small-btn');
                    noBtn.onclick = () => {
                        UI.remove(div);
                    };
                };
            });
        });
    }

    document.addEventListener('keydown', async (e) => {
        if ((e.shiftKey && e.ctrlKey && e.key === 'n') && UI.focusedWindow === win.win) {
            const win2 = await launch(UI, fs, core);
            win2.window.win.style.left = (win.win.offsetLeft + 20) + "px";
            win2.window.win.style.top = (win.win.offsetTop + 20) + "px";
            win2.window.click();
        }
    });

    await nav('');
    win.updateWindow();
    return {
        open: nav,
        getDir: () => dir,
        window: win
    };
}

export async function pickFile(UI, fs, core) {
    return new Promise(async (resolve) => {
        core2 = core;
        win = UI.window('File Picker');
        codeToKillTask = function () {
            core2.removeModule(id);
            win.closeWin();
            win = undefined;
        };
        win.win.style.width = "600px";
        win.win.style.height = "400px";
        win.headertxt.innerHTML = "";
        win.content.style.padding = "0px";
        win.content.style.display = "flex";
        const sidebar = UI.create('div', win.content, 'window-split-sidebar');
        win.buttons.closeBtn.style.display = "none";
        win.content.appendChild(win.buttons.closeBtn);
        sidebar.appendChild(win.header);
        win.header.classList.add('window-header-clear');
        win.header.style.padding = "14px";
        win.header.style.paddingBottom = "4px";
        const sidebarcontent = UI.create('div', sidebar, 'content');
        sidebarcontent.style.paddingTop = "0px";
        const container = UI.create('div', win.content, 'window-split-content');
        const crumbs = UI.create('div', container, 'window-draggable');
        const filelist = UI.create('div', container);
        filelist.style.paddingTop = "4px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.height = "100%";
        crumbs.style.position = "sticky";
        crumbs.style.top = "0";
        crumbs.style.zIndex = "1";
        filelist.style.paddingTop = "4px";
        filelist.style.overflowY = "auto";
        sidebar.style.display = "flex";
        sidebar.style.flexDirection = "column";
        sidebar.style.height = "100%";
        win.header.style.flex = "none";
        sidebarcontent.style.flex = "1";
        sidebarcontent.style.overflow = "auto";
        win.header.innerHTML = "";
        UI.create('span', win.header, 'smalltxt').textContent = "Select a file";
        const cancelButton = UI.button(win.header, 'Cancel', 'ui-small-btn wide');
        cancelButton.onclick = () => {
            win.buttons.closeBtn.click();
            resolve(null);
        };

        let dir;
        async function nav(path) {
            dir = await fs.ls(path);
            filelist.innerHTML = "";
            crumbs.innerHTML = "";
            const buttonhome = UI.button(crumbs, '/', 'ui-small-btn');
            buttonhome.onclick = () => {
                nav("");
            };
            const trimmedPath = path.replace(/\/+$/, '');
            const parts = trimmedPath.split('/').filter(Boolean);

            let currentPath = '';
            const breadcrumbs = [];

            parts.forEach((part, index) => {
                currentPath += `/${part}`;
                const crumbPath = parts.slice(0, index + 1).join('/');

                const button = UI.button(crumbs, part, 'ui-small-btn');
                button.onclick = () => {
                    nav(crumbPath);
                };

                breadcrumbs.push(button);
            });

            dir.forEach(function (file) {
                let name;
                if (file.kind === "directory") {
                    name = `📁 ` + file.name;
                } else {
                    name = `📄 ` + file.name;
                }

                const button = UI.button(filelist, name, 'list-item');
                button.addEventListener('dblclick', async function () {
                    if (file.kind === "directory") {
                        nav(file.path);
                    } else {
                        win.buttons.closeBtn.click();
                        resolve(file.path);
                    }
                });
            });
        }
        await nav('');
        win.updateWindow();
    });
}