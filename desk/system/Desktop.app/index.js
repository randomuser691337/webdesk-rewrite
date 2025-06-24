(async function () {
    const taskbar = UI.create('div', document.body, 'taskbar');
    const left = UI.create('div', taskbar, 'window-header-nav');
    const right = UI.create('div', taskbar, 'window-header-text')
    const appBTN = UI.button(left, 'Apps', 'ui-main-btn');
    const contBTN = UI.button(right, 'Controls', 'ui-main-btn');
    let remove = undefined;
    let removename = "undefined"

    async function openAppMenu() {
        const appdiv = UI.create('div', document.body, 'taskbar-menu');
        let items = await fs.ls('/system/Desktop.app/Items');
        items.forEach(function (file) {
            const btn = UI.button(appdiv, file.name, 'ui-main-btn wide');
            btn.addEventListener('click', async function () {
                const pathnew = await fs.read(file.path);
                await Scripts.loadJS(pathnew);
            });
        });
        const taskrect = taskbar.getBoundingClientRect();
        console.log(taskrect);
        appdiv.style.left = taskrect.left + "px";
        appdiv.style.bottom = taskrect.height + taskrect.left + taskrect.left + 1 + "px";

        remove = function () {
            items = undefined;
            UI.remove(appdiv);
            remove = undefined;
        }
        removename = "apps"
    }

    async function openControls() {
        const appdiv = UI.create('div', document.body, 'taskbar-menu');
        const inputElement = UI.create('input', appdiv);
        inputElement.type = "file";

        inputElement.addEventListener("change", async function () {
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
        console.log(taskrect);
        appdiv.style.left = taskrect.x + "px";
        appdiv.style.bottom = taskrect.height + "px";

        remove = function () {
            items = undefined;
            UI.remove(appdiv);
            remove = undefined;
        }
        removename = "sm"
    }

    appBTN.addEventListener('click', async function () {
        if (removename === "apps") {
            remove();
        } else {
            await openAppMenu();
        }
    });

    contBTN.addEventListener('click', async function () {
        if (removename === "sm") {
            remove();
        } else {
            await openControls();
        }
    });
})();