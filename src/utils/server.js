import express, { urlencoded } from "express";
import exphbs from "express-handlebars";
import __dirname from "../utils.js";
import * as path from "path";
//Importamos todas las funciones de db.js
import {
  insertarSkater,
  getConnection,
  entrarLogin,
  autenticarCookie,
  autenticarNombre,
  cerrarSesion,
  mostrarDatosPerfil,
  obtenerId,
  editarPerfil,
  eliminarPerfil,
  consultaTodo
} from "./db.js";
import fileUpload from "express-fileupload";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

const app = express();

app.engine("hbs", exphbs.engine({ extname: "hbs" }));
app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname + "/views"));
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("src"));
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 20 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: "El archivo es demasiado grande",
  })
);

app.use(cookieParser());

const PORT = 3000;

app.get("/logout", cerrarSesion);

//Pagina de inicio de la aplicacion
app.get("/", (req, res) => {
  res.render("inicio", {
    title: "Skaters",
    tituloHeader: "Concurso de skate",
    linkHeader: "/",
  });
});


//Pagina con los datos del usuario
app.get("/datosPerfil", autenticarCookie, async (req, res) => {
  try {
    //Obtenemos el nombre y la contraseña con la funcion
    //autenticarNombre enviandole el token como parametro
    let datosjwtCookie = autenticarNombre(req.cookies.jwt);
    //Sacamos el nombre y la contraseña del arreglo llamado datosjwtCookie
    let nombre = datosjwtCookie[0];
    let contrasena = datosjwtCookie[1];

    //Llamamos a la funcion mostrarDatosPerfil y le enviamos el token para 
    //decodificar y hacer una consulta para obtener todos los datos del 
    //usuario logueado
    let datosPerfil = await mostrarDatosPerfil(req.cookies.jwt);
    console.log("Funcion para mostrar los datos del perfil",datosPerfil);
    //De el arreglo datosPerfil tomamos los datos que necesitamos 
    //Años de experiencia, especialidad, email y admin
    let anos_experiencia = datosPerfil[0].anos_experiencia;
    let especialidad = datosPerfil[0].especialidad;
    let email = datosPerfil[0].email;
    let administrador =  datosPerfil[0].admin;

    //Llamamos a la funcion para obtener la id 
    //mandandole el token para verificar 
    let ide = await obtenerId(req.cookies.jwt);
    let id = ide[0];

    //Creamos una variable booleana para revisar si es que es o no admin
    let esAdmin = false;  
    
  if (administrador === 1) {
    esAdmin = true;
  }
  console.log("DESDE EL SERVIDOR",administrador);
  res.render("datosPerfil", {
    title: "Skaters",
    tituloHeader: "Datos de tu perfil",
    linkHeader: "/datosPerfil",
    user: nombre,
    contrasena: contrasena,
    anios_experiencia: anos_experiencia,
    especialidad: especialidad,
    email: email,
    id: id,
    administrador: esAdmin
  });
} catch (error) {
    console.log(error);
    const alertScript =
    '<script>alert("No puede acceder sin autenticacion");</script>';
    
  const redirectScript =
    '<script>window.location.href = "/logout";</script>';
  res.send(alertScript + redirectScript);
}
});

//Ruta para actualizar los datos del perfil logueado
app.put("/datosPerfil", autenticarCookie, async (req, res) => {
  const datos = Object.values(req.body);
  let ide = await obtenerId(req.cookies.jwt);
  let id = ide[0].id;
  console.log(ide[0].id);
  const respuesta = await editarPerfil(datos, id);
  res.redirect("login");
});

//
app.delete("/datosPerfil", autenticarCookie, async (req, res) => {
  let ide = await obtenerId(req.cookies.jwt);
  let id = ide[0].id;
  
  await eliminarPerfil(id);
  
  res.send("Perfil eliminado con exito")
 
});


//
app.get("/listar", autenticarCookie, async (req, res) => {
  let registros = await consultaTodo();
  console.log("REGISTROS DE CONSULTAR TODO",registros);

  let datosjwtCookie = autenticarNombre(req.cookies.jwt);
  let nombre = datosjwtCookie[0];
  
  res.render("tabla", {
    title: "Skaters",
    tituloHeader: "Listado de skaters",
    linkHeader: "/datosPerfil",
    user: nombre,
    registros: registros
  });
});

//Pagina con el login de los usuarios
app.get("/login", (req, res) => {
  res.render("login", {
    alert: false,
    title: "Skaters",
    tituloHeader: "Concurso de skate",
    linkHeader: "/",
  });
});

//
app.post("/login", async (req, res) => {
  try {
    const user = req.body.nombre;
    const email = req.body.email;
    const pass = req.body.contrasena;

    //Verificamos si existen o no los datos en el formulario de login
    //Si no existen mandamos una alerta para que se recargue la
    //pagina de login advirtiendo al usuario que no se envio ningun dato
    if (!user || !pass || !email) {
      res.render("login", {
        //Aqui le mandamos el titulo, el mensaje de advertencia
        //entre otras cosas dinamicamente a la ruta especificada
        //en este caso al login
        title: "Skaters",
        tituloHeader: "Consurso de skate",
        linkHeader: "/",
        alert: true,
        alertTitle: "Advertencia",
        alertMessage: "Ingrese un usuario valido",
        alertIcon: "info",
        showConfirmButton: true,
        timer: false,
        ruta: "login",
      });
      //Si existen los datos entonces los mandamos con req.body
      //a la funcion entrarLogin para ver si es que existen en
      //la base de datos
    } else {
      //Si es que los datos existen entonces podemos obtener
      //el token de dicho usuario
      //en este caso el resultado obtenido de la funcion
      //entrarLogin es un array de 2 elementos
      //token = [token, validarDentro]
      //validarDentro es una variable booleana (true o false)
      //la cual si es true quiere decir que el usuario si entro
      //con los datos correctos
      console.log(req.body);
      const token = await entrarLogin(req.body);

      //validamos si es que validarDentro es false entonces
      //enviamos una alerta donde nos dice que alguno de
      //los datos ingresados son incorrectos
      if (token[1] === false) {
        console.log(token[0]);
        res.render("login", {
          title: "Skaters",
          tituloHeader: "Consurso de skate",
          linkHeader: "/",
          alert: true,
          alertTitle: "Error",
          alertMessage: "Uno o mas datos son incorrectos",
          alertIcon: "error",
          showConfirmButton: false,
          timer: 1000,
          ruta: "login",
        });
      } else {
        console.log("ENTRASTE A TU CUENTA");
        const cookiesOptions = {
          expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRA_JWT * 24 * 60 * 60 * 1000
          ),
          httpOnly: true,
        };

        res.cookie("jwt", token[0], cookiesOptions);

        res.render("login", {
          alert: true,
          alertTitle: "Conexion exitosa",
          alertMessage: "Datos de usuario correctos ",
          alertIcon: "success",
          showConfirmButton: true,
          timer: false,
          ruta: "datosPerfil",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

//Pagina de registro de la aplicacion
app.get("/registra", (req, res) => {
  res.render("home", {
    title: "Skaters",
    tituloHeader: "Skatepark",
    linkHeader: "/",
  });
});

//Ruta para registrar a la persona
app.post("/registro", async (req, res) => {
  try {
    //Guardar los datos en una variable para usarla
    const datos = Object.values(req.body);
    //Condicional para validar si es que existen los datos y ademas que exista el archivo
    //osea la imagen de la foto de perfil
    if (
      !datos ||
      datos.length === 0 ||
      !req.files ||
      Object.keys(req.files).length === 0
    ) {
      throw new Error("No se proporcionaron datos válidos.");
    } else {
      //Vemos si las contraseñas son iguales
      if (datos[2] === datos[3]) {
        //Pasos para guardar la foto
        //Guardamos la archivo en una variable
        let file = req.files.foto;
        //guardamos el nombre del archivo en una variable
        //para difernciar usamos la fecha mas el nombre original del archivo
        //si no encuentra el nombre se guarda archivo_no_disponible en la varible
        const nombreArchivo = req.files
          ? `${Date.now()}-${file.name}`
          : "archivo_no_disponible";
        //La direccion donde vamos a guardar la imagen
        //dirname llega hasta la carpeta src agregamos las carpetas donde
        //queremos guaradar /util/uploads y agregamos el nombre del archivo
        let path = `${__dirname}/uploads/${nombreArchivo}`;
        //Funcion para guardar el archivo en la carpeta
        file.mv(path, function (err) {
          if (err) return res.status(500).send(err);
        });

        //Creamos la contraseña encriptada
        let passHash = await bcrypt.hash(datos[2], 6);
        console.log("Antes",datos);
        //Desde la posicion 2 eliminamos 2 elementos del objeto datos
        //y agregamos la contraseña encriptada al objeto
        datos.splice(2, 2, passHash);
        //Agregamos el nombre del archivo subido
        datos.push(nombreArchivo);
        //Eliminamos la contraseña repetida
        console.log("despues",datos);

        //Llamamos a la funcion para insertar los datos en la base de datos
        await insertarSkater(datos);
        //Redirigimos nuevamente al inicio
        res.redirect(301, "/");
      } else {
        //Si es que no coinciden las contraseñas se muestra un alert para alertar al usuario y se redirige a
        //la misma pagina
        const alertScript =
          '<script>alert("Contraseñas distintas intenta nuevamente");</script>';
        const redirectScript =
          '<script>window.location.href = "/registra";</script>';
        res.send(alertScript + redirectScript);
      }
    }
  } catch (error) {
    // Si ocurre un error, enviar una respuesta de error al cliente
    console.error("Error durante el manejo del formulario:", error.message);
    res.status(500).send("Error interno del servidor");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

export { app };
