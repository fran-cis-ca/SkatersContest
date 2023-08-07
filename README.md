**Instrucciones**

Proyecto creado con handlebars, css, boostrap, javascript.

Creacion de un proyecto web acerca de un concurso de skaters, registro en una base de datos, login y muestra de los usuarios en la base de datos. 

Los datos para la conexion a la base de datos vienen de el
archivo .env, ademas tambien de ese archivo se saca la clave secreta, el tiempo de expiracion del jwt y el tiempo de expiracion de la cookie. En este caso se subio el archivo .env ya que solo tiene datos de ejemplo.

Crear la base de datos:

```SQL
CREATE DATABASE skatepark;
```

```SQL
CREATE TABLE skaters (
    id INT PRIMARY KEY,
    nombre VARCHAR(50),
    email VARCHAR(50),
    password VARCHAR(100),
    anos_experiencia INT,
    especialidad VARCHAR(50),
    foto VARCHAR(255),
    estado BOOLEAN,
    admin BOOLEAN
    
);
```
Para iniciar la aplicacion:

```cmd
npm run dev 
```
