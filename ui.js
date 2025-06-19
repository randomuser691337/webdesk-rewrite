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
        const header = this.create("div", win, "window-header");
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
        });

        const closeBtn = this.button(headerbtnscont, '', "window-btn close-btn");
        const minBtn = this.button(headerbtnscont, '', "window-btn min-btn");
        const maxBtn = this.button(headerbtnscont, '', "window-btn max-btn");

        let offsetX = 0, offsetY = 0;
        let isDragging = false;

        header.style.touchAction = "none";

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

        header.addEventListener("pointerdown", (e) => {
            const rect = win.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            isDragging = true;

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
        });

        /* Default close button, redefine like this for example:
        const win = UI.window('example');
        win.buttons.closeBtn.addEventListener("click", () => {
            win.remove();
        }); */

        closeBtn.addEventListener("click", () => {
            win.remove();
        });

        return { win, header, content, headertxt, headerbtns, buttons: { closeBtn, minBtn, maxBtn } };
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
}