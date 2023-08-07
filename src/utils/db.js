import mysql from "mysql2/promise";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import { sign, verify } from "./jwt.js";


config();

//Hacemos la conexion a la base de datos 
const pool = mysql.createPool({
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 100000,
  queueLimit: 0,
});

//Verificar la conexion a la base de datos
var getConnection = function (callback) {
  pool.getConnection(function (err, connection) {
    callback(err, connection);
  });
};

const consultaTodo = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          id, 
          foto,
          nombre,
          anos_experiencia,
          especialidad,
          estado
        FROM 
          skaters
      `
    );
    return rows;
  } catch (error) {
    console.error(error);
    return error;
  }
};

//Consultar los datos del usuario logueado
const obtenerId = async (req) => {
  if (req) {
    try {
      const decodificada = verify(req);
      const email = decodificada.email;

      if (decodificada.exp < Date.now() / 1000) {
        return res.redirect("/login");
      }

      const [rows] = await pool.query(
        `SELECT id FROM skaters WHERE email = ?`,
        [email]
      );
      //console.log("HOLA DATOS desde BD.JS ",rows);

      return rows;
    } catch (error) {
      console.log("Autenticacion invalida", error);
      return "nada";
    }
  } else {
    console.log("error");
  }
};

const eliminarPerfil = async (id) => {
  try {
    const [result] = await pool.query("DELETE FROM skaters WHERE id = ?", id);
    return result.affectedRows;
  } catch (error) {
    console.error(error);
    return error;
  }
};

//Editar perfil del usuario logueado
const editarPerfil = async (datos, id) => {
  let passHash = await bcrypt.hash(datos[1], 6);
  datos[1] = passHash;
  datos.push(id);
  const consulta = `UPDATE skaters SET nombre = ?, password = ?, anos_experiencia = ?, especialidad = ?  WHERE id = ?`;
  try {
    const [result] = await pool.query(consulta, datos);
    return result;
  } catch (error) {
    console.error(error);
    return error;
  }
};

//Consultar los datos del usuario logueado
const mostrarDatosPerfil = async (req) => {
  if (req) {
    try {
      const decodificada = verify(req);
      const email = decodificada.email;

      if (decodificada.exp < Date.now() / 1000) {
        return res.redirect("/login");
      }

      const [rows] = await pool.query(`SELECT * FROM skaters WHERE email = ?`, [
        email,
      ]);
      console.log("HOLA DATOS desde BD.JS ",rows[0].admin);

      return rows;
    } catch (error) {
      console.log("Autenticacion invalida", error);
      return "nada";
    }
  } else {
    console.log("error");
  }
};

//Para recuperar el nombre y contraseña del token
const autenticarNombre = (req) => {
  if (req) {
    try {
      const decodificada = verify(req);
      const nombre = decodificada.user;
      const contrasena = decodificada.contrasena;

    
      if (decodificada.exp < Date.now() / 1000) {
        return res.redirect("/login");
      }

      return [nombre, contrasena];
    } catch (error) {
      console.log("Autenticacion invalida", error);
      return "nada";
    }
  } else {
    console.log("error");
  }
};

//Autenticar la cookie del navegador para que no pueda entrar a una ruta
//sin estar logueado
const autenticarCookie = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decodificada = verify(req.cookies.jwt);
      //console.log("que trae",decodificada);
      if (decodificada.exp < Date.now() / 1000) {
        return res.redirect("/login");
      }

      next();
    } catch (error) {
      console.log("Autenticacion invalida", error);
      return next();
    }
  } else {
    res.redirect("/login");
  }
};

const cerrarSesion = async (req, res) => {
  res.clearCookie("jwt");
  return res.redirect("/");
};

//Funcion para entrar al perfil del usuario
const entrarLogin = async (datos) => {
  //Tomamos los datos desde el fomulario de login 
  //y los guardamos en una variable datos 
  //Vienen de esta manera 
  //{ nombre: 'admin', email: 'admin@gmail.com', contrasena: 'admin' }
  const { nombre, email, contrasena } = datos;
  //Creamos la conexion
  const connection = await pool.getConnection();
  //Hacemos la consulta para obtener todos los datos desde la
  //base de datos filtrados por email
  const [rows] = await connection.execute(
    `SELECT * FROM skaters WHERE email = ?`,
    [email]
  );
  console.log("rows", rows);
  //Sacamos el objeto con los datos del usuario del arreglo [rows]
  //obtenido desde la consulta
  const usuario = rows[0];
  console.log("rows", usuario);
  //Creamos una variable booleana
  let validarDentro = false;
  //Condicional para revisar si es que existe el usuario y si es que la contraseña
  //proporcionada por el usuario en el fomulario de login es la misma que la contraseña/
  //encriptada que obtenemos desde la base de datos utilizando la funcion compare de 
  //la biblioteca bcrypt pra comparar las contraseñas ejemplo
  // bcrypt.compare("123", "$2b$06$len5jpM/sbqyBX16h7ch5OjGYnNf849EZGw.ZSGDGzMkJRmfuSo5y")
  if (usuario && (await bcrypt.compare(contrasena, usuario.password))) {
    //Guardamos los datos proporcionados por el usuario despues de hacer las validaciones
    //y los guardamos en una variable para usarlos para crear el token
    //en este caso en nombre, email y contraseña
    const data = { user: nombre, contrasena: contrasena, email: email };
    //Creamos una variable para guardar el token, llamando a la funcion sign desde jwt.js 
    //para crear el token le mandamos los datos "data", la clave secreta que viene desde 
    //el archivo .env para que este mas segura y el tiempo de expiracion que tambien viende 
    //desde .env
    const token = sign(data, process.env.SECRET_KEY, process.env.EXPIRA_EN);
    console.log("token", token, "para el usuario " + usuario.nombre);
    //Cambiamos la variable booleanda a true para poder enviarla junto con el token
    //para ser usados en el servidor 
    validarDentro = true;
    //Retornamos el token y la variable booleana
    return [token, validarDentro];
  } else {
    //Si es que hay algun error al validar los datos de usuario y las contraseñas 
    //la variable se queda en falso
    validarDentro = false;
    //retornamos un mensaje de error y la variable en falso
    return ["Error datos incorrectos", validarDentro];
  }
};

//Funcion para insertar un usuario a la base de datos
//por defecto el estado es true
//por defecto el admin es false
const insertarSkater = async (datos) => {
  const consulta = `INSERT INTO skaters (nombre, email, password, anos_experiencia, especialidad, foto, estado, admin) VALUES (?, ?, ?, ?, ?, ?, true, false)`;
  try {
    const [result] = await pool.query(consulta, datos);
    return result;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export {
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
};
