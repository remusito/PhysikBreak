# PhysikBreak 🚀

¡Bienvenido a PhysikBreak! Un moderno remake del clásico juego Arkanoid, construido con tecnologías web de vanguardia y un toque de inteligencia artificial para una experiencia de juego dinámica e infinita.

![Captura de pantalla del juego PhysikBreak](https://placehold.co/600x400/194674/ffffff?text=PhysikBreak+Gameplay)

## 📜 Descripción

PhysikBreak es un juego de romper ladrillos donde controlas una pala para hacer rebotar una pelota y destruir todos los ladrillos en la pantalla. Lo que lo hace especial es su capacidad para generar niveles dinámicamente utilizando **Genkit de Google**, asegurando que cada partida ofrezca un nuevo desafío. El juego está diseñado para ser responsivo y jugable tanto en ordenadores de escritorio como en dispositivos móviles, e incluso se puede "instalar" en tu smartphone como una Aplicación Web Progresiva (PWA).

## ✨ Características

- **Jugabilidad Clásica, Físicas Modernas:** Disfruta de la jugabilidad adictiva de Arkanoid con una física de pelota suave y predecible.
- **Niveles Generados por IA:** Gracias a Genkit, los niveles se crean sobre la marcha, aumentando en dificultad y complejidad a medida que avanzas.
- **Power-ups y Power-downs:** Atrapa los objetos que caen para obtener ventajas... o desventajas.
  - ✅ **Pala Grande:** Expande tu pala temporalmente.
  - ✅ **Pala Pegajosa:** La pelota se adhiere a tu pala en el primer contacto.
  - ✅ **Bola Rápida:** Aumenta la velocidad de la pelota para un desafío mayor.
  - ❌ **Pala Pequeña:** Encoge tu pala, ¡cuidado!
  - ❌ **Pala Congelada:** Te inmoviliza la pala por unos segundos.
- **Ladrillos de Múltiples Golpes:** Algunos ladrillos requieren más de un impacto para ser destruidos, añadiendo una capa estratégica.
- **Efectos Visuales y Sonoros:** Partículas, animaciones y efectos de sonido que enriquecen la experiencia de juego.
- **Botón de Silencio:** Juega en silencio cuando lo necesites.
- **Diseño Responsivo:** Juega cómodamente en cualquier dispositivo.
- **Instalable (PWA):** Añade el juego a la pantalla de inicio de tu smartphone para un acceso rápido y una experiencia a pantalla completa.

## 🛠️ Tecnologías Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (con App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/)
- **Inteligencia Artificial:** [Genkit (Google)](https://firebase.google.com/docs/genkit)
- **Iconos:** [Lucide React](https://lucide.dev/)

## 🚀 Cómo Empezar

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (versión 18 o superior)
- `npm` o un gestor de paquetes compatible.

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/physikbreak.git
    cd physikbreak
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Para que la generación de niveles por IA funcione, necesitas una clave de API de Google AI.
    - Crea un archivo `.env` en la raíz del proyecto.
    - Añade tu clave de API de la siguiente manera:
      ```
      GEMINI_API_KEY=TU_API_KEY_AQUI
      ```

### Ejecución

1.  **Inicia el servidor de desarrollo de Next.js:**
    ```bash
    npm run dev
    ```
    El juego estará disponible en `http://localhost:9002`.

2.  **Inicia el servidor de Genkit (opcional, para depuración):**
    Para ver los flujos de Genkit y depurarlos, puedes ejecutar el UI de desarrollo de Genkit en un terminal separado:
    ```bash
    npm run genkit:dev
    ```
    Esto iniciará el inspector de Genkit en `http://localhost:4000`.

## 🎮 Cómo Jugar

- **Mover la pala:** Desliza el ratón sobre la pantalla o tu dedo si estás en un dispositivo móvil.
- **Lanzar la pelota:** Haz clic o toca la pantalla para lanzar la pelota desde la pala.
- **Objetivo:** ¡Rompe todos los ladrillos para pasar al siguiente nivel!
- **Power-ups:** Atrapa los iconos que caen para activar sus efectos. Los iconos azules son beneficiosos y los rojos son perjudiciales.

## 📁 Estructura del Proyecto

```
/
├── public/                # Recursos estáticos (imágenes, sonidos, iconos PWA)
├── src/
│   ├── ai/                # Lógica de Genkit para la IA
│   │   ├── flows/         # Flujos de IA para generar niveles
│   │   └── genkit.ts      # Configuración de Genkit
│   ├── app/               # Rutas y páginas de Next.js
│   │   ├── actions.ts     # Server Actions para llamar a los flujos de IA
│   │   ├── globals.css    # Estilos globales y tema de ShadCN
│   │   └── page.tsx       # Página principal del juego
│   ├── components/        # Componentes de React
│   │   ├── game/          # Componentes específicos del juego (lienzo, UI)
│   │   └── ui/            # Componentes reutilizables de ShadCN UI
│   ├── hooks/             # Hooks personalizados (useSound, use-toast)
│   └── lib/               # Utilidades, tipos y datos
└── package.json           # Dependencias y scripts del proyecto
```

¡Disfruta del juego!
