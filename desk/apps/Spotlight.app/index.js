export var name = "Spotlight";

var spotDivCont;
var spotlightData;

var codeToKillTask = function () {
    console.log(`<i> there's NOTHING!!!!!!!!!!!!!!!!!!!!!!!`);
}

export async function close() {
    codeToKillTask();
}

async function keyDown(event) {
    if (event.key === "Escape") {
        codeToKillTask();
    }
}

export async function launch(UI, fs, core) {
    function leftRightUpdate(resultsInfo, count, text) {
        resultsInfo.left.innerHTML = '';
        resultsInfo.right.innerHTML = '';

        if (count === 1) {
            resultsInfo.left.innerHTML = `${count} result (${text})`;
        } else {
            resultsInfo.left.innerHTML = `${count} results (${text})`;
        }

        const close = UI.button(resultsInfo.right, 'Close', 'ui-small-btn');
        close.addEventListener('click', function () {
            codeToKillTask();
        })
    }

    document.addEventListener('keydown', (event) => keyDown(event));
    reIndex(UI, fs, core);
    spotDivCont = UI.create('div', document.body, 'spotlight-flex-container');
    spotDivCont.addEventListener('click', function (event) {
        if (event.target === spotDivCont) {
            codeToKillTask();
        }
    });
    const spotDiv = UI.create('div', spotDivCont, 'spotlight-window');
    const omnibox = UI.input(spotDiv, 'Search for anything...', 'ui-main-input wide');
    omnibox.focus();
    const resultsInfo = UI.leftRightLayout(spotDiv);
    const results = UI.create('div', spotDiv);
    results.style.maxHeight = "60vh";
    let lastFs;
    leftRightUpdate(resultsInfo, 0, "waiting for input");
    UI.text(results, "Spotlight", "big-text");
    UI.text(results, "- Start search with / to look for files");
    UI.text(results, "- Search without / to find anything else");

    // arrow nav key code was made by AI because im a lazy fuck

    let selectedIndex = -1;

    function updateSelection(results) {
        const items = results.querySelectorAll('.list-item');
        items.forEach((el, i) => {
            el.classList.toggle('list-item-fake-focus', i === selectedIndex);
        });
    }

    async function handler(file) {
        if (file) {
            const thing = await fs.ls(file);
            console.log(thing);
            if (thing[0].isSingleFile === false) {
                const name = file.split("/").pop();
                UI.openFile({ name, path: file, kind: "directory" }, false, true);
            } else {
                UI.openFile(thing[0], false, true);
            }
            codeToKillTask();
        }
    }

    omnibox.addEventListener('keydown', async (e) => {
        const items = results.querySelectorAll('.list-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(results);
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(results);
        }

        if (e.key === 'Enter' && selectedIndex !== -1) {
            e.preventDefault();
            const item = items[selectedIndex];
            const file = item.dataset.data;
            handler(file);
        }
    });

    function focusFirstEl() {
        selectedIndex = 0;
        updateSelection(results);
    }

    omnibox.addEventListener('input', async () => {
        const query = omnibox.value.trim().toLowerCase();

        if (!query || omnibox.value === "") {
            results.innerHTML = "";
            selectedIndex = -1;
            leftRightUpdate(resultsInfo, 0, "waiting for input");
            UI.text(results, "Spotlight", "big-text");
            UI.text(results, "- Start search with / to look for files");
            UI.text(results, "- Search without / to find anything else");
            UI.text(results, `You can use arrow keys and Enter to navigate`);
            return;
        }

        let firstItem = true;
        let count = 0;
        results.innerHTML = '';
        selectedIndex = -1;
        for (const item of spotlightData) {
            if (item.name.toLowerCase().includes(query)) {
                count = count + 1;
                const row = UI.create('div', results, 'list-item');
                row.innerHTML = `<span class="bold">${item.type}</span> ${item.name}`;
                if (item.type === "app") {
                    row.dataset.data = item.path;
                    row.addEventListener('click', function () {
                        handler(item.path);
                    });
                } else if (item.type === "directory" || item.type === "file") {
                    row.dataset.data = item.path;
                    row.addEventListener('click', function () {
                        handler(item.path);
                    });
                }

                if (firstItem === true) {
                    firstItem = false;
                    focusFirstEl();
                }
            }
        }
        leftRightUpdate(resultsInfo, count, "general search");
    });

    codeToKillTask = function () {
        core.removeModule(id);
        UI.remove(spotDivCont);
        document.removeEventListener('keydown', (event) => keyDown(event));
    }
}

export async function reIndex(UI, fs, core) {
    const processing = [];
    const ignoreList = await fs.read('/apps/Spotlight.app/spotlight-ignore.json');
    const ignore = JSON.parse(ignoreList);

    // scanFS mostly written by ChatGPT

    async function scanFS(path) {
        const data = [];
        const entries = await fs.ls(path);

        for (const entry of entries) {
            const ignoref = ignore.ignoreList.some(p =>
                entry.path === p || entry.path.startsWith(p + "/")
            );

            if (ignoref) continue;

            if (entry.kind === "directory") {
                if (entry.name.endsWith(".app")) {
                    const test = await fs.ls(entry.path);
                    if (test.some(i => i.kind === "file" && i.name === "index.js")) {
                        data.push({ type: "app", name: entry.name, path: entry.path });
                    }
                } else {
                    data.push({ type: "directory", name: entry.name, path: entry.path });
                }

                data.push(...await scanFS(entry.path));
            } else {
                data.push({ type: "file", name: entry.path, path: entry.path });
            }
        }

        return data;
    }

    const thing = await scanFS('/');

    // okay this was written by me

    thing.forEach(async function (file) {
        processing.push({
            type: file.type,
            name: file.name,
            path: file.path
        });
    });

    spotlightData = processing;
    console.log('Indexed:', spotlightData);
}
