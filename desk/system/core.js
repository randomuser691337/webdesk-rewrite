var wd = {
    loadscript: async function (path) {
        const data = await fs.read(path);
        if (!data) {
            console.error(`<!> ${path} not found or not readable.`);
            return;
        }
        var script = document.createElement('script');
        script.textContent = data;
        document.head.appendChild(script);
    }
}