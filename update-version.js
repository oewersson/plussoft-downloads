const fs = require('fs');
const path = require('path');

const newVersionArg = process.argv[2];
let newVersion = newVersionArg;

// Se não passou argumento, tenta ler do version.json
if (!newVersion) {
  try {
    const versionData = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf-8'));
    newVersion = versionData.version;
  } catch (e) {
    console.error("Por favor, informe a nova versão ou certifique-se de que o arquivo version.json existe com o campo 'version'.");
    process.exit(1);
  }
}

// Garante que a tag visível tenha o "v", ex: v1.4.0
const versionString = newVersion.startsWith('v') ? newVersion : `v${newVersion}`;
// Para o cache-bust, ex: ?v=1.4.0
const rawVersion = versionString.replace('v', '');

const indexPath = path.join(__dirname, 'index.html');

try {
  let indexContent = fs.readFileSync(indexPath, 'utf-8');

  // Atualiza o CSS (ex: href="style.css?v=25")
  indexContent = indexContent.replace(/href="style\.css\?v=[^"]+"/g, `href="style.css?v=${rawVersion}"`);

  // Atualiza o JS (ex: src="script.js?v=25")
  indexContent = indexContent.replace(/src="script\.js\?v=[^"]+"/g, `src="script.js?v=${rawVersion}"`);

  // Atualiza a tag visual no HTML (ex: <span class="site-version-tag">v25</span>)
  indexContent = indexContent.replace(/<span class="site-version-tag">[^<]+<\/span>/g, `<span class="site-version-tag">${versionString}</span>`);

  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Versão atualizada para ${versionString} com sucesso no index.html!`);
} catch (err) {
  console.error("❌ Erro ao atualizar o arquivo:", err);
}
