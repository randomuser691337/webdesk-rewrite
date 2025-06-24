(async function () {
    const win = UI.window('Files');
    win.win.style.width = "600px";
    win.win.style.height = "400px";
    win.headertxt.innerHTML = "";
    win.content.style.padding = "0px";
    const crumbs = UI.create('div', win.headertxt);
    const filelist = UI.create('div', win.content);
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
            button.addEventListener('dblclick', function () {
                if (file.kind === "directory") {
                    nav(file.path);
                } else {
                    fs.read(file.path).then(blob => {
                        const win = UI.window(file.name);
                        if (file.path.endsWith('.png') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.gif')) {
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
                        } else {
                            win.content.textContent = blob;
                        }
                    }).catch(err => {
                        console.error(`Failed to read ${file.name}:`, err);
                    });
                }
            });
        });
    }
    await nav('/');
})();