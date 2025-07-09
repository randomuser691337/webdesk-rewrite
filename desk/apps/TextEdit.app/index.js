export async function launch(UI, fs, Scripts) {
    async function open(path) {
        const bootcode = await fs.read(path);
        const debugwin = UI.window('TextEdit');
        debugwin.win.style.width = "600px";
        debugwin.win.style.height = "600px";

        const p = UI.text(debugwin.content, 'TextEdit');
        const textbox = UI.create("textarea", debugwin.content);
        textbox.placeholder = "Write here...";
        textbox.style.width = "100%";
        textbox.style.height = "400px";

        const savebutton = UI.button(debugwin.content, "Save");
        savebutton.onclick = async () => {
            const code = textbox.value;
            await fs.write(path, code, "text");
            p.textContent = 'Saved!';
            p.style.color = 'green';
            setTimeout(() => {
                p.textContent = 'TextEdit';
                p.style.color = '';
            }, 2000);
        };

        textbox.value = bootcode;
    }

    /* if (defaultlaunch) {
        const defaultPath = '/apps/TextEdit.app/default.txt';
        await open(defaultPath);
    } else {
        const path = await fs.selectFile('Select a file to edit', 'text');
        if (path) {
            await open(path);
        } else {
            console.warn('No file selected');
        }
    } */

    return {
        open: open
    };
}