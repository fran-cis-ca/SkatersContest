"use strict";
let url = "http://localhost:3000/";
let tbody = document.getElementById("cuerpo");

let Contraseña = document.getElementById("password");
let ContraseñaRepetida = document.getElementById("confirmarPassword");

let fotoPerfil = document.getElementById('fileInput').name;

let InputNombreDatosPerfil = document.getElementById('InputNombreDatosPerfil');



function nuevoSkater2() {
    if (!fotoPerfil) {
      alert("Seleccione una imagen antes de subirla.");
      return;
    }
    const formulario = document.getElementById("miFormulario");
    const formData = new FormData(formulario); 

    fetch("/registro", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
 
      console.log(data);
      alert("Registro exitoso.");
    })
    .catch(error => {
      console.error("Error al enviar el formulario:", error);
    });


  }




  