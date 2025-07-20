export async function launch(UI, fs, Scripts) {
    const win = UI.window('Settings');
    win.win.style.width = "400px";
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
    UI.create('span', sidebarcontent, 'smalltxt').textContent = "Settings";

    const generalButton = UI.button(sidebarcontent, 'General', 'ui-main-btn wide');
    generalButton.addEventListener('click', () => {
        General();
    });
    const personalizeButton = UI.button(sidebarcontent, 'Personalize', 'ui-main-btn wide');
    personalizeButton.addEventListener('click', () => {
        Personalize();
    });

    const container = UI.create('div', win.content, 'window-split-content');
    const title = UI.create('div', container, 'window-draggable');
    const content = UI.create('div', container);
    content.style.paddingTop = "4px";

    function General() {
        title.innerText = "General";
    }

    function Personalize() {
        title.innerText = "Personalization";
        // Accent color buttons based off https://developer.apple.com/design/human-interface-guidelines/color
        const colors = [
            '0,122,255',   // Blue
            '90,200,250',  // Light Blue
            '52,199,89',   // Green
            '255,204,0',   // Yellow
            '255,149,0',   // Orange
            '255,45,85',   // Red
            '175,82,222'   // Purple
        ];
        content.innerHTML = '';
        colors.forEach(color => {
            const colorButton = UI.button(content, '', 'accent-button');
            colorButton.style.backgroundColor = "rgb(" + color + ")";
            colorButton.addEventListener('click', () => {
                UI.changevar('ui-accent', color);
                set.set('color', color);
            });
        });
    }

    win.updateWindow();
    return {
        
    };
}