(async function () {
    const bootcode = await fs.read("/system/init.js");
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
        if (code) {
            await fs.write("/system/init.js", code, "text");
            p.textContent = 'Saved!';
            p.style.color = 'green';
        } else {
            p.textContent = 'Please write something!';
            p.style.color = 'red';
        }
        setTimeout(() => {
            p.textContent = 'TextEdit';
            p.style.color = '';
        }, 2000);
    };

    if (bootcode === null) {
        p.style.color = 'red';
    } else {
        textbox.value = bootcode;
    }
})();