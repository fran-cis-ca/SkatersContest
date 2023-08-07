
//Inputs de editar datos del perfil
let url = "http://localhost:3000/";
let nombre = document.getElementById("InputNombreDatosPerfil");
let nuevaContrasena = document.getElementById("nuevaContrasena");
let anios_exp = document.getElementById("anios_exp");
let especialidad = document.getElementById("especialidad");


function eliminaPerfil(id) {
    axios.delete(url + "datosPerfil?id=" + id).then(() => {
        alert("Perfil eliminado con exito");
        window.location.replace("/logout");
    });
}

function editaPerfil(id) {
    let data = {
        nombre: nombre.value,
        nuevaContrasena: nuevaContrasena.value,
        anios_exp: anios_exp.value,
        especialidad: especialidad.value,
        
    };
    console.log("Funcion para editaPerfil",data)
    axios.put(url + "datosPerfil", data).then(() => {
        //document.getElementById("agregarTema").style.display = "block";
        document.getElementById("actualizarDatos").style.display = "none";
        location.reload();
    });
    
}  