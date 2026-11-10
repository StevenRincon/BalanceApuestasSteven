import React, { useState } from 'react';
import {
  Database,
  Cloud,
  FileCode,
  Key,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers
} from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { MONGOOSE_SCHEMAS_CODE } from '../../server/mongoose-schemas';
import { ZOD_SCHEMAS_CODE } from '../../server/zod-schemas';

export const DatabaseAndVercelGuide: React.FC = () => {
  const {
    exportDatabaseJSON,
    importDatabaseJSON,
    showToast,
    resetToDemoData,
    clearAllData,
  } = useBetApp();

  const [activeCodeTab, setActiveCodeTab] = useState<'mongoose' | 'zod' | 'vercel_api' | 'env'>('env');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generador interactivo de MONGODB_URI
  const [atlasCluster, setAtlasCluster] = useState('cluster0.xxxxx.mongodb.net');
  const [atlasUser, setAtlasUser] = useState('betstats_admin');
  const [atlasPass, setAtlasPass] = useState('TuPasswordSeguro123');
  const [dbName, setDbName] = useState('betstats_db');
  const [authSecret] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) => value.toString(16).padStart(2, '0')).join('')
  );

  const generatedUri = `mongodb+srv://${atlasUser}:${atlasPass}@${atlasCluster}/${dbName}?retryWrites=true&w=majority`;

  const envFileContent = `# ==========================================
# BetStats COP - Variables de Entorno para Vercel & MongoDB
# ==========================================

# Conexión a MongoDB Atlas (Reemplaza con tus credenciales de Atlas)
MONGODB_URI="${generatedUri}"

# Clave secreta para firmar las sesiones
AUTH_SECRET="${authSecret}"

# Añade estos valores en Settings > Environment Variables en Vercel.
`;

  const vercelFunctionsGuide = `Funciones serverless desplegadas en este mismo proyecto:

api/auth/register.ts  -> POST /api/auth/register
api/auth/login.ts     -> POST /api/auth/login
api/auth/me.ts        -> GET  /api/auth/me
api/auth/logout.ts    -> POST /api/auth/logout
api/bets.ts           -> GET, POST, PUT, DELETE /api/bets
api/bets/[id].ts      -> PUT, DELETE /api/bets/:id

Vercel detecta automáticamente los archivos dentro de api/.
La interfaz Vite se compila en dist/ usando vercel.json.
Configura MONGODB_URI y AUTH_SECRET en los ajustes del proyecto Vercel.`;

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast('Copiado al portapapeles', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadBackup = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BetStats_Backup_MongoDB_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Conexión MongoDB Atlas y despliegue
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          BetStats guarda las apuestas por cuenta con funciones serverless de Vercel y MongoDB Atlas.
        </p>
      </div>

      <div className="rounded-lg border border-sky-800/50 bg-sky-950/20 p-4 text-xs text-sky-200">
        Configura <code className="font-mono">MONGODB_URI</code> y <code className="font-mono">AUTH_SECRET</code> en los ajustes del proyecto Vercel. La carpeta <code className="font-mono">api/</code> contiene las funciones serverless que se despliegan junto con esta aplicación; los secretos no se exponen al navegador.
      </div>

      {/* Backup y Migración de Base de Datos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Respaldo y Migración de Datos (JSON / MongoDB Ready)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Exporta tu base de datos completa para guardarla en tu equipo o importarla directamente a tu clúster de MongoDB Atlas
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Copia de Seguridad JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Restaurar Copia de Seguridad</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDemoData}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors"
          >
            Restaurar Datos de Demostración
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar todos los datos de jugadas y movimientos para comenzar en blanco?')) {
                clearAllData();
              }
            }}
            className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-md transition-colors"
          >
            Vaciar Base de Datos
          </button>
        </div>
      </div>

      {/* Generador de Cadena de Conexión y .env */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          Generador de Variables de Entorno (.env.local) para Vercel
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Ingresa tus parámetros de MongoDB Atlas para generar tu URI de conexión serverless segura
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Clúster Atlas</label>
            <input
              type="text"
              value={atlasCluster}
              onChange={(e) => setAtlasCluster(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Usuario de BD</label>
            <input
              type="text"
              value={atlasUser}
              onChange={(e) => setAtlasUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Contraseña</label>
            <input
              type="text"
              value={atlasPass}
              onChange={(e) => setAtlasPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nombre de la BD</label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
            />
          </div>
        </div>

        <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 break-all pr-24">
          {generatedUri}
          <button
            onClick={() => copyToClipboard(generatedUri, 'uri')}
            className="absolute right-2 top-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans flex items-center gap-1 transition-colors"
          >
            {copiedKey === 'uri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copiar URI</span>
          </button>
        </div>
      </div>

      {/* Visor de configuración y esquemas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Arquitectura de Backend y Esquemas MongoDB Atlas
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => setActiveCodeTab('env')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCodeTab === 'env'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Variables Vercel
            </button>
            <button
              onClick={() => setActiveCodeTab('mongoose')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCodeTab === 'mongoose'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mongoose Schemas
            </button>
            <button
              onClick={() => setActiveCodeTab('zod')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCodeTab === 'zod'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Zod Validation
            </button>
            <button
              onClick={() => setActiveCodeTab('vercel_api')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCodeTab === 'vercel_api'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Functions (Vercel)
            </button>
          </div>
        </div>

        <div className="relative bg-slate-950 p-4">
          <button
            onClick={() => {
              const code =
                activeCodeTab === 'env'
                  ? envFileContent
                  : activeCodeTab === 'mongoose'
                  ? MONGOOSE_SCHEMAS_CODE
                  : activeCodeTab === 'zod'
                  ? ZOD_SCHEMAS_CODE
                  : vercelFunctionsGuide;
              copyToClipboard(code, activeCodeTab);
            }}
            className="absolute right-4 top-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 transition-colors z-10"
          >
            {copiedKey === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copiar Código</span>
          </button>

          <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-2 max-h-96 leading-relaxed">
            {activeCodeTab === 'env' && envFileContent}
            {activeCodeTab === 'mongoose' && MONGOOSE_SCHEMAS_CODE}
            {activeCodeTab === 'zod' && ZOD_SCHEMAS_CODE}
            {activeCodeTab === 'vercel_api' && vercelFunctionsGuide}
          </pre>
        </div>
      </div>

      {/* Pasos para Despliegue en Vercel y MongoDB Atlas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-emerald-400" />
          Paso a Paso: Despliegue en Vercel con MongoDB Atlas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="font-bold text-emerald-400 mb-1">Paso 1: Configurar MongoDB Atlas</div>
            <p className="text-slate-400 leading-relaxed">
              1. Crea una cuenta gratuita en <span className="text-slate-200">mongodb.com/atlas</span>.<br />
              2. Crea un clúster <span className="text-slate-200">M0 Free Tier</span> en la región más cercana (ej. us-east).<br />
              3. En <span className="text-slate-200">Database Access</span>, crea un usuario con rol Read/Write.<br />
              4. En <span className="text-slate-200">Network Access</span>, añade la IP <code className="text-emerald-400">0.0.0.0/0</code> para permitir conexiones de funciones serverless de Vercel.<br />
              5. Copia la cadena <code className="text-slate-300">mongodb+srv://...</code> en la sección de arriba.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="font-bold text-sky-400 mb-1">Paso 2: Conectar Repositorio GitHub</div>
            <p className="text-slate-400 leading-relaxed">
              1. Sube tu proyecto a un repositorio de GitHub (público o privado).<br />
              2. Inicia sesión en <span className="text-slate-200">vercel.com</span> con tu cuenta de GitHub.<br />
              3. Haz clic en <span className="text-slate-200">"Add New Project"</span> y selecciona el repositorio de BetStats.<br />
              4. Vercel detectará Vite y las funciones de la carpeta <code className="text-slate-200">api/</code>.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
            <div className="font-bold text-purple-400 mb-1">Paso 3: Variables de Entorno en Vercel</div>
            <p className="text-slate-400 leading-relaxed">
              1. En el panel de Vercel del proyecto, ve a <span className="text-slate-200">Settings &gt; Environment Variables</span>.<br />
              2. Añade <code className="text-purple-300">MONGODB_URI</code> con tu cadena de conexión.<br />
              3. Añade <code className="text-purple-300">AUTH_SECRET</code> con una clave secreta segura.<br />
              4. Haz clic en <span className="text-emerald-400 font-semibold">"Deploy"</span>. Tu plataforma quedará en vivo con SSL y escalado automático.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
