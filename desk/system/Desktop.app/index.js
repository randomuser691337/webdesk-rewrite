(async function () {
    const taskbar = UI.create('div', document.body, 'taskbar');
    const left = UI.create('div', taskbar, 'window-header-nav');
    const right = UI.create('div', taskbar, 'window-header-text');
    const appBTN = UI.button(left, 'Apps', 'ui-main-btn');
    const contBTN = UI.button(right, 'Controls', 'ui-main-btn');

    let currentMenu = {
        element: null,
        type: null
    };

    function closeCurrentMenu() {
        if (currentMenu.element) {
            UI.remove(currentMenu.element);
            document.removeEventListener('mousedown', handleOutsideClick);
            currentMenu.element = null;
            currentMenu.type = null;
        }
    }

    function handleOutsideClick(e) {
        if (
            currentMenu.element &&
            !currentMenu.element.contains(e.target) &&
            !appBTN.contains(e.target) &&
            !contBTN.contains(e.target)
        ) {
            closeCurrentMenu();
        }
    }

    async function openAppMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";
        const items = await fs.ls('/system/Desktop.app/Items');
        for (const file of items) {
            const btn = UI.button(menu, file.name, 'ui-main-btn wide');
            btn.addEventListener('click', async () => {
                const code = await fs.read(file.path);
                await Scripts.loadJS(code);
                closeCurrentMenu();
            });
        }

        currentMenu.element = menu;
        currentMenu.type = "apps";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    async function openControlsMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const input = UI.create('input', menu);
        input.type = "file";
        input.addEventListener("change", async function () {
            for (const file of this.files) {
                const path = `/uploads/${file.name}`;
                const isImage = file.type.startsWith("image");
                const content = isImage ? file : await file.text();

                try {
                    await fs.write(path, content, isImage ? "image" : "text");
                    const blob = await fs.read(path);
                    if (isImage && blob instanceof Blob) {
                        const img = document.createElement("img");
                        img.src = URL.createObjectURL(blob);
                        img.style.maxWidth = "200px";
                        document.body.appendChild(img);
                    } else {
                        console.log(`Text file contents of ${file.name}:`, blob);
                    }
                } catch (err) {
                    console.error(`Failed to process ${file.name}:`, err);
                }
            }
        });

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.right = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";

        currentMenu.element = menu;
        currentMenu.type = "controls";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    appBTN.addEventListener('click', async () => {
        if (currentMenu.type === "apps") {
            closeCurrentMenu();
        } else {
            await openAppMenu();
        }
    });

    contBTN.addEventListener('click', async () => {
        if (currentMenu.type === "controls") {
            closeCurrentMenu();
        } else {
            await openControlsMenu();
        }
    });
})();