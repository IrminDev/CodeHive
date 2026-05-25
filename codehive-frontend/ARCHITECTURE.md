# Arquitectura Frontend - CodeHive

Este documento define los estándares de organización y desarrollo del frontend, basados en una Arquitectura por Características (Feature-Based Architecture).

## 1. Estructura del Proyecto

### app/core/

Infraestructura global requerida para el funcionamiento base de la aplicación.

* **Router:** Configuración y agregación de rutas globales.
* **Providers:** Contextos globales (Autenticación, Tematización).
* **Config:** Variables de entorno y constantes técnicas.

### app/shared/

Componentes y utilidades agnósticas al dominio del negocio.

* **Components:** UI atómica (ej. `Button`, `Input`) y componentes de Layout.
* **Types:** Interfaces compartidas entre múltiples dominios (ej. `User`, `ApiResponse`).
* **Hooks/Utils:** Lógica y funciones de utilidad reutilizables.
* **Constants:** Configuraciones reutilizables compartidas globalmente.
* **Layouts:** Layouts reutilizables utilizados por múltiples módulos o tipos de usuario.

### app/features/

Módulos funcionales que encapsulan una unidad de negocio completa.

---

## 2. Convenciones de Nomenclatura

Se debe seguir estrictamente el uso de kebab-case para archivos de lógica y PascalCase para componentes React.

* **Componentes:** `NombreComponente.tsx` (PascalCase).
* **Páginas:** `NombrePage.tsx` (PascalCase + sufijo Page).
* **Hooks:** `useNombreHook.ts`.
* **Servicios:** `nombre.service.ts` (kebab-case).
* **API:** `nombre.api.ts` (kebab-case).
* **Tipos:** `nombre.types.ts` (kebab-case).
* **Constantes:** `nombre.constants.ts`.
* **Configuraciones:** `nombre.config.ts`.
* **Mocks/Data temporales:** `nombre.data.ts`.
* **Rutas:** `routes.ts`.

---

## 3. Organización de una Feature

Cada directorio dentro de `features/` debe contener exclusivamente los elementos necesarios para su funcionamiento:

1. **api/**: Funciones de comunicación con el servidor.
2. **services/**: Orquestación de datos y lógica de negocio.
3. **types/**: Definiciones de interfaces exclusivas del módulo.
4. **pages/**: Componentes de ruta que gestionan estado y composición.
5. **components/**: Sub-componentes exclusivos del dominio.
6. **hooks/**: Hooks específicos de la característica.
7. **utils/**: Funciones auxiliares exclusivas del módulo.
8. **config/**: Configuraciones, navegación, labels y constantes del módulo.
9. **data/**: Datos mock, temporales o estructuras estáticas desacopladas de la vista.
10. **routes.ts**: Definición de rutas del módulo para su exportación al Core.

---

## 4. Guía para Nuevos Módulos

Para implementar una nueva característica (ej. `assignments`):

1. Crear directorio en `app/features/assignments/`.
2. Definir interfaces en `types/assignments.types.ts`.
3. Implementar llamadas en `api/assignments.api.ts` y lógica en `services/assignments.service.ts`.
4. Crear componentes reutilizables dentro de `components/`.
5. Crear vistas en `pages/` (ej. `AssignmentsListPage.tsx`).
6. Separar configuraciones, navegación y constantes en `config/`.
7. Mantener mocks o datos temporales dentro de `data/`.
8. Definir rutas en `routes.ts` y registrarlas en `app/core/router/routes.ts`.

---

## 5. Estándares de Implementación

* **Proximidad**: Todo recurso utilizado exclusivamente por una característica debe residir dentro de su directorio.

* **Acoplamiento**: Una característica no debe importar componentes o lógica interna de otra característica. La comunicación debe realizarse a través de servicios compartidos o el estado global.

* **Responsabilidad Única**: Las páginas (`pages/`) deben enfocarse principalmente en composición de componentes, manejo de estado y coordinación de la vista. La lógica reutilizable, configuraciones y componentes complejos deben extraerse a archivos independientes.

* **Separación de Componentes**: Componentes visuales reutilizables o de gran tamaño no deben declararse directamente dentro de páginas cuando puedan reutilizarse o mantenerse de forma independiente.

* **Configuración Desacoplada**: Navegación, labels, iconos, configuraciones visuales y estructuras estáticas deben separarse en archivos de configuración o constantes, evitando saturar las páginas principales.

* **Datos Temporales**: Todo mock, dato temporal o estructura estática utilizada durante desarrollo debe mantenerse fuera de las páginas en directorios `data/` o `mocks/`.

* **Reutilización**: Si múltiples módulos comparten la misma estructura visual o lógica de layout, debe priorizarse la reutilización mediante componentes parametrizables antes que la duplicación.

* **Layouts Compartidos**: Layouts generales como dashboards deben diseñarse como componentes reutilizables configurables mediante props, evitando implementaciones duplicadas para cada tipo de usuario.

* **Consistencia de Rutas**: Las rutas deben seguir una convención uniforme y predecible. Evitar estructuras inconsistentes entre módulos equivalentes.

* **Simplicidad**: Se prohíbe la creación de capas de abstracción (como archivos `index.ts` de re-exportación) que no aporten funcionalidad técnica o claridad estructural.

* **Promoción a Shared**: Un elemento solo se moverá a `app/shared/` cuando sea requerido por dos o más características independientes.

* **Mantenibilidad**: Se prioriza la legibilidad del código sobre la brevedad. Evitar patrones de sobreingeniería que dificulten la trazabilidad de la lógica.

* **Evitar Componentes Monolíticos**: Ningún archivo de página debe concentrar múltiples responsabilidades visuales, estados complejos, configuraciones extensas y lógica de negocio simultáneamente.

* **Escalabilidad**: Toda nueva implementación debe considerar la posibilidad de crecimiento futuro del módulo, priorizando modularidad y extensibilidad desde etapas tempranas.

* **Consistencia Visual**: Se deben reutilizar componentes visuales e iconografía existentes antes de crear implementaciones personalizadas inline.

* **Utilidades Compartidas**: Funciones reutilizadas por múltiples módulos o componentes deben trasladarse a `shared/utils` o a utilidades específicas de la feature correspondiente.
