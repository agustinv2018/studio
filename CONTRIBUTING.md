# 🤝 Contributing Guide

¡Gracias por colaborar en este proyecto! Para mantener el flujo de trabajo organizado, seguimos una estrategia basada en ramas y buenas prácticas de Git y GitHub. A continuación se describen los pasos para contribuir correctamente.

---

## 🧩 Estructura de Ramas

| Rama         | Propósito                                 |
|--------------|--------------------------------------------|
| `main`       | Rama principal. Código estable y probado. |
| `backend/*`  | Features relacionadas con la lógica de Supabase, API, almacenamiento, etc. |
| `ui/*`       | Features de diseño, componentes, y experiencia visual del usuario. |

---

## 🛠️ Antes de empezar a trabajar

1. **Actualizar el código local:**

```bash
git checkout main
git pull origin main


Crear una nueva rama a partir de main:

# Para lógica de base de datos
git checkout -b backend/nombre-de-la-tarea

# Para diseño de interfaz
git checkout -b ui/nombre-de-la-tarea

    🔁 Siempre crear una nueva rama para cada feature. No trabajar directo en main.



Mientras trabajás

    Hacer commits claros y frecuentes:

git add .
git commit -m "feat: implementar tabla de usuarios con filtros"

    Guardar tu trabajo en el repositorio remoto:

git push origin nombre-de-tu-rama


Cuando terminás una tarea

    Ir a GitHub y crear un Pull Request (PR) hacia main.

    Agregar una breve descripción de los cambios.

    Si todo está bien, se aprueba y se hace merge a main.

    🧪 Revisar que todo funcione antes de hacer merge.

♻️ Si alguien ya hizo merge a main, antes de continuar:

    Cambiar a tu rama:

git checkout backend/mi-rama

    Traer cambios de main:

git pull origin main

    Resolver conflictos si los hay.

🧪 Entorno de desarrollo

Asegurate de tener un archivo .env.local con estas claves:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

Podés pedirle al propietario del proyecto o a un miembro del equipo estas claves si aún no las tenés.
🧼 Buenas prácticas

    Una rama = una tarea. No mezclar temas distintos.

    Nombres de rama claros: backend/update-logic, ui/add-dashboard-card, etc.

    Usar feat:, fix:, refactor:, etc. al comenzar un commit.

👥 Roles del equipo (ejemplo)
Miembro	Área principal
Tú	Backend, Supabase, lógica de negocio
Compañero	Frontend, diseño UI, experiencia UX