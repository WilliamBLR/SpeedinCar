# SpeedinCar
Pagina Web para el emprendimiento de venta de autos, SpeedinCar

## Panel privado con Firebase

El sitio ya esta conectado al proyecto Firebase `speedincar`.

- Hosting: https://speedincar.web.app
- Console: https://console.firebase.google.com/project/speedincar/overview
- Firestore: base `(default)` creada en `southamerica-west1` y coleccion `vehicles` cargada con el inventario inicial.
- Admin permitido: `williamlagos2019@gmail.com`

Pendientes que Firebase exige completar desde consola:

1. En Authentication > Sign-in method, habilita Email/Password.
2. En Authentication > Users, crea el usuario admin `williamlagos2019@gmail.com`.
3. En Storage, pulsa Get Started para crear el bucket. Los proyectos nuevos pueden requerir plan Blaze para el bucket default.

Despues de crear el bucket, ejecuta:

```bash
firebase deploy --only storage --project speedincar
```

El panel vive en `/admin` y no esta enlazado desde la navegacion publica. Mientras Firebase no este disponible, `inventory.js` queda como respaldo local para el sitio publico.
