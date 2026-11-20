// Credenciales definidas por codigo
const USUARIO_ADMIN = "admin";
const PASSWORD_ADMIN = "fresas123";

const seccionLogin = document.getElementById("seccionLogin");
const seccionAdmin = document.getElementById("seccionAdmin");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const formLogin = document.getElementById("formLogin");
const errorLogin = document.getElementById("errorLogin");

const formProducto = document.getElementById("formProducto");
const tituloFormulario = document.getElementById("tituloFormulario");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const tablaProductos = document.getElementById("tablaProductos");
const selectCategoria = document.getElementById("categoriaId");
const buscarAdmin = document.getElementById("buscarAdmin");
const contadorAdmin = document.getElementById("contadorAdmin");
const btnRefrescar = document.getElementById("btnRefrescar");

let categoriasAdmin = [];
let productosAdmin = [];

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
});

// Control de Sesion
function verificarSesion() {
  const autenticado = sessionStorage.getItem("adminAutenticado");
  if (autenticado === "true") {
    seccionLogin.classList.add("d-none");
    seccionAdmin.classList.remove("d-none");
    btnCerrarSesion.classList.remove("d-none");
    resetearFormulario();
    cargarDatosAdmin();
  } else {
    seccionLogin.classList.remove("d-none");
    seccionAdmin.classList.add("d-none");
    btnCerrarSesion.classList.add("d-none");
  }
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("inputUsuario").value.trim();
  const pass = document.getElementById("inputPassword").value.trim();

  if (user === USUARIO_ADMIN && pass === PASSWORD_ADMIN) {
    sessionStorage.setItem("adminAutenticado", "true");
    errorLogin.classList.add("d-none");
    formLogin.reset();
    verificarSesion();
  } else {
    errorLogin.classList.remove("d-none");
  }
});

btnCerrarSesion.addEventListener("click", () => {
  sessionStorage.removeItem("adminAutenticado");
  resetearFormulario();
  verificarSesion();
});

btnRefrescar.addEventListener("click", cargarDatosAdmin);
buscarAdmin.addEventListener("input", () => renderizarTablaAdmin());

// Cargar Categorias y Productos desde MockAPI
async function cargarDatosAdmin() {
  tablaProductos.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Cargando inventario...</td></tr>`;
  try {
    const [cats, prods] = await Promise.all([
      obtenerCategorias(),
      obtenerProductos(),
    ]);
    categoriasAdmin = Array.isArray(cats) ? cats : [];
    productosAdmin = Array.isArray(prods) ? prods : [];

    llenarSelectCategoriasAdmin();
    renderizarTablaAdmin();
  } catch (error) {
    console.error("Error cargando admin:", error);
    tablaProductos.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al conectar con MockAPI. Revisa tu conexion o URL.</td></tr>`;
  }
}

function llenarSelectCategoriasAdmin() {
  selectCategoria.innerHTML = `<option value="" disabled selected>Selecciona una categoria</option>`;
  categoriasAdmin.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = String(cat.id);
    opt.textContent = `${cat.nombre} (ID: ${cat.id})`;
    selectCategoria.appendChild(opt);
  });
}

function obtenerNombreCatAdmin(id) {
  const cat = categoriasAdmin.find((c) => String(c.id) === String(id));
  return cat ? cat.nombre : `Cat ${id}`;
}

function renderizarTablaAdmin() {
  const filtro = (buscarAdmin.value || "").toLowerCase().trim();
  const filtrados = productosAdmin.filter((p) =>
    (p.nombre || "").toLowerCase().includes(filtro) ||
    obtenerNombreCatAdmin(p.categoriaId).toLowerCase().includes(filtro)
  );

  contadorAdmin.textContent = filtrados.length;
  tablaProductos.innerHTML = "";

  if (filtrados.length === 0) {
    tablaProductos.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay productos para mostrar.</td></tr>`;
    return;
  }

  filtrados.forEach((prod, index) => {
    const stockNum = Number(prod.stock) || 0;
    const precioNum = Number(prod.precio) || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="fw-bold text-muted">#${index + 1}</td>
      <td>
        <img src="${prod.imagen || 'https://placehold.co/50x50?text=Fresa'}"
             width="48" height="48"
             class="rounded object-fit-cover"
             onerror="this.src='https://placehold.co/50x50?text=Img'">
      </td>
      <td>
        <div class="fw-bold">${prod.nombre}</div>
        <div class="text-muted small text-truncate" style="max-width: 190px;">${prod.descripcion || ""}</div>
      </td>
      <td><span class="badge badge-categoria">${obtenerNombreCatAdmin(prod.categoriaId)}</span></td>
      <td class="fw-bold text-danger text-nowrap">Bs. ${precioNum.toFixed(2)}</td>
      <td>
        <div class="d-flex align-items-center gap-1">
          <span class="badge ${stockNum === 0 ? 'bg-danger' : 'bg-success'}">${stockNum}</span>
          <button type="button" class="btn btn-outline-success btn-sm py-0 px-1" title="Sumar +1 al stock" onclick="aumentarStockRapido('${prod.id}', 1)">+1</button>
          <button type="button" class="btn btn-outline-primary btn-sm py-0 px-1" title="Sumar +5 al stock" onclick="aumentarStockRapido('${prod.id}', 5)">+5</button>
          <button type="button" class="btn btn-outline-dark btn-sm py-0 px-1" title="Sumar cantidad personalizada" onclick="sumarStockPersonalizado('${prod.id}')">+N</button>
        </div>
      </td>
      <td class="text-end text-nowrap">
        <button type="button" class="btn btn-sm btn-info text-white me-1" onclick="verDetalleProducto('${prod.id}')">Ver</button>
        <button type="button" class="btn btn-sm btn-warning me-1" onclick="prepararEdicion('${prod.id}')">Editar</button>
        <button type="button" class="btn btn-sm btn-danger" onclick="borrarProducto('${prod.id}')">Eliminar</button>
      </td>
    `;
    tablaProductos.appendChild(tr);
  });
}

// Ver ficha detallada del producto (Modal)
function verDetalleProducto(id) {
  const prod = productosAdmin.find((p) => String(p.id) === String(id));
  if (!prod) return;

  const stockNum = Number(prod.stock) || 0;
  const precioNum = Number(prod.precio) || 0;

  document.getElementById("detalleImagen").src = prod.imagen || "https://placehold.co/220x220?text=Fresa";
  document.getElementById("detalleNombre").textContent = prod.nombre || "Sin nombre";
  document.getElementById("detalleCategoria").textContent = obtenerNombreCatAdmin(prod.categoriaId);
  document.getElementById("detallePrecio").textContent = `Bs. ${precioNum.toFixed(2)}`;

  const badgeStock = document.getElementById("detalleStock");
  badgeStock.textContent = stockNum === 0 ? "Agotado (0)" : `${stockNum} uds`;
  badgeStock.className = `badge ms-1 ${stockNum === 0 ? "bg-danger" : "bg-success"}`;

  document.getElementById("detalleDescripcion").textContent =
    prod.descripcion || "Deliciosa preparacion artesanal de fresas frescas con crema dulce.";

  const modal = new bootstrap.Modal(document.getElementById("modalDetalleProducto"));
  modal.show();
}

// Aumentar stock rapido (+1, +5 o cantidad personalizada)
async function aumentarStockRapido(id, cantidadExtra) {
  const prod = productosAdmin.find((p) => String(p.id) === String(id));
  if (!prod) return;

  const nuevoStock = (Number(prod.stock) || 0) + cantidadExtra;

  try {
    await actualizarProducto(id, {
      ...prod,
      precio: Number(prod.precio) || 0,
      stock: nuevoStock,
      categoriaId: String(prod.categoriaId),
    });
    await cargarDatosAdmin();
  } catch (error) {
    console.error("Error al aumentar stock:", error);
    alert("No se pudo aumentar el stock.");
  }
}

async function sumarStockPersonalizado(id) {
  const prod = productosAdmin.find((p) => String(p.id) === String(id));
  if (!prod) return;

  const entrada = prompt(`Stock actual de "${prod.nombre}": ${prod.stock}.\n¿Cuantas unidades deseas AUMENTAR?`, "10");
  if (entrada === null) return;

  const cantidad = parseInt(entrada, 10);
  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Ingresa un numero valido mayor a 0.");
    return;
  }

  await aumentarStockRapido(id, cantidad);
}

// Crear o Actualizar Producto (CRUD: Create / Update)
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("productoId").value.trim();
  const datosProducto = {
    nombre: document.getElementById("nombre").value.trim(),
    precio: Number(document.getElementById("precio").value),
    stock: parseInt(document.getElementById("stock").value, 10),
    categoriaId: String(document.getElementById("categoriaId").value),
    imagen: document.getElementById("imagen").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
  };

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (id) {
      await actualizarProducto(id, datosProducto);
      alert("Producto actualizado correctamente.");
    } else {
      await crearProducto(datosProducto);
      alert("Nuevo producto agregado al catalogo.");
    }
    resetearFormulario();
    await cargarDatosAdmin();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Ocurrio un error al guardar el producto.");
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = document.getElementById("productoId").value.trim()
      ? "Actualizar Producto"
      : "Guardar Producto";
  }
});

// Cargar datos al formulario para editar
function prepararEdicion(id) {
  const prod = productosAdmin.find((p) => String(p.id) === String(id));
  if (!prod) return;

  document.getElementById("productoId").value = prod.id;
  document.getElementById("nombre").value = prod.nombre || "";
  document.getElementById("precio").value = prod.precio ?? 0;
  document.getElementById("stock").value = prod.stock ?? 0;
  document.getElementById("categoriaId").value = String(prod.categoriaId || "");
  document.getElementById("imagen").value = prod.imagen || "";
  document.getElementById("descripcion").value = prod.descripcion || "";

  tituloFormulario.textContent = `✏️ Editando: ${prod.nombre}`;
  btnGuardar.textContent = "Actualizar Producto";
  btnCancelarEdicion.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetearFormulario() {
  formProducto.reset();
  document.getElementById("productoId").value = "";
  tituloFormulario.textContent = "➕ Agregar Nuevo Producto";
  btnGuardar.textContent = "Guardar Producto";
  btnCancelarEdicion.classList.add("d-none");
}

btnCancelarEdicion.addEventListener("click", resetearFormulario);

// Eliminar producto (CRUD: Delete)
async function borrarProducto(id) {
  const prod = productosAdmin.find((p) => String(p.id) === String(id));
  const nombreProd = prod ? prod.nombre : `ID ${id}`;

  if (!confirm(`¿Seguro que deseas eliminar "${nombreProd}"?`)) return;

  try {
    await eliminarProducto(id);
    alert("Producto eliminado.");
    await cargarDatosAdmin();
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("No se pudo eliminar el producto.");
  }
}