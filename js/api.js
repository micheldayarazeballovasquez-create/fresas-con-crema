const BASE_URL = "https://6af34996d2377d6c3704d3b0.mockapi.io/v1";
const URL_PRODUCTOS = `${BASE_URL}/productos`;
const URL_CATEGORIAS = `${BASE_URL}/categoria`;

// Obtener todas las categorias
async function obtenerCategorias() {
  const res = await fetch(URL_CATEGORIAS);
  if (!res.ok) throw new Error("Error al obtener categorias");
  return await res.json();
}

// Obtener todos los productos
async function obtenerProductos() {
  const res = await fetch(URL_PRODUCTOS);
  if (!res.ok) throw new Error("Error al obtener productos");
  return await res.json();
}

// Crear producto (POST)
async function crearProducto(producto) {
  const res = await fetch(URL_PRODUCTOS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!res.ok) throw new Error("Error al crear producto");
  return await res.json();
}


// Actualizar producto o descontar stock (PUT)
async function actualizarProducto(id, datosActualizados) {
  const res = await fetch(`${URL_PRODUCTOS}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosActualizados),
  });
  if (!res.ok) throw new Error("Error al actualizar producto");
  return await res.json();
}

// Eliminar producto (DELETE)
async function eliminarProducto(id) {
  const res = await fetch(`${URL_PRODUCTOS}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar producto");
  return await res.json();
}