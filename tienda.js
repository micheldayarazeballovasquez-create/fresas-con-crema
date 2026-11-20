const contenedorProductos = document.getElementById("contenedorProductos");
const selectCategoria = document.getElementById("filtroCategoria");
const inputBuscar = document.getElementById("inputBuscar");
const contadorProductos = document.getElementById("contadorProductos");
const contadorCarrito = document.getElementById("contadorCarrito");
const listaCarrito = document.getElementById("listaCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const btnConfirmarCompra = document.getElementById("btnConfirmarCompra");

let productos = [];
let categorias = [];
let carrito = [];

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  actualizarVistaCarrito();
});

async function cargarCatalogo() {
  if (!contenedorProductos) return;

  contenedorProductos.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-2 text-muted">Cargando fresas con crema...</p>
    </div>
  `;

  try {
    const [cats, prods] = await Promise.all([
      obtenerCategorias(),
      obtenerProductos(),
    ]);
    categorias = Array.isArray(cats) ? cats : [];
    productos = Array.isArray(prods) ? prods : [];

    llenarSelectCategorias();
    renderizarProductos();
  } catch (error) {
    console.error("Error al cargar catalogo:", error);
    contenedorProductos.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger text-center">
          No se pudieron cargar los productos desde MockAPI. Revisa la consola (F12).
        </div>
      </div>
    `;
  }
}

function llenarSelectCategorias() {
  if (!selectCategoria) return;
  const valorActual = selectCategoria.value;
  selectCategoria.innerHTML = `<option value="todas">Todas las categorias</option>`;

  categorias.forEach((cat) => {
    const option = document.createElement("option");
    option.value = String(cat.id);
    option.textContent = cat.nombre;
    selectCategoria.appendChild(option);
  });

  if (valorActual) {
    selectCategoria.value = valorActual;
  }
}

function obtenerNombreCategoria(categoriaId) {
  const cat = categorias.find((c) => String(c.id) === String(categoriaId));
  return cat ? cat.nombre : "General";
}

function filtrarProductos() {
  const texto = (inputBuscar ? inputBuscar.value : "").toLowerCase().trim();
  const catSeleccionada = selectCategoria ? selectCategoria.value : "todas";

  return productos.filter((prod) => {
    const coincideNombre = (prod.nombre || "").toLowerCase().includes(texto);
    const coincideCat =
      catSeleccionada === "todas" || String(prod.categoriaId) === String(catSeleccionada);
    return coincideNombre && coincideCat;
  });
}

function renderizarProductos() {
  if (!contenedorProductos) return;

  const filtrados = filtrarProductos();
  if (contadorProductos) {
    contadorProductos.textContent = `Mostrando ${filtrados.length} producto(s)`;
  }
  contenedorProductos.innerHTML = "";

  if (filtrados.length === 0) {
    contenedorProductos.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-muted fs-5">No se encontraron productos con ese filtro.</p>
      </div>
    `;
    return;
  }

  filtrados.forEach((prod, index) => {
    const stockDisponible = Number(prod.stock) || 0;
    const precioNum = Number(prod.precio) || 0;
    const enCarrito = carrito.find((item) => String(item.id) === String(prod.id));
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    const stockRestante = Math.max(0, stockDisponible - cantidadEnCarrito);
    const sinStock = stockRestante <= 0;

    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    col.innerHTML = `
      <div class="card card-producto h-100 shadow-sm">
        <img src="${prod.imagen || 'https://placehold.co/400x300?text=Fresas+con+Crema'}"
             class="card-img-top"
             alt="${prod.nombre || 'Producto'}"
             onerror="this.src='https://placehold.co/400x300?text=Fresas+con+Crema'">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="badge bg-dark me-1">#${index + 1}</span>
              <span class="badge badge-categoria">${obtenerNombreCategoria(prod.categoriaId)}</span>
            </div>
            <span class="badge ${stockDisponible === 0 ? 'bg-danger' : 'bg-success'}">
              ${stockDisponible === 0 ? 'Agotado' : `Stock: ${stockDisponible}`}
            </span>
          </div>

          <h5 class="card-title fw-bold mb-1">${prod.nombre || "Sin nombre"}</h5>
          <p class="card-text text-muted small flex-grow-1">${prod.descripcion || ""}</p>

          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <span class="precio-texto">Bs. ${precioNum.toFixed(2)}</span>
            <button type="button"
                    class="btn btn-sm ${sinStock ? 'btn-secondary' : 'btn-fresa'}"
                    ${sinStock ? 'disabled' : ''}
                    onclick="agregarAlCarrito('${prod.id}')">
              ${sinStock ? 'Sin stock' : '+ Agregar'}
            </button>
          </div>
        </div>
      </div>
    `;

    contenedorProductos.appendChild(col);
  });
}

if (inputBuscar) inputBuscar.addEventListener("input", renderizarProductos);
if (selectCategoria) selectCategoria.addEventListener("change", renderizarProductos);

function agregarAlCarrito(id) {
  const prod = productos.find((p) => String(p.id) === String(id));
  if (!prod) return;

  const stockDisponible = Number(prod.stock) || 0;
  const existente = carrito.find((item) => String(item.id) === String(id));
  const cantidadActual = existente ? existente.cantidad : 0;

  if (cantidadActual + 1 > stockDisponible) {
    alert(`Solo hay ${stockDisponible} unidad(es) disponible(s) de "${prod.nombre}".`);
    return;
  }

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: Number(prod.precio) || 0,
      stockMax: stockDisponible,
      cantidad: 1,
    });
  }

  actualizarVistaCarrito();
  renderizarProductos();
}

function cambiarCantidadCarrito(id, delta) {
  const item = carrito.find((i) => String(i.id) === String(id));
  if (!item) return;

  const nuevaCantidad = item.cantidad + delta;
  if (nuevaCantidad <= 0) {
    carrito = carrito.filter((i) => String(i.id) !== String(id));
  } else if (nuevaCantidad > item.stockMax) {
    alert(`No puedes superar el stock disponible (${item.stockMax}).`);
    return;
  } else {
    item.cantidad = nuevaCantidad;
  }

  actualizarVistaCarrito();
  renderizarProductos();
}

function actualizarVistaCarrito() {
  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  if (contadorCarrito) contadorCarrito.textContent = totalUnidades;

  if (!listaCarrito) return;

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p class="text-muted text-center my-3">Tu carrito esta vacio.</p>`;
    if (totalCarrito) totalCarrito.textContent = "Bs. 0.00";
    if (btnConfirmarCompra) btnConfirmarCompra.disabled = true;
    return;
  }

  if (btnConfirmarCompra) btnConfirmarCompra.disabled = false;
  let total = 0;

  listaCarrito.innerHTML = carrito
    .map((item) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      return `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2 gap-2">
          <div>
            <div class="fw-bold">${item.nombre}</div>
            <small class="text-muted">Bs. ${item.precio.toFixed(2)} c/u (Disp: ${item.stockMax})</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary px-2" onclick="cambiarCantidadCarrito('${item.id}', -1)">-</button>
            <span class="fw-bold px-1">${item.cantidad}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary px-2" onclick="cambiarCantidadCarrito('${item.id}', 1)">+</button>
            <span class="ms-2 fw-bold text-danger text-nowrap">Bs. ${subtotal.toFixed(2)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (totalCarrito) totalCarrito.textContent = `Bs. ${total.toFixed(2)}`;
}

if (btnConfirmarCompra) {
  btnConfirmarCompra.addEventListener("click", async () => {
    if (carrito.length === 0) return;

    btnConfirmarCompra.disabled = true;
    btnConfirmarCompra.textContent = "Procesando...";

    try {
      for (const item of carrito) {
        const prodOriginal = productos.find((p) => String(p.id) === String(item.id));
        if (!prodOriginal) continue;

        const nuevoStock = Math.max(0, (Number(prodOriginal.stock) || 0) - item.cantidad);
        await actualizarProducto(prodOriginal.id, {
          ...prodOriginal,
          precio: Number(prodOriginal.precio) || 0,
          stock: nuevoStock,
          categoriaId: String(prodOriginal.categoriaId),
        });
      }

      alert("¡Compra confirmada! El stock se actualizo en el sistema.");
      carrito = [];
      actualizarVistaCarrito();
      await cargarCatalogo();

      const modalEl = document.getElementById("modalCarrito");
      if (modalEl && typeof bootstrap !== "undefined") {
        const modalInst = bootstrap.Modal.getInstance(modalEl);
        if (modalInst) modalInst.hide();
      }
    } catch (error) {
      console.error("Error al confirmar compra:", error);
      alert("Hubo un error al descontar el stock en MockAPI.");
    } finally {
      btnConfirmarCompra.disabled = false;
      btnConfirmarCompra.textContent = "Confirmar Compra (Descontar Stock)";
    }
  });
}