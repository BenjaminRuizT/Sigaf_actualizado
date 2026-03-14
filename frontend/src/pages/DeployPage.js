import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Server, Code, Terminal, Globe, Database, Shield, Smartphone, Wifi, WifiOff } from "lucide-react";

export default function DeployPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Server,
      title: "0. URLs de la aplicación en producción (Railway) — fix43",
      content: [
        { type: "text", value: "La aplicación está desplegada en Railway.app con los siguientes servicios activos:" },
        { type: "subtitle", value: "Servicios activos" },
        { type: "code", value: `Frontend (React PWA):
  https://insightful-caring-production-2702.up.railway.app

Backend (FastAPI):
  https://sigafactualizado-production.up.railway.app/api

Base de datos (MongoDB Atlas):
  Cluster: cluster0.sn33tur.mongodb.net
  Base de datos: sigaf
  Usuario: sigaf_user` },
        { type: "subtitle", value: "Variables de entorno requeridas (Railway)" },
        { type: "code", value: `# Backend (sigafactualizado)
MONGO_URL=mongodb+srv://sigaf_user:Diciembre*2025@cluster0.sn33tur.mongodb.net/sigaf
DB_NAME=sigaf
JWT_SECRET=<clave-secreta-32-chars>
CORS_ORIGINS=https://insightful-caring-production-2702.up.railway.app

# Frontend (insightful-caring-production-2702)
REACT_APP_BACKEND_URL=https://sigafactualizado-production.up.railway.app` },
        { type: "subtitle", value: "Despliegue de nuevos archivos en Railway" },
        { type: "list", items: [
          "1. En Railway, ir al servicio backend → pestaña Deploy → Source → conectado a GitHub o subir archivos",
          "2. Para actualizar server.py: subir el archivo al repositorio o usar Railway CLI: railway up",
          "3. Para el frontend: reconstruir con yarn build (el prebuild estampa automáticamente sw.js con timestamp único)",
          "4. Railway redespliega automáticamente al detectar cambios en el repositorio conectado",
          "5. Ver logs en tiempo real: Railway dashboard → servicio → Logs",
          "6. El banner de actualización aparece automáticamente en todos los navegadores activos en la siguiente carga"
        ]},
      ]
    },
    {
      icon: Code,
      title: "1. Requisitos del entorno de desarrollo",
      content: [
        { type: "text", value: "Para trabajar con el código fuente del proyecto en un IDE, necesita:" },
        { type: "list", items: [
          "Node.js v18+ y Yarn (gestor de paquetes frontend)",
          "Python 3.11+ con pip",
          "MongoDB 7.0+ (Atlas recomendado, o local)",
          "IDE recomendado: VS Code con extensiones de Python y React"
        ]},
      ]
    },
    {
      icon: Terminal,
      title: "2. Configuración del proyecto en IDE local",
      content: [
        { type: "text", value: "Clone o descargue el proyecto y configure las variables de entorno:" },
        { type: "code", value: `# Estructura del proyecto
/app/
├── backend/           # FastAPI (Python)
│   ├── server.py      # Archivo principal del servidor
│   ├── pdf_generator.py  # Generador de PDFs
│   ├── .env           # Variables de entorno del backend
│   └── requirements.txt  # Dependencias Python
├── frontend/          # React (PWA)
│   ├── scripts/       # stamp-sw.js (inyecta timestamp en SW)
│   ├── src/           # Código fuente React
│   │   ├── App.js     # Componente principal
│   │   ├── pages/     # Páginas de la aplicación
│   │   ├── components/ # Componentes reutilizables
│   │   ├── contexts/  # Contextos (Auth, Theme, Language)
│   │   ├── hooks/     # Hooks personalizados (offline sync)
│   │   └── lib/       # Utilidades (traducciones)
│   ├── public/
│   │   ├── manifest.json  # Manifiesto PWA
│   │   └── sw.js          # Service Worker
│   ├── .env           # Variables de entorno del frontend
│   └── package.json   # Dependencias Node.js
├── MAF.xlsx           # Datos de equipos
└── USUARIOS.xlsx      # Datos de usuarios` },
      ]
    },
    {
      icon: Database,
      title: "3. Configuración del Backend",
      content: [
        { type: "text", value: "Configure las variables de entorno del backend editando el archivo /app/backend/.env:" },
        { type: "code", value: `# /app/backend/.env
MONGO_URL="mongodb://localhost:27017"  # URL de MongoDB
DB_NAME="sigaf"               # Nombre de la base de datos
CORS_ORIGINS="*"                       # Orígenes permitidos (en producción usar URL del frontend)
JWT_SECRET="su-clave-secreta-jwt"      # Clave secreta para tokens JWT` },
        { type: "text", value: "Instale las dependencias e inicie el servidor:" },
        { type: "code", value: `# Navegar al directorio backend
cd /app/backend

# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\\Scripts\\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor de desarrollo
uvicorn server:app --host 0.0.0.0 --port 8001 --reload` },
        { type: "text", value: "El backend estará disponible en http://localhost:8001. Los datos de MAF.xlsx y USUARIOS.xlsx se importan automáticamente al iniciar si la base de datos está vacía." },
      ]
    },
    {
      icon: Globe,
      title: "4. Configuración del Frontend",
      content: [
        { type: "text", value: "Configure la URL del backend en el archivo .env del frontend:" },
        { type: "code", value: `# /app/frontend/.env
REACT_APP_BACKEND_URL="http://localhost:8001"  # URL del backend
# En producción, use la URL pública del backend:
# REACT_APP_BACKEND_URL="https://api.su-dominio.com"` },
        { type: "text", value: "Instale las dependencias e inicie el servidor:" },
        { type: "code", value: `# Navegar al directorio frontend
cd /app/frontend

# Instalar dependencias (IMPORTANTE: usar yarn, NO npm)
yarn install

# Iniciar servidor de desarrollo
yarn start` },
        { type: "text", value: "El frontend estará disponible en http://localhost:3000" },
      ]
    },
    {
      icon: Smartphone,
      title: "5. Instalación como PWA (Progressive Web App)",
      content: [
        { type: "text", value: "SIGAF está diseñado como una Progressive Web App (PWA), lo que permite instalarlo en dispositivos móviles y de escritorio como si fuera una aplicación nativa. Esto es especialmente útil para equipos de auditoría con hand helds o tabletas." },
        { type: "subtitle", value: "Requisitos previos" },
        { type: "list", items: [
          "La aplicación debe estar desplegada con HTTPS (obligatorio para PWA)",
          "El servidor debe servir los archivos manifest.json y sw.js desde la raíz",
          "Funciona en Chrome, Edge, Safari (iOS) y Firefox"
        ]},
        { type: "subtitle", value: "Instalación en Android (Chrome)" },
        { type: "list", items: [
          "1. Abrir Chrome y navegar a la URL de la aplicación (ej: https://sigaf.su-dominio.com)",
          "2. Iniciar sesión con sus credenciales",
          "3. Chrome mostrará un banner \"Agregar a pantalla de inicio\" o puede acceder desde el menú (⋮) > \"Instalar aplicación\"",
          "4. Confirmar la instalación. Se creará un ícono en la pantalla de inicio",
          "5. Abrir la aplicación desde el ícono — se ejecutará en modo standalone (sin barra de navegación del navegador)"
        ]},
        { type: "subtitle", value: "Instalación en iOS (Safari)" },
        { type: "list", items: [
          "1. Abrir Safari y navegar a la URL de la aplicación",
          "2. Tocar el botón de Compartir (cuadrado con flecha hacia arriba)",
          "3. Desplazarse hacia abajo y seleccionar \"Agregar a pantalla de inicio\"",
          "4. Confirmar el nombre y tocar \"Agregar\"",
          "5. La aplicación aparecerá como ícono en la pantalla de inicio"
        ]},
        { type: "subtitle", value: "Instalación en PC (Chrome/Edge)" },
        { type: "list", items: [
          "1. Navegar a la URL de la aplicación en Chrome o Edge",
          "2. En la barra de direcciones aparecerá un ícono de instalación (computadora con flecha)",
          "3. Hacer clic en \"Instalar\" o ir a menú (⋮) > \"Instalar SIGAF\"",
          "4. La aplicación se abrirá en su propia ventana como una aplicación de escritorio"
        ]},
        { type: "subtitle", value: "Build de producción para PWA" },
        { type: "code", value: `# Generar build optimizado para producción
cd /app/frontend
yarn build

# La carpeta build/ contiene:
# - index.html (app shell)
# - manifest.json (metadatos PWA)
# - sw.js (service worker para caché y offline)
# - static/ (JS, CSS optimizados)

# Servir con Nginx o cualquier servidor estático
# Asegurar que el servidor tenga HTTPS habilitado` },
      ]
    },
    {
      icon: WifiOff,
      title: "6. Funcionamiento Offline (Sin Conexión)",
      content: [
        { type: "text", value: "SIGAF incluye soporte completo para trabajo sin conexión durante las auditorías de inventario. Esto es esencial para tiendas con conectividad limitada o inestable." },
        { type: "subtitle", value: "¿Cómo funciona?" },
        { type: "list", items: [
          "Al navegar por la aplicación, los recursos estáticos (HTML, CSS, JS) se almacenan en caché automáticamente por el Service Worker",
          "Los datos de auditoría y equipos de tienda se almacenan en caché para acceso offline",
          "Cuando se pierde la conexión, la aplicación muestra un indicador visual de 'Modo sin conexión'",
          "Los escaneos realizados sin conexión se guardan en una cola local (localStorage) del dispositivo",
          "Al recuperar la conexión, los escaneos pendientes se sincronizan automáticamente con el servidor",
          "Se pueden eliminar escaneos offline de la cola antes de sincronizar si fueron erróneos"
        ]},
        { type: "subtitle", value: "Flujo de trabajo offline recomendado" },
        { type: "list", items: [
          "1. Antes de ir a la tienda: Abrir la aplicación con conexión para cargar los datos de la tienda y crear/abrir la auditoría",
          "2. En la tienda (sin conexión): Escanear todos los equipos — los escaneos se guardan localmente",
          "3. Al terminar: Conectarse a WiFi o datos móviles — los escaneos se sincronizarán automáticamente",
          "4. Verificar: La aplicación mostrará un mensaje de confirmación por cada escaneo sincronizado",
          "5. Finalizar: Una vez sincronizados todos los escaneos, finalizar la auditoría normalmente"
        ]},
        { type: "subtitle", value: "Indicadores visuales" },
        { type: "list", items: [
          "Banner naranja: 'Modo sin conexión' — indica que está trabajando offline",
          "Badge 'Offline': Cada escaneo guardado localmente muestra este indicador en el historial",
          "Banner azul con sincronización: Aparece cuando los escaneos se están enviando al servidor",
          "Botón 'Sincronizar': Permite iniciar la sincronización manualmente si la automática no se activa"
        ]},
        { type: "subtitle", value: "Limitaciones del modo offline" },
        { type: "list", items: [
          "No se puede iniciar una auditoría nueva sin conexión (requiere crear el registro en el servidor)",
          "No se puede finalizar una auditoría sin conexión (requiere clasificar equipos no escaneados)",
          "Las transferencias y solicitudes de baja requieren conexión",
          "Los escaneos offline no muestran clasificación hasta ser sincronizados",
          "Se recomienda sincronizar antes de finalizar para tener conteos precisos"
        ]},
        { type: "subtitle", value: "Solución de problemas" },
        { type: "code", value: `# Si el Service Worker no se registra correctamente:
# 1. Abrir DevTools (F12) > Application > Service Workers
# 2. Verificar que sw.js esté registrado y activo
# 3. Si hay problemas, hacer clic en "Unregister" y recargar la página

# Para forzar actualización del caché:
# 1. Abrir DevTools > Application > Cache Storage
# 2. Eliminar "sigaf-cache-v3"
# 3. Recargar la página

# Para verificar escaneos pendientes:
# 1. Abrir DevTools > Application > Local Storage
# 2. Buscar la clave "sigaf_offline_scan_queue"
# 3. Los escaneos pendientes se muestran en formato JSON` },
      ]
    },
    {
      icon: Server,
      title: "7. Despliegue en producción",
      content: [
        { type: "text", value: "Para poner la aplicación en línea, tiene varias opciones:" },
        { type: "subtitle", value: "Opción A: VPS (DigitalOcean, AWS EC2, Azure VM)" },
        { type: "code", value: `# 1. Preparar el servidor
sudo apt update && sudo apt install -y python3 python3-pip nodejs npm mongodb-org nginx

# 2. Instalar yarn globalmente
npm install -g yarn

# 3. Configurar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clonar/copiar el proyecto al servidor
# 5. Configurar variables de entorno (.env) con URLs de producción

# 6. Backend - Instalar y ejecutar con Gunicorn
cd /app/backend
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001 --daemon

# 7. Frontend - Build de producción
cd /app/frontend
yarn install
yarn build  # Genera carpeta build/

# 8. Configurar Nginx como reverse proxy (ver abajo)` },
        { type: "code", value: `# /etc/nginx/sites-available/sigaf
server {
    listen 80;
    server_name su-dominio.com;

    # Redirección a HTTPS (requerido para PWA)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name su-dominio.com;

    # Certificado SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/su-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/su-dominio.com/privkey.pem;

    # Frontend (archivos estáticos + PWA)
    location / {
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;

        # Caché para assets estáticos
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Sin caché para service worker y manifest
        location = /sw.js {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        location = /manifest.json {
            expires -1;
            add_header Cache-Control "no-cache";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}` },
        { type: "subtitle", value: "Configurar HTTPS con Let's Encrypt (requerido para PWA)" },
        { type: "code", value: `# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d su-dominio.com

# El certificado se renueva automáticamente
# Para renovar manualmente:
sudo certbot renew` },
        { type: "subtitle", value: "Opción B: Docker (recomendado)" },
        { type: "code", value: `# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: always

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=sigaf
      - JWT_SECRET=su-clave-secreta-segura-32-chars
      - CORS_ORIGINS=https://su-dominio.com
    depends_on:
      - mongodb
    restart: always

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  mongo_data:` },
        { type: "subtitle", value: "Características de seguridad implementadas" },
        { type: "list", items: [
          "Sesión única por usuario (configurable a multisesión desde AdminPage)",
          "Cierre automático por inactividad: configurable 5-480 minutos",
          "Banner de aviso 5 minutos antes del cierre con cuenta regresiva",
          "Firmas digitales HMAC-SHA256 por auditoría para verificar integridad",
          "Cifrado de campos sensibles (serie, factura) con Fernet",
          "Logs de seguridad con niveles INFO/WARNING/CRITICAL",
          "Control de sesiones activas con cierre forzoso desde AdminPage",
          "Restricción: solo el auditor dueño puede entrar a su auditoría en progreso",
          "JWT con session_id validado en cada request autenticado"
        ]},
        { type: "subtitle", value: "Opción C: Servicios Cloud (Railway, Render, Fly.io)" },
        { type: "list", items: [
          "Railway.app: Conecte su repositorio Git, configure variables de entorno y despliegue automáticamente (soporte HTTPS incluido)",
          "Render.com: Cree un Web Service para el backend y un Static Site para el frontend (HTTPS incluido)",
          "MongoDB Atlas: Use como base de datos cloud (cambie MONGO_URL en .env)",
          "Nota: Todos estos servicios proporcionan HTTPS, requisito para PWA"
        ]},
      ]
    },
    {
      icon: Shield,
      title: "8. Recomendaciones de seguridad para producción",
      content: [
        { type: "list", items: [
          "HTTPS obligatorio: Requerido para que el Service Worker y la PWA funcionen correctamente",
          "Cambiar JWT_SECRET por una clave segura y única (32+ caracteres aleatorios)",
          "Configurar CORS_ORIGINS con la URL exacta del frontend (no usar '*')",
          "Configurar respaldos automáticos de MongoDB (mongodump con cron job)",
          "Cambiar las contraseñas predeterminadas de todos los usuarios",
          "Configurar un firewall para limitar acceso a puertos (solo 80/443 público)",
          "Monitorear logs del servidor con herramientas como PM2, Supervisor o systemd",
          "Mantener actualizadas las dependencias del proyecto (pip audit, yarn audit)"
        ]},
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl" data-testid="deploy-page">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight">Guía de Despliegue</h1>
        <p className="text-muted-foreground text-sm mt-1">Instrucciones para administrar el proyecto, configurar la PWA y ponerlo en línea</p>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-4 pr-4">
          {sections.map((section, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg uppercase tracking-tight flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.content.map((block, j) => {
                  if (block.type === "text") return <p key={j} className="text-sm text-foreground leading-relaxed">{block.value}</p>;
                  if (block.type === "subtitle") return <h3 key={j} className="font-semibold text-sm mt-3">{block.value}</h3>;
                  if (block.type === "list") return (
                    <ul key={j} className="space-y-1.5">{block.items.map((item, k) => (
                      <li key={k} className="text-sm text-foreground flex gap-2"><span className="text-primary mt-0.5 shrink-0">•</span><span>{item}</span></li>
                    ))}</ul>
                  );
                  if (block.type === "code") return (
                    <pre key={j} className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground">
                      {block.value}
                    </pre>
                  );
                  return null;
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
