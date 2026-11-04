import React, { useState } from 'react';
import { useQR } from '../context/QRContext';
import { 
  FolderGit2, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Upload, 
  Globe, 
  Save, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

export const GitHubPublishView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportDataJSON, 
    importDataJSON, 
    resetToDemoData 
  } = useQR();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [baseUrlInput, setBaseUrlInput] = useState(settings.baseUrl || '');
  const [githubUser, setGithubUser] = useState(settings.githubUsername || '');
  const [githubRepo, setGithubRepo] = useState(settings.githubRepo || 'qr-restaurantes');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      baseUrl: baseUrlInput.trim(),
      githubUsername: githubUser.trim(),
      githubRepo: githubRepo.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAutoSuggestUrl = () => {
    if (githubUser && githubRepo) {
      const suggested = `https://${githubUser.toLowerCase()}.github.io/${githubRepo.toLowerCase()}`;
      setBaseUrlInput(suggested);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataJSON(content);
        if (ok) {
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('El archivo seleccionado no tiene un formato válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const gitScript = `cd "C:\\Users\\Usuario\\Desktop\\QR Restaurantes"
git init
git add .
git commit -m "Publicar sistema QR Restaurantes"
git branch -M main
git remote add origin https://github.com/${githubUser || 'TU-USUARIO'}/${githubRepo || 'qr-restaurantes'}.git
git push -u origin main`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-white">
      
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-white">
            Publicación en GitHub Pages & Servidor
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Configura la URL pública de producción para que tus códigos QR dinámicos funcionen desde GitHub o cualquier hosting.
        </p>
      </div>

      {/* Production Base URL Configuration Card */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              URL Base Pública de Producción (GitHub Pages / Servidor)
            </h3>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Esta es la dirección pública donde estará alojada tu web. Todos los códigos QR generados incluirán esta dirección (ej: <code className="text-zinc-200">https://usuario.github.io/qr-restaurantes/?r=el-roble</code>).
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tu usuario de GitHub:
              </label>
              <input
                type="text"
                placeholder="ej. jonycusac"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nombre del repositorio:
              </label>
              <input
                type="text"
                placeholder="ej. qr-restaurantes"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-300">
                URL Base para los Códigos QR:
              </label>
              {githubUser && (
                <button
                  type="button"
                  onClick={handleAutoSuggestUrl}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Autocompletar con GitHub Pages</span>
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder="https://tu-usuario.github.io/qr-restaurantes"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-black border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Si dejas este campo vacío, el sistema utilizará automáticamente la dirección actual del navegador.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Configuración guardada con éxito</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4 text-black" />
              <span>Guardar URL Base</span>
            </button>
          </div>
        </form>
      </div>

      {/* Git Command Helper */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Terminal className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Comandos para publicar desde tu carpeta local
          </h3>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Ejecuta estos comandos en tu terminal de Windows (PowerShell o Git Bash) dentro de tu carpeta:
        </p>

        <div className="p-4 bg-black rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200 relative group">
          <button
            onClick={() => handleCopy(gitScript, 1)}
            className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 hover:text-white transition-colors"
            title="Copiar comandos"
          >
            {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {gitScript}
          </pre>
        </div>

        {/* Step to enable pages */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-white">
            <Info className="w-4 h-4 text-amber-500" />
            <span>Paso final en GitHub:</span>
          </div>
          <p className="text-zinc-400 pl-6 leading-relaxed">
            Entra en tu repositorio de GitHub en <strong>Settings &gt; Pages</strong>, selecciona la rama <strong>main</strong> y pulsa <strong>Save</strong>. En 1 minuto tendrás tu web activa.
          </p>
        </div>
      </div>

      {/* Backup and Restore Section */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="pb-3 border-b border-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Copia de Seguridad de tus Restaurantes (Archivo JSON)
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Descarga una copia de todos los restaurantes dados de alta, sus URLs y contadores para guardarla en tu disco local o importarla en otro equipo.
          </p>
        </div>

        {importSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Copia de seguridad restaurada correctamente.</span>
          </div>
        )}

        {importError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {importError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportDataJSON}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Descargar Copia JSON</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restaurar Copia JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('¿Deseas restaurar los restaurantes de ejemplo iniciales?')) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-zinc-500 hover:text-rose-400 text-xs font-medium transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar ejemplos</span>
          </button>
        </div>
      </div>

    </div>
  );
};
