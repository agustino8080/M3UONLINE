# 📺 TV Stream Player

Un reproductor de streaming de TV moderno y elegante con soporte para listas M3U, diseño responsive y funcionalidad de proxy integrada.

## ✨ Características

- **🎨 Diseño Profesional**: Interfaz moderna estilo reproductor de TV con tema oscuro y gradientes vibrantes
- **🔒 Proxy Integrado**: Funcionalidad de proxy con toggle para evitar restricciones de CORS
  - Proxy configurado: `https://vercel-api-proxy-steel-chi.vercel.app/`
  - Activar/desactivar con un solo clic
  - Estado guardado en localStorage
  - Aplica automáticamente a listas M3U, streams y logos de canales
- **📂 Soporte M3U**: Carga y reproduce listas de reproducción M3U
- **🔍 Búsqueda Avanzada**: Filtra canales por nombre en tiempo real
- **📊 Contador de Canales**: Muestra el número total de canales cargados
- **🎮 Controles Completos**: Play, pausa, volumen, pantalla completa y más
- **📱 Responsive**: Funciona perfectamente en dispositivos móviles y desktop
- **💾 Persistencia**: Guarda tu última lista y configuración de proxy

## 🚀 Uso

1. Abre `index.html` en tu navegador
2. (Opcional) Activa el proxy haciendo clic en el ícono de escudo 🛡️
3. Pega la URL de tu lista M3U o sube un archivo `.m3u`
4. Haz clic en "Cargar Lista"
5. Selecciona un canal para comenzar a ver

## 🛠️ Estructura del Proyecto

```
├── index.html          # Estructura HTML principal
├── css/
│   └── styles.css      # Estilos y diseño profesional
├── js/
│   └── app.js          # Lógica de la aplicación y proxy
└── README.md           # Documentación
```

## 🔧 Funcionalidad del Proxy

El proxy se puede activar/desactivar mediante el botón con ícono de escudo en la interfaz:

- **🔴 Escudo Rojo**: Proxy desactivado
- **🟢 Escudo Verde**: Proxy activado

Cuando está activado, todas las solicitudes a listas M3U, streams de video y logos de canales pasan através del proxy para evitar problemas de CORS.

### Código del Proxy

```javascript
// Función para activar/desactivar proxy
function toggleProxy() {
    isProxyEnabled = !isProxyEnabled;
    // Actualiza ícono y estado
    // Guarda en localStorage
}

// Función para aplicar proxy a URLs
function applyProxy(url) {
    if (!isProxyEnabled || !url) return url;
    return `https://vercel-api-proxy-steel-chi.vercel.app/${url}`;
}
```

## 🎨 Diseño

El diseño incluye:
- Header profesional con logo de TV
- Fondo con gradientes radiales violeta/azul/cyan
- Tarjetas con bordes redondeados y sombras elegantes
- Botones con efectos hover y transiciones suaves
- Estados de carga animados
- Iconos intuitivos para cada acción

## 📋 Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet para cargar listas M3U remotas
- Soporte para reproducción de video HTML5

## 🔐 Privacidad

- El proxy se ejecuta del lado del cliente
- No se almacenan datos personales
- La configuración de proxy se guarda localmente en tu navegador

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de:
- Reportar bugs
- Sugerir nuevas características
- Enviar pull requests

## 📞 Soporte

Si tienes problemas o preguntas, abre un issue en el repositorio.

---

**Hecho con ❤️ para los amantes de la TV**

*Última actualización: Se añadió funcionalidad de proxy con toggle, diseño profesional de reproductor de TV, y documentación completa.*
