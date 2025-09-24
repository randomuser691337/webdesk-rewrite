var windowHighestZIndex = 0;
var notifPane;
console.log('<i> UI is here');
UI = {
    LLMName: "Chloe",
    userName: "User",
    create: function (eltype, parent, classname) {
        var el = document.createElement(eltype);
        if (classname) el.classList = classname;
        if (parent) parent.appendChild(el);
        return el;
    },
    menuSlide: function (element, options) {
        /* 
            options variable:
            - true: show element via slide
            - false: hide element via slide
            - "setup": adds proper stylings to element, default hidden
            - "stop": removes proper stylings from element 
            - undefined: toggle
        */

        if (options === true) {
            element.style.transform = "translateX(0%)";
            element.style.opacity = "1";
        } else if (options === "setup") {
            element.style.transition = "transform 0.25s ease, opacity 0.25s ease";
            element.style.transform = "translateX(-100%)";
            element.style.opacity = "0";
        } else if (options === "stop") {
            element.style.transition = "";
            element.style.transform = "";
            element.style.opacity = "";
        } else if (options === false) {
            element.style.transform = "translateX(-100%)";
            element.style.opacity = "0";
        } else {
            if (element.style.transform === "translateX(0%)") {
                element.style.transform = "translateX(-100%)";
                element.style.opacity = "0";
            } else {
                element.style.transform = "translateX(0%)";
                element.style.opacity = "1";
            }
        }
    },
    button: function (parent, text, classname) {
        var btn = this.create("button", parent, classname + " webdesk-ui-styling noselect");
        btn.setAttribute("role", "button");
        btn.tabIndex = 0;
        btn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                btn.click();
            }
        });

        if (typeof classname === "string" && classname.includes("ui-big-btn")) {
            const txt = this.create("div", btn, "ui-big-btn-filler noselect");
            txt.textContent = text;
            btn.Filler = txt;
        } else if (typeof classname === "string" && classname.includes("ui-small-btn")) {
            const txt = this.create("div", btn, "ui-small-btn-filler noselect");
            txt.textContent = text;
            btn.Filler = txt;
        } else if (typeof classname === "string" && classname.includes("ui-med-btn")) {
            const txt = this.create("div", btn, "ui-med-btn-filler noselect");
            txt.textContent = text;
            btn.Filler = txt;
        } else {
            btn.textContent = text;
        }

        if (btn.Filler) {
            const b = btn.Filler;
            if (sys.lowgfxMode === true) {
                b.style.transition = "0.04s ease-in-out";
                b.onmouseenter = (e) => {
                    e.target.style.background = "rgba(var(--ui-accent), 0.25)";
                };

                b.onmouseleave = (e) => {
                    e.target.style.background = "rgba(var(--ui-accent), 0.2)";
                };

                b.onmousedown = (e) => {
                    e.target.style.background = "rgba(var(--ui-accent), 0.3)";
                };
            } else {
                b.onmouseleave = (e) => {
                    e.target.style.background = "rgba(var(--ui-accent), 0.2)";
                };

                b.addEventListener("mousemove", (e) => {
                    const { left, top } = e.target.getBoundingClientRect();
                    const x = e.clientX - left;
                    const y = e.clientY - top;
                    const accent = 'rgba(var(--ui-accent),';
                    const bg =
                        e.buttons === 1
                            ? `radial-gradient(circle at ${x}px ${y}px, ${accent}0.4), ${accent}0.2)`
                            : `radial-gradient(circle at ${x}px ${y}px, ${accent}0.3), ${accent}0.2)`;
                    e.target.style.background = bg;
                });

                b.addEventListener("mousedown", (e) => {
                    const rect = e.target.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                });
            }
        }

        btn.dropBtnDecor = function () {
            let elappend = btn;
            if (btn.Filler) {
                elappend = btn.Filler;
            }

            btn.style.setProperty("transform", "scale(1.0)", "important");
            const el = UI.create('span', elappend)
            el.innerText = ">";
            el.style = "display: inline-block; transform: rotate(90deg); margin-left: 4px;";
        };

        return btn;
    },
    input: function (parent, placeholder, classname, type) {
        var input = this.create("input", parent, classname);
        input.placeholder = placeholder;
        if (type) {
            input.type = type;
        }
        return input;
    },
    notif: async function (title, body, icon) {
        const notif = UI.create('div', notifPane, 'wd-notif');
        const closeBtn = UI.button(notif, 'x', 'wd-notif-close-button');
        closeBtn.addEventListener('click', () => {
            UI.remove(notif);
        });
        const wdNotifToast = UI.create('div', notif, 'wd-notif-toast');
        let iconImg;
        if (icon) {
            iconImg = UI.img(wdNotifToast, icon, 'wd-notif-img');
        } else {
            iconImg = UI.img(wdNotifToast, '/system/lib/img/notification-toast.svg', 'wd-notif-img');
        }

        const contents = UI.create('div', notif, 'wd-notif-contents');
        const titleDiv = UI.create('div', contents, 'wd-notif-title');
        const name = UI.create('div', titleDiv, 'wd-notif-title-name bold');
        const time = UI.create('div', titleDiv, 'wd-notif-title-time smalltxt');
        name.innerText = title;
        time.innerText = UI.getDate();
        const mainDiv = UI.create('div', contents);
        if (body) {
            mainDiv.innerText = body;
        }

        return { notif, name, time, mainDiv, titleDiv, iconImg, contents, wdNotifToast }
    },
    getDate: function (type) {
        const now = new Date();
        if (type === "military") {
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
        }
    },
    sendToLLM: async function (messages, userContent, token) {
        try {
            const result = await sys.LLM.send(messages, userContent, token);
            if (result && result.responseMessage) {
                return result.responseMessage;
            } else {
                throw new Error("<!> No response from LLM");
            }
        } catch (error) {
            console.error("<!> Error sending to LLM:", error);
            throw new Error("Error sending to LLM");
        }
    },
    text: function (parent, text, classname) {
        var txt = this.create("p", parent, classname);
        txt.textContent = text;
        return txt;
    },
    window: function (title, module) {
        const win = this.create("div", document.body, "window");
        const header = this.create("div", win, "window-header window-draggable");
        const headerbtns = this.create("div", header, "window-header-nav");
        const headertxt = this.create("div", header, "window-header-text");
        const content = this.create("div", win, "window-content");
        headertxt.textContent = title;
        windowHighestZIndex += 1;
        win.style.zIndex = windowHighestZIndex;

        const closeBtn = this.button(headerbtns, '', "window-btn close-btn");
        const minBtn = this.button(headerbtns, '', "window-btn min-btn");
        const maxBtn = this.button(headerbtns, '', "window-btn max-btn");

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
            if (module) {
                console.log(module);
                if (typeof module.close === 'function') {
                    module.close();
                }
            } else {
                win.remove();
            }
        });

        const winFinal = { win, header, content, headertxt, headerbtns, title, buttons: { closeBtn, minBtn, maxBtn, container: headerbtns }, updateWindow }
        win.addEventListener("mousedown", () => {
            if (parseInt(win.style.zIndex) !== windowHighestZIndex) {
                windowHighestZIndex += 1;
                win.style.zIndex = windowHighestZIndex;
            }
            UI.focusedWindow = winFinal;
        });

        win.click();
        win.dataset.name = title;
        return winFinal;
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
    readvar: function (varname) {
        return getComputedStyle(document.documentElement).getPropertyValue(`--${varname}`).trim();
    },
    remove: function (element) {
        element.remove();
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
        menu.style.maxHeight = window.innerHeight - event.clientY - 30 + "px";
        menu.style.maxWidth = window.innerWidth - event.clientX - 30 + "px";
        console.log(event.clientX);

        setTimeout(function () {
            document.addEventListener('click', () => {
                UI.remove(menu);
            }, { once: true });
        }, 100);

        return menu;
    },
    line: function (parent) {
        UI.create('div', parent, 'group-line');
    },
    leftRightLayout: function (parent) {
        const container = this.create('div', parent, 'flexbox');
        const left = this.create('div', container, 'flexbox-left');
        const right = this.create('div', container, 'flexbox-right');
        return { left, right };
    },
    snack: function (message, duration = 5000) {
        const snackbar = this.create('div', document.body, 'snack');
        snackbar.textContent = message;
        setTimeout(() => {
            UI.remove(snackbar);
        }, duration);
        return snackbar;
    },
    focusedWindow: undefined,
    System: {
        darkMode: function () {
            UI.changevar('ui-primary', '40, 40, 40');
            UI.changevar('ui-secondary', '50, 50, 50');
            UI.changevar('ui-tertiary', '60, 60, 60');
            UI.changevar('text', '#fff');
        },
        lightMode: function () {
            UI.changevar('ui-primary', '255, 255, 255');
            UI.changevar('ui-secondary', '245, 245, 245');
            UI.changevar('ui-tertiary', '235, 235, 235');
            UI.changevar('text', '#000');
        },
        llmRing: function (state) {
            // My name is Connor.
            // I'm the android sent by CyberLife.
            const ring = document.querySelector('.ring');
            if (ring) {
                if (state === 'waiting') {
                    ring.style.setProperty('--color-start', '#08f');
                    ring.style.setProperty('--color-end', '#00f');
                    ring.style.setProperty('--speed', '4s');
                } else if (state === 'thinking') {
                    ring.style.setProperty('--color-start', '#fe0');
                    ring.style.setProperty('--color-end', '#fb0');
                    ring.style.setProperty('--speed', '2.5s');
                } else if (state === 'disabled') {
                    ring.style.setProperty('--color-start', '#999');
                    ring.style.setProperty('--color-end', '#999');
                    ring.style.setProperty('--speed', '2.5s');
                    sys.LLMLoaded = false;
                } else if (state === "loading") {
                    ring.style.setProperty('--color-start', '#c9f');
                    ring.style.setProperty('--color-end', '#88f');
                    ring.style.setProperty('--speed', '1s');
                } else if (state === 'error') {
                    // DEVIANT!!!!!
                    ring.style.setProperty('--color-start', '#f00');
                    ring.style.setProperty('--color-end', '#f00');
                    setTimeout(() => {
                        ring.style.setProperty('--color-start', 'rgb(0, 0, 0, 0)');
                        ring.style.setProperty('--color-end', 'rgb(0, 0, 0, 0)');
                        setTimeout(() => {
                            ring.style.setProperty('--color-start', '#f00');
                            ring.style.setProperty('--color-end', '#f00');
                            setTimeout(() => {
                                UI.System.llmRing('waiting');
                            }, 200);
                        }, 170);
                    }, 200);
                }
            }
        },
        lowgfxMode: function (lowgfx) {
            if (lowgfx === true) {
                UI.changevar('main-ui-blur', '0px');
                UI.changevar('ui-transparancy', '1');
                UI.changevar('big-shadow', 'none');
                UI.changevar('small-shadow', 'none');
                sys.lowgfxMode = true;
            } else {
                UI.changevar('main-ui-blur', '8px');
                UI.changevar('ui-transparancy', '0.85');
                UI.changevar('big-shadow', '0 6px 12px rgba(0, 0, 0, 0.2)')
                UI.changevar('small-shadow', '1px 0 8px rgba(0, 0, 0, 0.12)');
                sys.lowgfxMode = false;
            }
        },
        generateBlobWallpaper: function () {
            // ENTIRELY AI GENERATED - slightly modified by me for performance
            const code = `
            self.onmessage = async (e) => {
            const { width, height, textColor, accentColor } = e.data;
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const colors = [];
            function selectRandomColor() {
                const predefinedColors = [0, 30, 60, 120, 180, 240, 270, 300];
                let hue;
                do {
                hue = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
                } while (colors.some(c => c.startsWith(\`hsl(\${hue},\`)));
                return hue;
            }

            while (colors.length < 5) {
                const hue = selectRandomColor();
                const sat = 100;
                const light = textColor === "#fff" ? 30 : 80;
                colors.push(\`hsl(\${hue},\${sat}%,\${light}%)\`);
            }

            colors[Math.floor(Math.random() * colors.length)] = \`rgb(\${accentColor})\`;

            ctx.fillStyle = colors[0];
            ctx.fillRect(0, 0, width, height);

            for (let i = 1; i < colors.length; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const maxR = Math.max(width, height);
                const radius = maxR * (0.4 + Math.random() * 0.6);

                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, colors[i]);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }

            ctx.globalAlpha = 0.5;
            for (let j = 0; j < 4; j++) {
                ctx.drawImage(canvas, Math.random() * 10 - 5, Math.random() * 10 - 5);
            }
            ctx.globalAlpha = 1;

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const n = (Math.random() - 0.5) * 4;
                data[i] += n;
                data[i + 1] += n;
                data[i + 2] += n;
            }
            ctx.putImageData(imageData, 0, 0);

            const blob = await canvas.convertToBlob({ type: 'image/png' });
            self.postMessage(blob);
            };
            `;

            const width = window.screen.width * window.devicePixelRatio;
            const height = window.screen.height * window.devicePixelRatio;
            const textColor = UI.readvar('text');
            const accentColor = UI.readvar('ui-accent');

            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);

            worker.onmessage = (e) => {
                const blob = e.data;
                const imgUrl = URL.createObjectURL(blob);

                const img = new Image();
                img.onload = async function () {
                    (async function () { document.body.style.backgroundImage = `url(${imgUrl})`; })();
                    setTimeout(() => {
                        URL.revokeObjectURL(imgUrl);
                        worker.terminate();
                        URL.revokeObjectURL(url);
                    }, 1000);
                };
                img.src = imgUrl;
            };

            worker.postMessage({ width, height, textColor, accentColor });
        }
    }
}

notifPane = UI.create('div', document.body, 'notif-pane');