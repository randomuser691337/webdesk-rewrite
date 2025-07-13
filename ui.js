var windowHighestZIndex = 0;

var UI = {
    create: function (eltype, parent, classname) {
        var el = document.createElement(eltype);
        if (classname) el.classList = classname;
        if (parent) parent.appendChild(el);
        return el;
    },
    button: function (parent, text, classname) {
        var btn = this.create("button", parent, classname);
        if (typeof classname === "string" && classname.includes("ui-main-btn")) {
            const txt = this.create("div", btn, "ui-main-btn-filler");
            txt.textContent = text;
        } else if (typeof classname === "string" && classname.includes("ui-small-btn")) {
            const txt = this.create("div", btn, "ui-small-btn-filler");
            txt.textContent = text;
        } else {
            btn.textContent = text;
        }
        return btn;
    },
    text: function (parent, text, classname) {
        var txt = this.create("p", parent, classname);
        txt.textContent = text;
        return txt;
    },
    window: function (title) {
        const win = this.create("div", document.body, "window");
        const header = this.create("div", win, "window-header window-draggable");
        const headerbtns = this.create("div", header, "window-header-nav");
        const headerbtnscont = this.create("div", headerbtns, "window-header-nav-cont");
        const headertxt = this.create("div", header, "window-header-text");
        const content = this.create("div", win, "window-content");
        headertxt.textContent = title;
        windowHighestZIndex += 1;
        win.style.zIndex = windowHighestZIndex;
        win.addEventListener("mousedown", () => {
            if (parseInt(win.style.zIndex) !== windowHighestZIndex) {
                windowHighestZIndex += 1;
                win.style.zIndex = windowHighestZIndex;
            }
            UI.focusedWindow = win;
        });

        const closeBtn = this.button(headerbtnscont, '', "window-btn close-btn");
        const minBtn = this.button(headerbtnscont, '', "window-btn min-btn");
        const maxBtn = this.button(headerbtnscont, '', "window-btn max-btn");

        let offsetX = 0, offsetY = 0;
        let isDragging = false;

        const onPointerMove = (e) => {
            if (!isDragging) return;
            win.style.position = "absolute";
            win.style.left = `${e.clientX - offsetX}px`;
            win.style.top = `${e.clientY - offsetY}px`;
        };

        const onPointerUp = () => {
            isDragging = false;
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };

        const setupDraggable = (el) => {
            el.style.touchAction = "none";
            el.addEventListener("pointerdown", (e) => {
                const rect = win.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                isDragging = true;

                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
            });
        };

        const updateWindow = () => {
            const draggables = win.querySelectorAll('.window-draggable');
            draggables.forEach(setupDraggable);
            win.style.left = `${(window.innerWidth - win.offsetWidth) / 2}px`;
            win.style.top = `${(window.innerHeight - win.offsetHeight) / 2}px`;
        };

        updateWindow();

        closeBtn.addEventListener("click", () => {
            win.remove();
        });

        return { win, header, content, headertxt, headerbtns, buttons: { closeBtn, minBtn, maxBtn, container: headerbtnscont }, updateWindow };
    },
    img: async function (parent, path, classname) {
        const blob = await fs.read(path);
        if (blob instanceof Blob) {
            const img = this.create('img', parent, classname);
            img.src = URL.createObjectURL(blob);
        } else {
            console.log(`<!> ` + path + ` is not an image decodable by WebDesk's UI.`);
        }
    },
    changevar: function (varname, value) {
        document.documentElement.style.setProperty(`--${varname}`, value);
    },
    remove: function (div) {
        div.remove();
    },
    truncate: function (text, maxLength, ellipsis = true) {
        if (text.length <= maxLength) return text;
        if (ellipsis) {
            return text.slice(0, maxLength - 3) + '...';
        } else {
            return text.slice(0, maxLength);
        }
    },
    rightClickMenu: function (event) {
        const menu = this.create('div', document.body, 'right-click-menu');
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        document.addEventListener('click', () => {
            this.remove(menu);
        }, { once: true });

        return menu;
    },
    focusedWindow: undefined,
}