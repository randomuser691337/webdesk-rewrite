export async function launch(UI, fs, Scripts) {
    const win = UI.window('Files');
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
    const container = UI.create('div', win.content, 'window-split-content');
    const crumbs = UI.create('div', container, 'window-draggable');
    const filelist = UI.create('div', container);
    filelist.style.paddingTop = "4px";
    let dir;
    async function nav(path) {
        dir = await fs.ls(path);
        filelist.innerHTML = "";
        crumbs.innerHTML = "";
        const buttonhome = UI.button(crumbs, '/', 'ui-small-btn');
        buttonhome.onclick = () => {
            nav("/");
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
                nav("/" + crumbPath);
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

            const button = UI.button(filelist, name, 'files-list');
            button.addEventListener('dblclick', async function () {
                if (file.kind === "directory") {
                    nav(file.path);
                } else {
                    if (file.path.endsWith('.png') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.gif')) {
                        fs.read(file.path).then(blob => {
                            const win = UI.window(file.name);
                            win.content.style = "backdrop-filter: blur(0px); padding: 0px";
                            win.win.style.width = "450px";
                            const img = new Image();
                            const url = URL.createObjectURL(blob);
                            img.onload = () => {
                                URL.revokeObjectURL(url);
                            };
                            img.src = url;
                            img.style = "max-width: 100%";
                            win.content.appendChild(img);
                        }).catch(err => {
                            console.error(`Failed to read ${file.name}:`, err);
                        });
                    } else {
                        const code = await fs.read('/apps/TextEdit.app/index.js');
                        const mod = await Scripts.loadModule(code);
                        const textedit = await mod.launch(UI, fs);
                        textedit.open(file.path);
                    }
                }
            });
        });
    }
    await nav('/');
    win.updateDraggables();
    return {
        open: nav,
        getDir: () => dir,
    };
}